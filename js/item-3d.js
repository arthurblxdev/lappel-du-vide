// <item-3d track="03" [time="4"] [loop="16"]> — l’objet d’un titre en volume, rendu en direct (WebGL, lancer de rayons)
// même développement que les pochettes : tout l’éclairage est une seule valeur, mappée sur la palette du single, puis grain.
// un objet par titre, chacun dans son fichier items-3d/NN.js (contrat : items-3d/LISEZMOI.md). boucle exacte sur `loop` secondes : tout mouvement est fonction de uPh (0 → 1).
(() => {
// palettes relevées sur les pochettes finales (les mêmes que cover-live.js)
const PAL = {
  "01": ['#0A0812','#231D24','#5A4A37','#9B8259','#DDBF7F','#FCEAA0'],
  "02": ['#08060C','#3A1622','#6E3137','#A85E52','#DE9C78','#F7D096'],
  "03": ['#09070E','#4A163F','#8F2C68','#C94F82','#F49A88','#FFEB74'],
  "04": ['#070A0F','#0C2429','#18595F','#249A9D','#3AE4E4','#C8FFE6'],
  "05": ['#07070E','#22304A','#486287','#7798C2','#AECCEE','#EEF6FD'],
  "06": ['#080912','#182236','#3C485E','#6E7A8E','#ABADB6','#F4F0EE'],
  "07": ['#07070D','#0C2727','#447A71','#734423','#FDBF4B','#FFEF56'],
  "08": ['#08080B','#1B1B1C','#3E3E3E','#767675','#B9B9B7','#F6F3EB'],
  "09": ['#0A0812','#2A2050','#52427A','#7A68A0','#A893C5','#D8CAE0'],
  "10": ['#0C070C','#561520','#96303C','#D0566B','#FB93AB','#FFEBF1'],
};
const ACC = { "06": '#F2894A' };
const TXT0 = { font: "italic 44px Georgia, 'Times New Roman', serif", lh: 50, gap: 14 };
const TXT = {
  "02": { font: "italic bold 42px Georgia, 'Times New Roman', serif", lh: 48, gap: 12 },
  "03": { font: "italic bold 48px Georgia, 'Times New Roman', serif", lh: 56, gap: 14 },
  "05": { font: "bold 60px Georgia, 'Times New Roman', serif", lh: 66, gap: 18 },
  "06": { font: "bold 48px Georgia, 'Times New Roman', serif", lh: 52, gap: 12 },
  "08": { font: "italic 40px Georgia, 'Times New Roman', serif", lh: 46, gap: 14 },
  "09": { font: "bold 32px Georgia, 'Times New Roman', serif", lh: 34, gap: 10 },
};
const FALLBACK = "tout là-haut je ressens l’appel du vide pour m’calmer je fabrique de la belle musique la vie dont j’rêve c’est pas la vie qu’j’ai certes les larmes cachées bien à l’abri d’mes cernes ";

const VS = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
// commun à toutes les scènes : chacune fournit vue() (la caméra), map() (la forme, gm = matière), surf() (la valeur là où le rayon touche), fond() (là où il ne touche rien)
const PRE = `precision highp float;
uniform sampler2D uText;uniform float uTime;uniform float uPh;uniform vec3 uPal[6];uniform vec3 uAcc;uniform vec2 uRes;
const float W=6.2831853;
float gmin=1e9;float gacc=0.;float gm=0.;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.1;a*=.5;}return v;}
vec3 pal(float t){t=clamp(t,0.,.9999)*5.;float f=fract(t);int i=int(floor(t));
 vec3 c0=uPal[0],c1=uPal[1];
 if(i==1){c0=uPal[1];c1=uPal[2];}else if(i==2){c0=uPal[2];c1=uPal[3];}else if(i==3){c0=uPal[3];c1=uPal[4];}else if(i==4){c0=uPal[4];c1=uPal[5];}
 return mix(c0,c1,f);}
float T(vec2 uv){return texture2D(uText,uv,-.4).r;}
vec2 rot(vec2 v,float a){float c=cos(a),s=sin(a);return vec2(v.x*c-v.y*s,v.x*s+v.y*c);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float box(vec3 p,vec3 b){vec3 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,max(d.y,d.z)),0.);}
float roundCone(vec3 p,float r1,float r2,float h){vec2 q=vec2(length(p.xz),p.y);float b=(r1-r2)/h;float a=sqrt(1.-b*b);float k=dot(q,vec2(-b,a));
 if(k<0.)return length(q)-r1;if(k>a*h)return length(q-vec2(0.,h))-r2;return dot(q,vec2(a,b))-r1;}
float cone(vec3 p,float h,float r1,float r2){vec2 q=vec2(length(p.xz),p.y);vec2 k1=vec2(r2,h);vec2 k2=vec2(r2-r1,2.*h);
 vec2 ca=vec2(q.x-min(q.x,(q.y<0.)?r1:r2),abs(q.y)-h);vec2 cb=q-k1+k2*clamp(dot(k1-q,k2)/dot(k2,k2),0.,1.);
 float s=(cb.x<0.&&ca.y<0.)?-1.:1.;return s*sqrt(min(dot(ca,ca),dot(cb,cb)));}
// caméra qui se balance autour de l'objet : a = angle, d = distance, h = hauteur, ta = point visé, f = focale
void vue0(vec2 q,float a,float d,float h,vec3 ta,float f,out vec3 ro,out vec3 rd){ro=vec3(sin(a)*d,h,cos(a)*d);vec3 fw=normalize(ta-ro);vec3 r=normalize(cross(fw,vec3(0.,1.,0.)));vec3 u=cross(r,fw);rd=normalize(q.x*r+q.y*u+f*fw);}
float axe(vec3 c,vec3 ro,vec3 rd){return length(cross(c-ro,rd));} // distance du rayon à un point
// le développement : repli (solarisation) si fold, vignette, grain, palette, accent
vec4 developpe(float v,vec2 q,bool fold){if(fold&&v>1.)v=2.-v;v*=1.-.22*dot(q*vec2(.8,.55),q*vec2(.8,.55));v+=(hash(gl_FragCoord.xy+fract(uTime)*91.)-.5)*.055;return vec4(mix(pal(v),uAcc,clamp(gacc,0.,1.)),1.);}
`;
// le main par défaut (une scène peut fournir le sien : main: true)
const POST = `
vec3 nrm(vec3 p){vec2 e=vec2(.002,0.);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
void main(){
 vec2 q=(gl_FragCoord.xy-.5*uRes)/(.5*uRes.y);vec3 ro,rd;vue(q,ro,rd);
 float t=0.;bool hit=false;vec3 p=ro;
 for(int i=0;i<NST;i++){p=ro+rd*t;float d=map(p);gmin=min(gmin,d);if(d<.0015){hit=true;break;}t+=d*PAS;if(t>FAR)break;}
 float v;if(hit){vec3 n=nrm(p);v=surf(ro,rd,p,n);}else{v=fond(ro,rd);}
#ifdef FOLD
 gl_FragColor=developpe(v,q,true);
#else
 gl_FragColor=developpe(v,q,false);
#endif
}`;

// les scènes : un fichier par titre, chargé à la demande
const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const PERF = local && new URLSearchParams(location.search).has('perf'); // ?perf=1 : mesure le temps de rendu d'une image (outil de travail)
const loading = {};
function loadScene(n) {
  const reg = window.ITEM3D = window.ITEM3D || {};
  if (reg[n]) return Promise.resolve(reg[n]);
  if (!loading[n]) loading[n] = new Promise(res => {
    const s = document.createElement('script'); s.src = new URL(`./items-3d/${n}.js` + (local ? `?t=${Date.now()}` : ''), document.baseURI).href;
    s.onload = () => res(reg[n] || null); s.onerror = () => { console.error('[item-3d ' + n + '] scène introuvable'); res(null); }; document.head.appendChild(s);
  });
  return loading[n];
}

let lyricsPromise = null;
function loadLyrics() {
  if (!lyricsPromise) lyricsPromise = fetch(new URL('./assets/brief/paroles.md', document.baseURI)).then(r => r.text()).then(md => {
    const out = {}; for (const s of md.split(/\n## /).slice(1)) { const m = s.match(/^(\d\d)\.[^\n]*\n\n\*[^\n]*\*\n\n([\s\S]*)/); if (m) out[m[1]] = m[2].replace(/\s+/g, ' ').trim(); } return out;
  }).catch(() => ({}));
  return lyricsPromise;
}
function textCanvas(txt, seed, st) {
  const S = 2048, c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S); g.fillStyle = '#fff'; g.font = st.font; g.textBaseline = 'top';
  const words = txt.split(' '); let wi = Math.floor(seed * words.length);
  for (let y = 0; y < S; y += st.lh) { let x = -((y * 7.3 + seed * 997) % 360); while (x < S) { const w = words[wi++ % words.length]; g.fillText(w, x, y); x += g.measureText(w).width + st.gap; } }
  return c;
}
const hex = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

class Item3D extends HTMLElement {
  static get observedAttributes() { return ['track', 'time', 'loop']; }
  connectedCallback() {
    if (!this.cv) {
      this.style.cssText += ';position:absolute;inset:0;display:block;overflow:hidden;background:#07060C';
      const cv = this.cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; this.appendChild(cv);
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; });
      cv.addEventListener('webglcontextrestored', () => { this.lost = false; this.initGL(); });
      this.initGL();
    }
    if (!this.io) this.io = new IntersectionObserver(es => { this.visible = es[es.length - 1].isIntersecting; });
    if (!this.ro) this.ro = new ResizeObserver(() => this.draw());
    this.io.observe(this); this.ro.observe(this);
    this.running = true; this.t0 = performance.now(); this.loop();
  }
  disconnectedCallback() { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.io.disconnect(); this.ro.disconnect(); }
  attributeChangedCallback(name) { if (!this.gl || this.lost) return; if (name === 'track') this.setTrack(); else this.draw(); }
  initGL() {
    const gl = this.gl = this.cv.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true }); if (!gl || gl.isContextLost()) return;
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.setTrack();
  }
  setTrack() {
    const gl = this.gl, n = PAL[this.getAttribute('track')] ? this.getAttribute('track') : '03'; this.track = n; this.u = null; this.scene = null;
    loadScene(n).then(sc => {
      if (!sc || this.track !== n || this.gl !== gl || this.lost) return;
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error('[item-3d ' + n + '] ' + gl.getShaderInfoLog(o)); return o; };
      const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, PRE + sc.glsl + (sc.main ? '' : POST))); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.error('[item-3d ' + n + '] ' + gl.getProgramInfoLog(pr)); return; }
      gl.useProgram(pr); this.pr = pr; this.locs = {};
      const a = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      const U = k => gl.getUniformLocation(pr, k);
      this.u = { time: U('uTime'), ph: U('uPh'), pal: U('uPal'), acc: U('uAcc'), res: U('uRes'), text: U('uText') }; this.scene = sc;
      gl.uniform1i(this.u.text, 0); gl.uniform3fv(this.u.pal, new Float32Array((sc.pal || PAL[n]).flatMap(hex))); gl.uniform3fv(this.u.acc, new Float32Array(hex(sc.acc || ACC[n] || '#000000')));
      const upload = txt => { if (this.track !== n || this.lost) return; gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas(txt, parseInt(n) / 11, sc.txt || TXT[n] || TXT0)); gl.generateMipmap(gl.TEXTURE_2D); this.draw(); };
      upload(FALLBACK); loadLyrics().then(l => { if (l[n]) upload(l[n]); if (PERF) setTimeout(() => this.perf(), 300); });
    });
  }
  perf() { const gl = this.gl, N = 30, px = new Uint8Array(4); if (!this.u) return; const one = i => { this.forceT = 16 * i / N; this.draw(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
    for (let i = 0; i < 3; i++) one(i); const t0 = performance.now(); for (let i = 0; i < N; i++) one(i); const ms = (performance.now() - t0) / N; this.forceT = null;
    console.log(`[item-3d perf] ${this.track} : ${ms.toFixed(1)} ms par image à ${this.cv.width}×${this.cv.height}`); }
  loop() { if (!this.running) return; this.raf = requestAnimationFrame(() => this.loop()); if (this.visible !== false && !this.fixed()) this.draw(); }
  fixed() { return Number.isFinite(parseFloat(this.getAttribute('time'))); }
  draw() {
    const gl = this.gl; if (!gl || this.lost || !this.u) return;
    const dpr = Math.min(parseFloat(this.getAttribute('dpr')) || 1.5, window.devicePixelRatio || 1); const w = Math.max(1, Math.round(this.clientWidth * dpr)), h = Math.max(1, Math.round(this.clientHeight * dpr));
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; gl.viewport(0, 0, w, h); }
    const ft = this.forceT ?? parseFloat(this.getAttribute('time')), t = Number.isFinite(ft) ? ft : (performance.now() - this.t0) / 1000;
    const L = parseFloat(this.getAttribute('loop')) || 16, ph = (t / L) % 1;
    gl.uniform1f(this.u.time, t); gl.uniform1f(this.u.ph, ph); gl.uniform2f(this.u.res, w, h);
    // uniformes propres à la scène : { uNom: ['1f' | '2fv' | '3fv' | '4fv' | '1i', valeur] }
    const cu = this.scene.uniforms ? this.scene.uniforms(ph, t) : null;
    if (cu) for (const k in cu) { const loc = k in this.locs ? this.locs[k] : (this.locs[k] = gl.getUniformLocation(this.pr, k)); if (loc) gl['uniform' + cu[k][0]](loc, cu[k][1]); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
if (!customElements.get('item-3d')) customElements.define('item-3d', Item3D);
})();
