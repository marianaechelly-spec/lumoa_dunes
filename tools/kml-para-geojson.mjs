// Converte os KML georreferenciados dos lotes (pasta kml/) em src/data/lotes.js.
// Sem dependências. Uso:  node tools/kml-para-geojson.mjs
// Rode de novo sempre que trocar ou adicionar arquivos em kml/.
//
// O que entra no GeoJSON:
//   - cada Placemark chamado "LOTE N"  → Feature com { numero, nome, area_m2 }
//   - o polígono da camada LIMITE_LOTEAMENTO (se houver) → perímetro
// Polígonos sem nome de outras camadas (ex.: "Vista 1" do arquivo UNIFICAÇÃO)
// são ignorados, porque os arquivos não dizem o que representam.
// Coordenadas: só longitude e latitude (a altitude do AutoCAD é descartada).
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const KML_DIR = join(root, 'kml');
const OUT = join(root, 'src', 'data', 'lotes.js');
const R = 6371008.8; // raio médio da Terra (m)
const PERIMETRO_LAYER = 'LIMITE_LOTEAMENTO';

const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

function placemarks(xml) {
  const out = [];
  for (const m of xml.matchAll(/<Placemark\b[^>]*>([\s\S]*?)<\/Placemark>/g)) {
    const b = m[1];
    const name = decode(((b.match(/<name>([\s\S]*?)<\/name>/) || [])[1] || '').trim());
    const layer = decode(((b.match(/<SimpleData name="layer">([\s\S]*?)<\/SimpleData>/) || [])[1] || '').trim());
    // Somente o anel externo de cada polígono
    const rings = [...b.matchAll(/<outerBoundaryIs>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/g)].map((c) =>
      c[1].trim().split(/\s+/).map((p) => { const [lng, lat] = p.split(',').map(Number); return [lng, lat]; }));
    if (rings.length) out.push({ name, layer, rings });
  }
  return out;
}

// Projeção local equirretangular (precisão milimétrica para um terreno de ~100 m)
function toXY(ring, lat0, lng0) {
  const k = Math.cos(lat0 * Math.PI / 180);
  return ring.map(([lng, lat]) => [(lng - lng0) * Math.PI / 180 * R * k, (lat - lat0) * Math.PI / 180 * R]);
}
function signedArea(xy) { let a = 0; for (let i = 0; i < xy.length - 1; i++) a += xy[i][0] * xy[i + 1][1] - xy[i + 1][0] * xy[i][1]; return a / 2; }
function closeRing(ring) { const a = ring[0], b = ring[ring.length - 1]; return a[0] === b[0] && a[1] === b[1] ? ring : [...ring, a]; }
function refPoint(ring) { const pts = ring.slice(0, -1); return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]; }

function geometry(ring) {
  ring = closeRing(ring);
  const [lng0, lat0] = refPoint(ring);
  const xy = toXY(ring, lat0, lng0);
  const sa = signedArea(xy);
  // RFC 7946: anel externo no sentido anti-horário
  if (sa < 0) ring = ring.slice().reverse();
  // Centroide de área
  let cx = 0, cy = 0;
  const xyc = toXY(ring, lat0, lng0), A = Math.abs(sa);
  for (let i = 0; i < xyc.length - 1; i++) { const f = xyc[i][0] * xyc[i + 1][1] - xyc[i + 1][0] * xyc[i][1]; cx += (xyc[i][0] + xyc[i + 1][0]) * f; cy += (xyc[i][1] + xyc[i + 1][1]) * f; }
  cx /= 6 * A; cy /= 6 * A;
  const k = Math.cos(lat0 * Math.PI / 180);
  const centro = [lng0 + cx / (R * k) * 180 / Math.PI, lat0 + cy / R * 180 / Math.PI];
  const round = (v) => Math.round(v * 1e8) / 1e8;
  return { coords: ring.map(([lng, lat]) => [round(lng), round(lat)]), area: Math.round(A * 100) / 100, centro: centro.map(round) };
}

