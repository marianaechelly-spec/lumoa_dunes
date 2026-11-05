/* =========================================================================
   Maquete 3D em WebGL2 — luz de fim de tarde, sombras, vegetação e água
   Renderizador próprio (sem bibliotecas). Lê a câmera de Lumoa.maquete.st:
     rz → azimute · rx → inclinação (0 = vista de cima) · s → aproximação
     fx/fy → ponto focal sobre a planta (pixels da imagem da implantação)
   ========================================================================= */
(function (L) {
  const W = 560, H = Math.round(560 * 1369 / 1080);
  const PX = (x, y) => [x / 100 * W, y / 100 * H];
  const COLS = [[6.0, 22.7, 'e'], [30.9, 48.8, 'w'], [50.1, 67.7, 'e'], [75.3, 93.2, 'w']];
  const ROW0 = 18.5, ROWH = (74.6 - 18.5) / 8;

  /* ------------------------------ Matemática ------------------------------ */
  const m4 = {
    mul(a, b) { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; },
    persp(f, asp, n, fa) { const t = 1 / Math.tan(f / 2), o = new Float32Array(16); o[0] = t / asp; o[5] = t; o[10] = (fa + n) / (n - fa); o[11] = -1; o[14] = 2 * fa * n / (n - fa); return o; },
    ortho(l, r, b, t, n, f) { const o = new Float32Array(16); o[0] = 2 / (r - l); o[5] = 2 / (t - b); o[10] = -2 / (f - n); o[12] = -(r + l) / (r - l); o[13] = -(t + b) / (t - b); o[14] = -(f + n) / (f - n); o[15] = 1; return o; },
    look(e, c, u) {
      let z = norm([e[0] - c[0], e[1] - c[1], e[2] - c[2]]), x = norm(cross(u, z)), y = cross(z, x);
      return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1]);
    },
    // T * Ry * Rx * S
    trs(x, y, z, ry, rx, sx, sy, sz) {
      const cy = Math.cos(ry), sy_ = Math.sin(ry), cx = Math.cos(rx), sx_ = Math.sin(rx);
      // R = Ry*Rx
      const r00 = cy, r01 = sy_ * sx_, r02 = sy_ * cx, r10 = 0, r11 = cx, r12 = -sx_, r20 = -sy_, r21 = cy * sx_, r22 = cy * cx;
      return new Float32Array([r00 * sx, r10 * sx, r20 * sx, 0, r01 * sy, r11 * sy, r21 * sy, 0, r02 * sz, r12 * sz, r22 * sz, 0, x, y, z, 1]);
    },
    inv(m) { const a = m, o = new Float32Array(16);
      const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4], b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6], b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12], b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
      const d = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
      o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * d; o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * d; o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * d; o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * d;
      o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * d; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * d; o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * d; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * d;
      o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * d; o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * d; o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * d; o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * d;
      o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * d; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * d; o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * d; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * d;
      return o; },
  };
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

  /* ------------------------------ Malhas ------------------------------ */
  function cubeMesh() { // base no chão: x,z ∈ [-0.5,0.5], y ∈ [0,1]
    const p = [], n = [];
    const F = [[[0, 1, 0], [[-.5, 1, -.5], [-.5, 1, .5], [.5, 1, .5], [.5, 1, -.5]]], [[0, -1, 0], [[-.5, 0, -.5], [.5, 0, -.5], [.5, 0, .5], [-.5, 0, .5]]],
      [[0, 0, 1], [[-.5, 0, .5], [.5, 0, .5], [.5, 1, .5], [-.5, 1, .5]]], [[0, 0, -1], [[.5, 0, -.5], [-.5, 0, -.5], [-.5, 1, -.5], [.5, 1, -.5]]],
      [[1, 0, 0], [[.5, 0, .5], [.5, 0, -.5], [.5, 1, -.5], [.5, 1, .5]]], [[-1, 0, 0], [[-.5, 0, -.5], [-.5, 0, .5], [-.5, 1, .5], [-.5, 1, -.5]]]];
    F.forEach(([nn, v]) => [0, 1, 2, 0, 2, 3].forEach((i) => { p.push(...v[i]); n.push(...nn); }));
    return { p, n };
  }
  function sphereMesh(seg = 10, rings = 7) { // esfera unitária com base em y=0 (centro em y=0.5)
    const p = [], n = [];
    const pt = (i, j) => { const th = j / rings * Math.PI, ph = i / seg * Math.PI * 2; return [Math.sin(th) * Math.cos(ph) * .5, Math.cos(th) * .5 + .5, Math.sin(th) * Math.sin(ph) * .5]; };
    for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) {
      const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
      [a, d, c, a, c, b].forEach((v) => { p.push(...v); n.push(v[0] * 2, (v[1] - .5) * 2, v[2] * 2); });
    }
    return { p, n };
  }

  /* ------------------------------ Shaders ------------------------------ */
  const VS = `#version 300 es
  layout(location=0) in vec3 aP; layout(location=1) in vec3 aN;
  uniform mat4 uVP, uM, uLVP; uniform mat3 uNM;
  out vec3 vN; out vec3 vW; out vec4 vL;
  void main(){ vec4 w = uM*vec4(aP,1.); vW=w.xyz; vN=normalize(uNM*aN); vL=uLVP*w; gl_Position=uVP*w; }`;
  const FS = `#version 300 es
  precision highp float;
  in vec3 vN; in vec3 vW; in vec4 vL;
  uniform vec3 uC, uSun, uSunC, uSky, uGnd, uEye, uFog; uniform int uMode; uniform float uT, uFogK;
  uniform sampler2D uTex, uSh; uniform vec2 uPlan;
  out vec4 o;
  float shadow(){ vec3 p=vL.xyz/vL.w*.5+.5; if(p.x<0.||p.x>1.||p.y<0.||p.y>1.) return 1.; float s=0.; vec2 t=1./vec2(textureSize(uSh,0));
    for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++){ float d=texture(uSh,p.xy+vec2(x,y)*t*1.5).r; s+= p.z-.0016>d?0.:1.; } return s/9.; }
  float hash(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5); }
  void main(){
    vec3 N=normalize(vN); vec3 base=uC; float spec=0.;
    if(uMode==1){ vec2 uv=vW.xz/uPlan; vec4 tx=(uv.x>=0.&&uv.x<=1.&&uv.y>=0.&&uv.y<=1.)?texture(uTex,uv):vec4(0.);
      vec3 sand=vec3(.93,.87,.76)*(.94+.06*hash(floor(vW.xz*.5)));
      float dEdge=length(max(abs(uv-.5)-.5,0.))*900.; sand=mix(sand, vec3(.86,.80,.68), clamp(dEdge/400.,0.,1.)*.6);
      base=mix(sand, pow(tx.rgb, vec3(1.05)), smoothstep(.35,.7,tx.a)); }
    if(uMode==2){ float w=sin(vW.x*.35+uT*1.6)*sin(vW.z*.4-uT*1.2)*.5+.5; base=mix(vec3(.10,.55,.58),vec3(.45,.85,.86),w*.55); N=normalize(vec3(sin(vW.x*.6+uT*2.)*.12,1.,cos(vW.z*.6+uT*1.7)*.12)); spec=1.; }
    if(uMode==4){ float w=sin(vW.x*.02+uT*.4)*sin(vW.z*.025-uT*.3)*.5+.5; base=mix(vec3(.16,.62,.62),vec3(.38,.80,.78),w); spec=.6; N=vec3(0.,1.,0.); }
    float sh=shadow();
    float dif=max(dot(N,uSun),0.)*sh;
    vec3 hemi=mix(uGnd,uSky,N.y*.5+.5);
    vec3 col=uMode==3 ? base*(.80+.28*max(dot(N,uSun),0.)) : base*(hemi*.55 + uSunC*dif*1.05);
    if(uMode==2) N=vec3(0.,1.,0.)*.0+N;
    vec3 V=normalize(uEye-vW); vec3 Hh=normalize(V+uSun);
    col+= uSunC*pow(max(dot(N,Hh),0.),uMode==2?90.:28.)*(spec>0.?1.1:.08)*sh;
    float f=1.-exp(-uFogK*length(uEye-vW)); col=mix(col,uFog,clamp(f,0.,.85));
    o=vec4(pow(col,vec3(.96)),1.);
  }`;
  const SVS = `#version 300 es
  layout(location=0) in vec3 aP; uniform mat4 uLVP, uM; void main(){ gl_Position=uLVP*uM*vec4(aP,1.); }`;
  const SFS = `#version 300 es
  precision mediump float; out vec4 o; void main(){ o=vec4(1.); }`;
  const BVS = `#version 300 es
  out vec2 v; void main(){ vec2 p=vec2((gl_VertexID<<1)&2, gl_VertexID&2); v=p; gl_Position=vec4(p*2.-1.,0.,1.); }`;
  const BFS = `#version 300 es
  precision mediump float; in vec2 v; uniform vec3 uTop,uHor,uSunP; out vec4 o;
  void main(){ float t=smoothstep(0.,1.,v.y); vec3 c=mix(uHor,uTop,pow(t,.8)); float g=exp(-length((v-uSunP.xy)*vec2(1.6,1.))*3.2); c+=vec3(1.,.78,.5)*g*.35; o=vec4(c,1.); }`;

  function prog(gl, vs, fs) {
    const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
    return { p, u };
  }

  /* ------------------------------ Cena ------------------------------ */
  const C = {
    white: hex('#fbfaf7'), wall2: hex('#ece5d8'), teal: hex('#2fa79b'), tealD: hex('#1d7a71'), wood: hex('#b78452'), woodD: hex('#8a5f36'),
    glass: hex('#2b4a52'), roof: hex('#b0613f'), trunk: hex('#8b6a4a'), leaf: hex('#3f7f3a'), leaf2: hex('#5a9a45'), tree: hex('#4d8a3f'), tree2: hex('#386f33'),
    stone: hex('#d9cfbf'), dune: hex('#f6ecdb'), dune2: hex('#efe2cb'), gold: hex('#d6bd92'), sandWall: hex('#e7dccb'), court: hex('#e9d6ae'),
  };

  function buildScene() {
    const items = []; // {mesh:'cube'|'sphere'|'water', m: Float32Array, nm, color, mode}
    const add = (mesh, x, y, z, w, hh, d, color, ry = 0, rx = 0, mode = 0) => items.push({ mesh, x, y, z, w, hh, d, color, ry, rx, mode });
    const box = (x0, z0, w, d, y, hh, color, ry = 0) => add('cube', x0 + w / 2, y, z0 + d / 2, w, hh, d, color, ry);
    // Muro perimetral baixo
    const wall = (a, b) => { const [x0, z0] = PX(...a), [x1, z1] = PX(...b); const len = Math.hypot(x1 - x0, z1 - z0); add('cube', (x0 + x1) / 2, 0, (z0 + z1) / 2, len, 7, 1.6, C.sandWall, -Math.atan2(z1 - z0, x1 - x0)); };
    wall([3.6, 0.6], [3.6, 82]); wall([3.6, 0.6], [40, 3.5]); wall([40, 3.5], [97.5, 14]); wall([97.5, 14], [97.5, 92]);

    // Casas nos 32 lotes (volumetria ilustrativa)
    let n = 0;
    COLS.forEach(([a, b, face]) => {
      for (let r = 0; r < 8; r++) {
        n++;
        const [x0, z0] = PX(a, ROW0 + r * ROWH), [x1, z1] = PX(b, ROW0 + (r + 1) * ROWH);
        const lw = x1 - x0, ld = z1 - z0;
        const two = n % 3 === 0; // alterna térrea / dois pavimentos
        const hw = lw * 0.55, hd = ld * 0.66;
        const front = face === 'e' ? 1 : -1; // lado da rua
        const hx = face === 'e' ? x0 + lw * 0.06 : x1 - lw * 0.06 - hw;
        const hz = z0 + (ld - hd) / 2;
        const hgt = two ? 28 : 15;
        box(hx, hz, hw, hd, 0, hgt, C.white);
        box(hx - 1.5, hz - 1.5, hw + 3, hd + 3, hgt, 1.6, C.white); // laje com beiral
        box(hx + hw * 0.45, hz - 0.8, hw * 0.4, 0.8, 4, hgt * 0.5, C.glass); // janela lateral
        box(hx + hw * 0.45, hz + hd, hw * 0.4, 0.8, 4, hgt * 0.5, C.glass);
        if (two) box(hx - 1.5, hz - 1.5, hw + 3, hd + 3, 14, 1.2, C.wall2); // marca do pavimento
        // volume turquesa característico
        const tw = hw * 0.32, tx = face === 'e' ? hx + hw * 0.06 : hx + hw - tw - hw * 0.06;
        box(tx, hz + hd * 0.2, tw, hd * 0.6, hgt, 13, C.teal);
        // painel de madeira na fachada voltada para a rua + vidro
        const fx = face === 'e' ? hx + hw : hx - 1.2;
        box(fx, hz + hd * 0.08, 1.2, hd * 0.4, 0, hgt * 0.9, C.wood);
        box(fx, hz + hd * 0.55, 1.2, hd * 0.32, 3, hgt * 0.62, C.glass);
        // pergolado/garagem em frente
        const gx = face === 'e' ? hx + hw + 2 : x0 + lw * 0.06 - 0 + (lw - hw - lw * 0.12) * 0 + 2;
        const gw = lw - hw - lw * 0.12 - 4;
        if (gw > 6) box(face === 'e' ? hx + hw + 2 : x0 + lw * 0.06 + 2, hz + hd * 0.05, gw, hd * 0.5, 11, 1.4, C.wood);
        // piscina privativa (fundo do lote)
        const px = face === 'e' ? hx + hw * 0.62 : hx + hw * 0.06;
        add('water', px + hw * 0.16, 0.35, hz + hd + 1 + ld * 0.08, hw * 0.32, 0.5, ld * 0.14, C.teal, 0, 0, 2);
      }
    });

    // Núcleo de lazer: torre do rooftop com mirante, churrasqueira, gazebo, piscina
    const [tx, tz] = PX(4.6, 6.0);
    box(tx, tz, 30, 34, 0, 62, C.white);
    for (let k = 0; k < 4; k++) box(tx - 2, tz + 4 + k * 0, 34, 1.5, 12 + k * 14, 1.2, C.woodD); // ripados
    box(tx + 3, tz + 3, 24, 28, 62, 16, C.teal);
    box(tx - 4, tz - 3, 38, 40, 78, 1.5, C.woodD); // cobertura do mirante
    const [cx, cz] = PX(6.4, 11.6); box(cx, cz, 40, 30, 0, 12, C.wall2); box(cx - 2, cz - 2, 44, 34, 12, 2.5, C.roof);
    const [gx, gz] = PX(4.6, 0.9); box(gx, gz, 20, 18, 0, 1, C.stone);
    [[0, 0], [17, 0], [0, 15], [17, 15]].forEach(([a, b]) => box(gx + a, gz + b, 3, 3, 0, 12, C.woodD));
    box(gx - 3, gz - 3, 26, 24, 12, 2, C.wood);
    const [pw0, pz0] = PX(14.6, 2.0), [pw1, pz1] = PX(25.0, 8.6);
    box(pw0 - 3, pz0 - 3, pw1 - pw0 + 6, pz1 - pz0 + 6, 0, 1.2, C.stone);
    add('water', (pw0 + pw1) / 2, 1.3, (pz0 + pz1) / 2, pw1 - pw0, 0.4, pz1 - pz0, C.teal, 0, 0, 2);
    // Portaria, guarderia e quadra
    const [ptx, ptz] = PX(70.8, 85.4); box(ptx, ptz, 28, 15, 0, 15, C.white); box(ptx - 2, ptz - 2, 32, 19, 15, 2, C.wood); box(ptx + 28, ptz + 2, 2, 11, 0, 14, C.teal);
    const [qx, qz] = PX(76.4, 77.0); [[0, 0], [40, 0], [0, 18], [40, 18]].forEach(([a, b]) => box(qx + a, qz + b, 2, 2, 0, 12, C.woodD)); box(qx - 2, qz - 2, 46, 24, 12, 1.4, C.wood);
    const [bx, bz] = PX(86.0, 76.5); box(bx, bz, 30, 26, 0, 0.6, C.court);

    // Vegetação: palmeiras e árvores (posições aproximadas da planta)
    const palm = (px, py, s = 1, seed = 0) => {
      const [x, z] = PX(px, py), h = (26 + (seed % 5) * 3) * s;
      add('cube', x, 0, z, 1.6 * s, h, 1.6 * s, C.trunk, seed, 0.05);
      for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + seed; add('cube', x + Math.cos(a) * 5 * s, h - 1, z + Math.sin(a) * 5 * s, 3.2 * s, 0.8, 12 * s, k % 2 ? C.leaf : C.leaf2, -a + Math.PI / 2, 0.42); }
    };
    const tree = (px, py, s = 1, c = C.tree) => { const [x, z] = PX(px, py); add('cube', x, 0, z, 1.8, 8 * s, 1.8, C.trunk); add('sphere', x, 5 * s, z, 16 * s, 14 * s, 16 * s, c); };
    for (let x = 30.5, i = 0; x <= 70; x += 3.1, i++) palm(x, 76.2 + (i % 2) * 0.9, 1, i);
    for (let x = 77, i = 0; x <= 93; x += 3.4, i++) palm(x, 78.8, 0.9, i + 3);
    [[19.5, 17.4], [23.5, 18.2], [26, 9.5], [22, 6], [28, 4.6], [82, 88], [86.5, 89], [91, 88.5], [72, 80.2], [26.5, 70]].forEach(([a, b], i) => palm(a, b, 1, i + 7));
    [[37, 12], [41, 13.5], [44.5, 11.6], [54, 15], [58, 16], [74, 10.5], [78, 12.8], [93.5, 15.5], [96, 18], [33.5, 15]].forEach(([a, b], i) => tree(a, b, 1 + (i % 3) * 0.12, i % 2 ? C.tree : C.tree2));
    for (let y = 22, i = 0; y <= 72; y += 6.5, i++) tree(73.3, y, 0.62, i % 2 ? C.tree : C.tree2); // canteiro central
    // Paisagem dos Lençóis: dunas e lagoas ao redor do condomínio
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 46; i++) {
      const ang = rnd() * Math.PI * 2, rad = 760 + rnd() * 800;
      const x = W / 2 + Math.cos(ang) * rad * 1.1, z = H / 2 + Math.sin(ang) * rad;
      const s = 220 + rnd() * 300;
      add('dome', x, -s * 0.12, z, s * (1.5 + rnd()), s * (0.2 + rnd() * 0.16), s, i % 3 ? C.dune : C.dune2, rnd() * 3, 0, 3);
      if (i % 2 === 0) add('pond', x + Math.cos(ang + 1.6) * s * 1.1, 0.25, z + Math.sin(ang + 1.6) * s * 0.9, s * (0.8 + rnd() * 0.7), 0.3, s * (0.35 + rnd() * 0.3), C.teal, rnd() * 3, 0, 4);
    }
    return items;
  }

  /* ------------------------------ Renderizador ------------------------------ */
  const GL = {
    ok: false,
    init(view, M) {
      const cv = document.createElement('canvas');
      cv.className = 'm3gl';
      const gl = cv.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: false });
      if (!gl) return false;
      try {
        this.gl = gl; this.cv = cv; this.M = M; this.view = view;
        this.P = prog(gl, VS, FS); this.S = prog(gl, SVS, SFS); this.B = prog(gl, BVS, BFS);
        this.meshes = {};
        const up = (name, m) => {
          const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
          const b1 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b1); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.p), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
          const b2 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b2); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.n), gl.STATIC_DRAW); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
          this.meshes[name] = { vao, n: m.p.length / 3 };
        };
        const cube = cubeMesh(); up('cube', cube); up('water', cube); up('sphere', sphereMesh(12, 8)); up('dome', sphereMesh(32, 18)); up('pond', sphereMesh(32, 4));
        // chão: um grande quadrado
        up('ground', { p: [-900, 0, -900, -900, 0, 1700, 1500, 0, 1700, -900, 0, -900, 1500, 0, 1700, 1500, 0, -900], n: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0] });
        // textura da planta
        this.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
        const img = new Image();
        img.onload = () => { gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); const an = gl.getExtension('EXT_texture_filter_anisotropic'); if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, 8); this.dirty = true; };
        img.src = 'assets/img/implantacao.webp';
        // mapa de sombras
        this.SM = 2048;
        this.shTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.shTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, this.SM, this.SM, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST));
        [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
        this.fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shTex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // objetos
        this.items = buildScene().map((it) => {
          const m = m4.trs(it.x, it.y, it.z, it.ry, it.rx, it.w, it.hh, it.d);
          const nmFull = m4.trs(0, 0, 0, it.ry, it.rx, 1 / it.w, 1 / it.hh, 1 / it.d);
          const nm = new Float32Array([nmFull[0], nmFull[1], nmFull[2], nmFull[4], nmFull[5], nmFull[6], nmFull[8], nmFull[9], nmFull[10]]);
          return { mesh: it.mesh, m, nm, c: it.color, mode: it.mode };
        });
        this.ground = { mesh: 'ground', m: m4.trs(0, 0, 0, 0, 0, 1, 1, 1), nm: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]), c: [1, 1, 1], mode: 1 };
        this.hl = null;
        // sol de fim de tarde
        this.sun = norm([0.78, 0.40, -0.22]);
        const ctr = [W / 2, 0, H / 2];
        const lv = m4.look([ctr[0] + this.sun[0] * 1100, this.sun[1] * 1100, ctr[2] + this.sun[2] * 1100], ctr, [0, 1, 0]);
        this.LVP = m4.mul(m4.ortho(-620, 620, -620, 620, 10, 2600), lv);
        this.shadowDirty = true;
        view.prepend(cv);
        this.resize(); addEventListener('resize', () => this.resize());
        this.pinsLayer();
        view.addEventListener('click', (e) => this.pick(e));
        this.ok = true;
        return true;
      } catch (e) { console.warn('[Maquete] WebGL indisponível, usando a versão em CSS 3D.', e); return false; }
    },

    resize() {
      const r = this.view.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      this.cv.width = Math.round(r.width * d); this.cv.height = Math.round(r.height * d);
      this.w = r.width; this.h = r.height;
    },

    camera(st) {
      const az = st.rz * Math.PI / 180, el = (90 - Math.min(80, Math.max(0, st.rx))) * Math.PI / 180;
      const fit = Math.max(1, 620 / Math.min(this.w, this.h * 1.3)) * (this.w < 700 ? 0.72 : 1);
      const dist = 980 * fit / st.s;
      const tgt = [st.fx, 0, st.fy];
      const eye = [tgt[0] + Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist + 2, tgt[2] + Math.cos(az) * Math.cos(el) * dist];
      const up = el > 1.5 ? [-Math.sin(az), 0, -Math.cos(az)] : [0, 1, 0];
      const V = m4.look(eye, tgt, up), P = m4.persp(0.62, this.w / this.h, 4, 4000);
      this.VP = m4.mul(P, V); this.eye = eye;
      return this.VP;
    },

    draw(prog, it, shadow) {
      const gl = this.gl, me = this.meshes[it.mesh];
      gl.uniformMatrix4fv(prog.u.uM, false, it.m);
      if (!shadow) { gl.uniformMatrix3fv(prog.u.uNM, false, it.nm); gl.uniform3fv(prog.u.uC, it.c); gl.uniform1i(prog.u.uMode, it.mode); }
      gl.bindVertexArray(me.vao); gl.drawArrays(gl.TRIANGLES, 0, me.n);
    },

    render(st, t) {
      if (!this.ok) return;
      const gl = this.gl;
      gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
      // sombras (estáticas: recalcula só quando necessário)
      if (this.shadowDirty) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo); gl.viewport(0, 0, this.SM, this.SM); gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.useProgram(this.S.p); gl.uniformMatrix4fv(this.S.u.uLVP, false, this.LVP);
        gl.cullFace(gl.FRONT);
        this.items.forEach((it) => { if (it.mode === 0) this.draw(this.S, it, true); });
        gl.cullFace(gl.BACK);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); this.shadowDirty = false;
      }
      gl.viewport(0, 0, this.cv.width, this.cv.height);
      gl.clearColor(0.05, 0.2, 0.21, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // céu
      const VP = this.camera(st);
      gl.disable(gl.DEPTH_TEST); gl.useProgram(this.B.p);
      gl.uniform3fv(this.B.u.uTop, [0.09, 0.27, 0.31]); gl.uniform3fv(this.B.u.uHor, [0.93, 0.80, 0.64]); gl.uniform3fv(this.B.u.uSunP, [0.2, 0.32, 0]);
      gl.bindVertexArray(null); gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.DEPTH_TEST);
      // cena
      const P = this.P; gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uVP, false, VP); gl.uniformMatrix4fv(P.u.uLVP, false, this.LVP);
      gl.uniform3fv(P.u.uSun, this.sun); gl.uniform3fv(P.u.uSunC, [1.0, 0.86, 0.68]); gl.uniform3fv(P.u.uSky, [0.58, 0.70, 0.78]); gl.uniform3fv(P.u.uGnd, [0.62, 0.55, 0.46]);
      gl.uniform3fv(P.u.uEye, this.eye); gl.uniform3fv(P.u.uFog, [0.90, 0.80, 0.66]); gl.uniform1f(P.u.uFogK, 0.00032); gl.uniform1f(P.u.uT, t / 1000);
      gl.uniform2fv(P.u.uPlan, [W, H]);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.uniform1i(P.u.uTex, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.shTex); gl.uniform1i(P.u.uSh, 1);
      this.draw(P, this.ground);
      this.items.forEach((it) => this.draw(P, it));
      if (this.hl) this.draw(P, this.hl);
      this.placePins(VP);
    },

    /* Marcadores em HTML projetados da cena 3D */
    pinsLayer() {
      this.layer = document.createElement('div'); this.layer.className = 'm3gl-pins'; this.view.append(this.layer);
      this.pins = L.data.lazer.map((it) => {
        const [x, z] = PX(it.pos[0], it.pos[1]);
        const y = it.id === 'rooftop' ? 96 : it.id === 'gazebo' ? 30 : it.id === 'churrasqueira' ? 30 : 26;
        const el = document.createElement('div'); el.className = 'gpin'; el.dataset.id = it.id; el.dataset.group = it.grupo;
        el.innerHTML = `<button type="button" aria-label="${it.n}. ${it.nome}">${it.n}</button><span>${it.nome}</span>`;
        el.querySelector('button').addEventListener('click', (e) => { e.stopPropagation(); this.M.select(it.id); });
        this.layer.append(el);
        return { el, p: [x, y, z], g: [x, 0, z] };
      });
    },
    project(VP, p) {
      const x = VP[0] * p[0] + VP[4] * p[1] + VP[8] * p[2] + VP[12], y = VP[1] * p[0] + VP[5] * p[1] + VP[9] * p[2] + VP[13], w = VP[3] * p[0] + VP[7] * p[1] + VP[11] * p[2] + VP[15];
      return [(x / w * 0.5 + 0.5) * this.w, (1 - (y / w * 0.5 + 0.5)) * this.h, w];
    },
    placePins(VP) {
      this.pins.forEach((p) => {
        const [sx, sy, w] = this.project(VP, p.p), [gx, gy] = this.project(VP, p.g);
        const vis = w > 0 && sx > -40 && sx < this.w + 40 && sy > -40 && sy < this.h + 40;
        p.el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
        p.el.style.setProperty('--stem', Math.max(0, gy - sy).toFixed(1) + 'px');
        p.el.style.visibility = vis ? 'visible' : 'hidden';
      });
    },
    setActive(id) { this.pins.forEach((p) => p.el.classList.toggle('is-on', p.el.dataset.id === id)); this.hl = null; },
    setFilter(f) { this.pins.forEach((p) => p.el.classList.toggle('is-dim', !(f === 'todos' || p.el.dataset.group === f))); },

    // Clique no chão: identifica o lote
    pick(e) {
      if (this.M.dragged) return;
      if (e.target.closest('.gpin')) return;
      const r = this.view.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width * 2 - 1, ny = 1 - (e.clientY - r.top) / r.height * 2;
      const inv = m4.inv(this.VP);
      const un = (z) => { const v = [inv[0] * nx + inv[4] * ny + inv[8] * z + inv[12], inv[1] * nx + inv[5] * ny + inv[9] * z + inv[13], inv[2] * nx + inv[6] * ny + inv[10] * z + inv[14], inv[3] * nx + inv[7] * ny + inv[11] * z + inv[15]]; return [v[0] / v[3], v[1] / v[3], v[2] / v[3]]; };
      const a = un(-1), b = un(1); const t = a[1] / (a[1] - b[1]);
      if (!(t > 0)) return;
      const x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t;
      const px = x / W * 100, py = z / H * 100;
      for (const [c0, c1] of COLS) {
        if (px >= c0 && px <= c1 && py >= ROW0 && py <= ROW0 + 8 * ROWH) {
          const r_ = Math.floor((py - ROW0) / ROWH);
          const [x0, z0] = PX(c0, ROW0 + r_ * ROWH), [x1, z1] = PX(c1, ROW0 + (r_ + 1) * ROWH);
          this.pins.forEach((p) => p.el.classList.remove('is-on'));
          this.hl = { mesh: 'cube', m: m4.trs((x0 + x1) / 2, 0.2, (z0 + z1) / 2, 0, 0, x1 - x0 - 2, 0.6, z1 - z0 - 2), nm: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]), c: C.gold, mode: 0 };
          this.M.showLot(null);
          return;
        }
      }
    },
  };

  L.maqueteGL = GL;
})(window.Lumoa);
