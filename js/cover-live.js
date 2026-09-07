// <cover-live track="05"> — la pochette d’un single rendue en direct : paroles → champ animé → palette (WebGL)
(() => {
const PAL = {
  "01": ['#07060C','#3A2452','#B8652E','#E0A33A','#F2D9A0','#F6EEDF'],
  "02": ['#07060C','#2E0F22','#7A2A44','#B84A6E','#C8622A','#F2D9A0'],
  "03": ['#07060C','#3A0E28','#8A2560','#F06292','#F8A050','#F8F06A'],
  "04": ['#07060C','#08191E','#125050','#2E8B8B','#7FE0A0','#E8FFD0'],
  "05": ['#07060C','#0F1F44','#3A5A9A','#A9C8EA','#E6F0FA','#FFFFFF'],
  "06": ['#07060C','#1F1218','#5A2C1E','#B8652E','#E0A33A','#F2D9A0'],
  "07": ['#07060C','#0F2A30','#2E8B8B','#B8652E','#E0A33A','#F2D9A0'],
  "08": ['#07060C','#1A1512','#4A3E36','#9A8C7E','#D8CCBA','#F2E9D8'],
  "09": ['#07060C','#1B1436','#5E3FB3','#B8A0D0','#F3EBDD','#FFFFFF'],
  "10": ['#07060C','#2E0C1A','#8A1F26','#D0546A','#F0B8C8','#F6EEDF'],
};
const MODE = { "01":2, "02":7, "03":3, "04":4, "05":0, "06":1, "07":5, "08":6, "09":0, "10":8 };
const SPEED = { "09": .55 };
const FALLBACK = "tout là-haut je ressens l’appel du vide pour m’calmer je fabrique de la belle musique la vie dont j’rêve c’est pas la vie qu’j’ai certes les larmes cachées bien à l’abri d’mes cernes ";

const VS = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
const FS = `precision highp float;
uniform sampler2D uText;uniform float uTime;uniform int uMode;uniform vec3 uPal[6];uniform vec2 uRes;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.1;a*=.5;}return v;}
vec3 pal(float t){t=clamp(t,0.,.9999)*5.;float f=fract(t);int i=int(floor(t));
 vec3 c0=uPal[0],c1=uPal[1];
 if(i==1){c0=uPal[1];c1=uPal[2];}else if(i==2){c0=uPal[2];c1=uPal[3];}else if(i==3){c0=uPal[3];c1=uPal[4];}else if(i==4){c0=uPal[4];c1=uPal[5];}
 return mix(c0,c1,f);}
float T(vec2 uv){return texture2D(uText,uv).r;}
float G(vec2 p,vec2 c,vec2 r){vec2 d=(p-c)/r;return exp(-dot(d,d));}
void main(){
 vec2 p=gl_FragCoord.xy/uRes;p.y=1.-p.y;float t=uTime;float v=0.;float L=0.;bool fold=false;
 if(uMode==0){ // vortex — rotation différentielle
  vec2 c=vec2(.5);vec2 d=p-c;float r=length(d)+1e-4;float a=2.6*exp(-r/.36)+t*(.06+.5*exp(-r/.18));float cs=cos(a),sn=sin(a);
  vec2 q=c+vec2(d.x*cs-d.y*sn,d.x*sn+d.y*cs);q=c+(q-c)*(1.+.35*exp(-r/.3));v=T(q+vec2(0.,t*.01));
  L=G(p,c,vec2(.3));v=v*(.25+.75*sqrt(L))*.9+pow(L,2.6)*1.25;
 } else if(uMode==1){ // pluie — la cover : rangées horizontales de paroles, resserrées vers une ligne d'horizon, qui glissent lentement vers le bas
  float cy=.52;float dy=p.y-cy;float stretch=.32+.25*sin(p.x*11.);float yy=cy+dy*stretch+.07*sin(p.x*17.)+t*.03;
  vec2 q=vec2(p.x+.009*sin(p.y*90.+p.x*10.+t*.4),yy);v=T(q);
  // gouttes : fines colonnes qui tombent, longueur/vitesse variées, trois couches
  float rain=0.;for(int k=0;k<3;k++){float kf=float(k);float nx=90.+40.*kf;float col=floor(p.x*nx+kf*13.);float h1=hash(vec2(col,kf)),h2=hash(vec2(col,kf+5.));
   float fx=fract(p.x*nx+kf*13.);float w=smoothstep(.0,.35,fx)*smoothstep(1.,.65,fx);float fy=fract(p.y*(.9+.6*h2)-t*(.35+.45*h1)+h1*7.);
   rain+=w*pow(fy,9.)*step(.55,h2)*(.5+.5*h1);}
  v=v*(1.-.35*rain)+rain*.55;
  L=max(G(p,vec2(.5,.69),vec2(.23,.15)),.35*G(p,vec2(.5,.69),vec2(.7,.06)));v=v*(.2+.8*pow(L,.6))*.8+pow(L,2.4)*.85;
 } else if(uMode==2){ // horizon — soleil anneau, rangées qui glissent, reflet qui ondule
  float H=.66;vec2 q;
  if(p.y<H){q=vec2(p.x+t*.02*(.4+p.y)+.04*sin(p.y*14.+t*.4),p.y*1.1+.015*sin(p.x*9.+t*.6));v=T(q)*(.3+.7*smoothstep(.15,.7,p.y));}
  else{float yy=H-(p.y-H)*1.25;float rip=.012*sin(p.y*110.+t*2.5)*smoothstep(0.,.08,p.y-H);q=vec2(p.x+t*.02*(.4+yy)+.04*sin(yy*14.+t*.4)+rip,yy*1.1);v=T(q)*.5*(1.-(p.y-H)*1.6);}
  vec2 sc=vec2(.5,H-.1);float ring=exp(-pow((length((p-sc)*vec2(1.,1.15))-.11)*26.,2.));
  L=max(.5*G(p,vec2(.5,H),vec2(.9,.05)),.35*G(p,sc,vec2(.3)));v=v*(.5+.5*sqrt(L))+ring*.95+pow(L,2.)*.5;fold=true;
 } else if(uMode==3){ // lampe à lave — blobs qui montent, paroles en suspension
  float f=0.;for(int i=0;i<10;i++){float fi=float(i);float bx=.25+.5*hash(vec2(fi,2.))+.06*sin(t*.3+fi);float by=fract(t*.02*(.6+hash(vec2(fi,5.)))+hash(vec2(fi,9.)));
   vec2 rr=vec2(.05+.06*hash(vec2(fi,3.)),.09+.12*hash(vec2(fi,4.)));vec2 d=(p-vec2(bx,by))/rr;f+=exp(-dot(d,d)*1.6);}
  f+=fbm(p*vec2(4.,2.)+t*.05)*.18;float core=smoothstep(.62,1.,f);float tx=T(p*vec2(1.,.6)+vec2(.03*sin(p.y*10.+t*.3),-t*.02));
  v=core*(.4+.45*tx)+f*.12+tx*max(0.,f-.3)*.35;L=max(.55*G(p,vec2(.5,1.08),vec2(.3,.24)),.25*G(p,vec2(.5),vec2(.8)));v=v*(.55+.45*sqrt(L))+pow(L,2.4)*.7;
 } else if(uMode==4){ // cruise — traînées de paroles vers le point de fuite
  vec2 vp=vec2(.52,.6);vec2 d=p-vp;float r=length(d)+1e-4;float th=atan(d.y,d.x);
  float wob=.02*fbm(vec2(th*2.2+7.,r*4.));vec2 q=vec2((th+3.14159)/6.2832*2.3+wob,log(r*40.+1.)*.6-t*.55);
  float st=0.;for(int k=0;k<6;k++){float o=(float(k)-2.5)*.004;st+=T(q+vec2(0.,o));}st/=6.;
  float below=d.y>-.04?1.:exp(d.y/.09);float lanes=.55+.45*pow(max(0.,sin(th*9.+fbm(vec2(th*3.,1.))*3.)),1.5);
  v=st*lanes*(.25+.95*min(1.,r/.38))*(.35+.65*below)+.03+.2*exp(-abs(d.y)/.06);
  float bl=.5+.5*sin(t*1.3);L=max(max(G(p,vec2(.44,.69),vec2(.026,.014)),G(p,vec2(.6,.69),vec2(.026,.014))),max(.5*G(p,vec2(.52,.69),vec2(.26,.11)),.28*G(p,vp,vec2(.12,.06))));
  v=v*(.6+.4*sqrt(L))+pow(L,1.6)*(1.05+.1*bl);fold=true;
 } else if(uMode==5){ // long fleuve — strates postérisées qui dérivent
  vec2 w=vec2(fbm(p*2.+vec2(-t*.03,0.)),fbm(p*2.+vec2(5.2,t*.02)));float n=fbm(p*vec2(2.2,3.6)+vec2(t*.05,0.)+(w-.5)*1.4);
  n+=.12*(1.-p.y);float post=floor(n*5.5)/4.5;v=post*.9+T(p*vec2(1.,2.)+vec2(t*.01,0.))*.06;
  L=.3*G(p,vec2(.5,.75),vec2(.9,.12));v=v*(.75+.25*sqrt(L))+pow(L,2.)*.2;
 } else if(uMode==6){ // sésame — colonnes de paroles, la porte, la faille qui respire, zoom lent
  p=.5+(p-.5)*(1.-.06*sin(t*.25));float col=floor(p.x*14.);float ph=hash(vec2(col,2.));
  vec2 q=vec2(p.x+.003*sin(p.y*50.),fract(p.y*.3+ph-t*.006));v=T(q)*(.5+.5*hash(vec2(col,4.)))*.9;
  v*=.35+.65*abs(sin(p.x*44.));float inDoor=step(abs(p.x-.5),.09)*step(.46,p.y);v=mix(v,.05+T(p*vec2(1.,3.))*.08,inDoor);
  float pulse=.85+.15*sin(t*1.4);L=max(G(p,vec2(.5,.43),vec2(.09,.05))*pulse,.25*G(p,vec2(.5,.45),vec2(.35,.3)));v=v*(.5+.5*sqrt(L))+pow(L,1.8)*.9;
 } else if(uMode==7){ // vieux messages — feuille de paroles qui se défait et se reforme
  vec2 c=vec2(.42,.45);vec2 d=p-c;float ang=-.2;vec2 dr=vec2(d.x*cos(ang)-d.y*sin(ang),d.x*sin(ang)+d.y*cos(ang));
  float r=length(dr);float th=atan(dr.y,dr.x)+1.5708;float lobes=pow(abs(cos(2.5*th)),2.4);float base=abs(th)>2.45?.3:1.;
  float R=.4*(.36+.64*lobes+.035*abs(sin(th*22.)))*base*(1.-.15*abs(sin(th*.5)));float inside=step(r,R);
  float e=.55+.45*sin(t*.35);float erode=clamp((p.x-c.x+.04)/.34+(fbm(p*6.)-.5)*.8,0.,1.)*e;
  float keep=step(erode*1.02,fbm(p*25.+vec2(t*.05,0.)));float tx=T(p*1.7+vec2(.006*sin(p.y*30.),0.));
  float vein=1.;for(int i=-2;i<=2;i++){float a=-1.5708+float(i)*1.2566;vec2 u=vec2(cos(a),sin(a));float al=dot(dr,u),pe=abs(-dr.x*u.y+dr.y*u.x);if(al>0.&&al<R*.85&&pe<.0016)vein=0.;}
  v=inside*keep*(tx*1.15+.07)*vein;
  float drift=.14+(p.x-c.x)*.6+t*.03;float fly=T(vec2(p.x-drift,p.y+.05*sin(p.x*8.+t*.4)+(p.x-c.x)*.12)*1.7);
  float scatter=step(.58,fbm(p*35.+vec2(-t*.25,9.)))*clamp((p.x-c.x-.02)/.24,0.,1.)*(1.-inside*keep)*exp(-abs(p.y-c.y-(p.x-c.x)*.12)/.3);
  v+=fly*scatter*1.05;float sx=c.x+(p.y-c.y)*tan(-ang);if(abs(p.x-sx)<.0025&&p.y>c.y+R*.28&&p.y<c.y+R*.28+.26)v+=.7;
  L=max(.6*G(p,vec2(.6,.42),vec2(.32)),.3*G(p,vec2(.5),vec2(.8)));v=v*(.6+.4*sqrt(L))+pow(L,3.)*.3+.03;
 } else { // persephone — grains de paroles projetés depuis un centre vide, en boucle
  vec2 c=vec2(.5,.47);vec2 d=p-c;float r=length(d)+1e-4;float th=atan(d.y,d.x);
  vec2 u=vec2((th+3.14159)/6.2832*22.,log(r*8.+1.)*7.-t*.45);vec2 id=floor(u);vec2 f=fract(u)-.5;
  vec2 j=(vec2(hash(id),hash(id+3.7))-.5)*.5;float on=step(.45,hash(id+1.3));float dist=length(f-j)*(2.2+1.2*hash(id+2.2));
  float st=0.;for(int k=0;k<4;k++){st+=T(vec2((th+3.14159)/6.2832*2.+float(k)*.002,log(r*8.+1.)*.9-t*.03));}st/=4.;
  v=st*.14*min(1.,max(0.,(r-.12)/.3));
  if(on>.5&&dist<1.){float kk=1.-.55*sqrt(1.-dist*dist);float tx=T(c+(p-c)*kk*2.+id*.13);float sheen=pow(max(0.,1.-length(f-j+vec2(.12,.14))*2.6),2.)*.6;v=max(v,tx*.5+.34+sheen-pow(dist,6.)*.45);}
  L=max(.8*G(p,c,vec2(.095)),max(.35*G(p,c,vec2(.42)),.25*G(p,vec2(.5),vec2(.9))));v=v*(.6+.4*sqrt(L))+pow(L,2.4)*.85;fold=true;
 }
 if(fold&&v>1.)v=2.-v;v+=(hash(p*uRes+fract(t))-.5)*.05;
 gl_FragColor=vec4(pal(v),1.);}`;

let lyricsPromise = null;
function loadLyrics() {
  if (!lyricsPromise) lyricsPromise = fetch(new URL('./assets/brief/paroles.md', document.baseURI)).then(r => r.text()).then(md => {
    const out = {}; for (const s of md.split(/\n## /).slice(1)) { const m = s.match(/^(\d\d)\.[^\n]*\n\n\*[^\n]*\*\n\n([\s\S]*)/); if (m) out[m[1]] = m[2].replace(/\s+/g, ' ').trim(); } return out;
  }).catch(() => ({}));
  return lyricsPromise;
}
function textCanvas(txt, seed) {
  const S = 1024, c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S); g.fillStyle = '#fff'; g.font = "italic 300 22px 'Cormorant Garamond', Georgia, serif"; g.textBaseline = 'top';
  const words = txt.split(' '); let wi = Math.floor(seed * words.length);
  for (let y = 0; y < S; y += 25) { let x = -((y * 7.3 + seed * 997) % 180); while (x < S) { const w = words[wi++ % words.length]; g.fillText(w, x, y); x += g.measureText(w).width + 7; } }
  return c;
}
const hex = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

class CoverLive extends HTMLElement {
  static get observedAttributes() { return ['track']; }
  connectedCallback() {
    if (!this.cv) { this.cv = document.createElement('canvas'); this.cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; this.style.cssText += ';position:absolute;inset:0;display:block;overflow:hidden;background:#07060C'; this.appendChild(this.cv); this.initGL(); }
    this.running = true; this.t0 = performance.now() - (this.paused || 0); this.loop();
  }
  disconnectedCallback() { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); }
  attributeChangedCallback() { if (this.gl) this.setTrack(); }
  initGL() {
    const gl = this.gl = this.cv.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true }); if (!gl) return;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error('[cover-live]', gl.getShaderInfoLog(o)); return o; };
    const pr = this.pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    this.u = { time: gl.getUniformLocation(pr, 'uTime'), mode: gl.getUniformLocation(pr, 'uMode'), pal: gl.getUniformLocation(pr, 'uPal'), res: gl.getUniformLocation(pr, 'uRes'), text: gl.getUniformLocation(pr, 'uText') };
    this.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(this.u.text, 0); this.setTrack();
  }
  setTrack() {
    const gl = this.gl, n = this.getAttribute('track') || '05'; this.track = n;
    gl.uniform1i(this.u.mode, MODE[n] ?? 0); gl.uniform3fv(this.u.pal, new Float32Array((PAL[n] || PAL['05']).flatMap(hex)));
    const upload = (txt) => { if (this.track !== n) return; gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas(txt, parseInt(n) / 11)); };
    upload(FALLBACK); loadLyrics().then(l => { if (l[n]) upload(l[n]); });
  }
  loop() {
    if (!this.running || !this.gl) return; this.raf = requestAnimationFrame(() => this.loop());
    const gl = this.gl, dpr = Math.min(1.5, window.devicePixelRatio || 1); const w = Math.max(1, Math.round(this.clientWidth * dpr)), h = Math.max(1, Math.round(this.clientHeight * dpr));
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; gl.viewport(0, 0, w, h); }
    const t = (performance.now() - this.t0) / 1000 * (SPEED[this.track] || 1); this.paused = performance.now() - this.t0;
    gl.uniform1f(this.u.time, t); gl.uniform2f(this.u.res, w, h); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
if (!customElements.get('cover-live')) customElements.define('cover-live', CoverLive);
})();