// ---------------------------------------------------------------------------
const files = readdirSync(KML_DIR).filter((f) => f.toLowerCase().endsWith('.kml')).sort();
if (!files.length) { console.error('Nenhum .kml em ' + KML_DIR); process.exit(1); }

const lotes = new Map(); // numero → { geo, fonte }
let perimetro = null;
const avisos = [];
// Arquivos individuais têm prioridade; o arquivo unificado só completa o que faltar.
const ordem = [...files.filter((f) => !/unifica/i.test(f)), ...files.filter((f) => /unifica/i.test(f))];

for (const f of ordem) {
  for (const pm of placemarks(readFileSync(join(KML_DIR, f), 'utf8'))) {
    const m = pm.name.match(/^LOTE\s*0*(\d+)$/i);
    if (m) {
      const n = Number(m[1]), geo = geometry(pm.rings[0]);
      const prev = lotes.get(n);
      if (prev) {
        const d = Math.max(...prev.geo.coords.map((p, i) => { const q = geo.coords[i] || [Infinity, Infinity]; return Math.hypot(p[0] - q[0], p[1] - q[1]); }));
        if (prev.geo.coords.length !== geo.coords.length || d > 1e-7) avisos.push(`Lote ${n}: coordenadas diferentes entre "${prev.fonte}" e "${f}" (mantido "${prev.fonte}")`);
        continue;
      }
      lotes.set(n, { geo, fonte: f });
    } else if (pm.layer === PERIMETRO_LAYER && !perimetro) {
      perimetro = geometry(pm.rings[0]);
    }
  }
}

const numeros = [...lotes.keys()].sort((a, b) => a - b);
const max = numeros[numeros.length - 1] || 0;
for (let i = 1; i <= max; i++) if (!lotes.has(i)) avisos.push(`Lote ${i} não encontrado nos KML`);

const features = numeros.map((n) => {
  const { geo } = lotes.get(n);
  return { type: 'Feature', properties: { numero: n, nome: `Lote ${String(n).padStart(2, '0')}`, area_m2: geo.area }, geometry: { type: 'Polygon', coordinates: [geo.coords] } };
});
if (perimetro) features.push({ type: 'Feature', properties: { nome: 'Limite do loteamento', camada: PERIMETRO_LAYER, area_m2: perimetro.area }, geometry: { type: 'Polygon', coordinates: [perimetro.coords] } });

// Centro do condomínio: centroide do perímetro; sem perímetro, média dos centros dos lotes
const centro = perimetro ? perimetro.centro : (() => {
  const c = numeros.map((n) => lotes.get(n).geo.centro);
  return [c.reduce((s, p) => s + p[0], 0) / c.length, c.reduce((s, p) => s + p[1], 0) / c.length].map((v) => Math.round(v * 1e8) / 1e8);
})();

const geojson = { type: 'FeatureCollection', features };
const js = `/* ARQUIVO GERADO por tools/kml-para-geojson.mjs a partir da pasta kml/ — não edite à mão.
   Para atualizar: troque os KML em kml/ e rode  node tools/kml-para-geojson.mjs
   ${numeros.length} lotes${perimetro ? ' + perímetro (' + PERIMETRO_LAYER + ')' : ''} · coordenadas [longitude, latitude] (WGS 84)
   Áreas calculadas a partir das coordenadas dos KML. */
window.Lumoa = window.Lumoa || {};
window.Lumoa.lotesGeo = {
  centro: { lat: ${centro[1]}, lng: ${centro[0]}, origem: '${perimetro ? 'centroide do perímetro' : 'média dos lotes'}' },
  geojson: ${JSON.stringify(geojson)},
};
`;
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, js);

console.log(`ok: ${numeros.length} lotes${perimetro ? ' + perímetro' : ''} → ${OUT.replace(root, '.').replace(/\\/g, '/')}`);
console.log(`centro (${perimetro ? 'perímetro' : 'média dos lotes'}): lat ${centro[1]}, lng ${centro[0]}`);
const areas = numeros.map((n) => lotes.get(n).geo.area);
if (areas.length) console.log(`áreas: ${Math.min(...areas)} a ${Math.max(...areas)} m²`);
avisos.forEach((a) => console.warn('AVISO: ' + a));
