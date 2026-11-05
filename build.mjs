// Build sem dependências: junta estilos e scripts em um único index.html.
// Uso: node build.mjs   →  dist/site (documento completo)  e  dist/artifact (artefato Claude)
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(join(root, 'src', p), 'utf8');

const STYLES = ['styles/tokens.css', 'styles/base.css', 'styles/site.css', 'styles/maquete.css', 'styles/luna.css', 'styles/responsive.css'];
const SCRIPTS = [
  'config.js',
  'data/empreendimento.js',
  'components/ui.js',
  'services/leads.js',
  'services/luna-ai.js',
  'luna/knowledge.js',
  'luna/engine.js',
  'luna/widget.js',
  'components/layout.js',
  'components/maquete-gl.js',
  'components/maquete.js',
  'components/lazer.js',
  'components/casas.js',
  'components/galeria.js',
  'components/contato.js',
  'components/hero.js',
  'main.js',
];

const css = STYLES.map((f) => `/* ${f} */\n` + src(f)).join('\n');
const js = SCRIPTS.map((f) => `/* ${f} */\n` + src(f)).join('\n');
let body = src('index.html')
  .replace('<!--STYLES-->', () => `<style>\n${css}\n</style>`)
  .replace('<!--SCRIPTS-->', () => `<script>\n${js}\n</script>`);

// Recursos usados por máscara CSS e textura WebGL vão embutidos (funcionam até abrindo o arquivo direto do computador)
const b64 = (f) => readFileSync(join(root, f)).toString('base64');
const LOGO = 'data:image/webp;base64,' + b64('assets/img/logo-mask.webp');
const PLAN = 'data:image/webp;base64,' + b64('assets/img/implantacao.webp');
body = body.split('url(assets/img/logo-branco.png)').join(`url(${LOGO})`).replace("img.src = 'assets/img/implantacao.webp';", () => `img.src = '${PLAN}';`);

const head = body.match(/^[\s\S]*?(?=<svg width="0")/)[0];
const rest = body.slice(head.length);

const full = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0c3b3c">
<meta property="og:title" content="Lumoa Dunes — Santo Amaro, Lençóis Maranhenses">
<meta property="og:description" content="Onde a exclusividade encontra a natureza. 32 lotes de 200 m², lazer completo e dois projetos de casas.">
<meta property="og:image" content="assets/img/dunas-aereo.webp">
${head}</head>
<body>
${rest}</body>
</html>
`;

for (const [dir, html] of [['dist/site', full], ['dist/artifact', body]]) {
  const out = join(root, dir);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'index.html'), html);
  cpSync(join(root, 'assets'), join(out, 'assets'), { recursive: true });
}
console.log(`ok: ${(body.length / 1024).toFixed(0)} KB de HTML, ${SCRIPTS.length} scripts, ${STYLES.length} folhas de estilo`);
