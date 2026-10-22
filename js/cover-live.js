// <cover-live track="05" [time="12"]> — la pochette d’un single rendue en direct : paroles → champ animé → palette (WebGL)
(() => {
// palettes relevées sur les pochettes finales (singles/*.png) : couleur moyenne par niveau de luminance
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
const MODE = { "01":2, "02":7, "03":3, "04":4, "05":0, "06":1, "07":5, "08":6, "09":9, "10":8 };
const TXT0 = { font: "italic 22px Georgia, 'Times New Roman', serif", lh: 25, gap: 7 };
const TXT = {
  "02": { font: "italic bold 21px Georgia, 'Times New Roman', serif", lh: 24, gap: 6 },
  "03": { font: "italic bold 24px Georgia, 'Times New Roman', serif", lh: 28, gap: 7 },
  "05": { font: "bold 30px Georgia, 'Times New Roman', serif", lh: 33, gap: 9 },
  "06": { font: "bold 24px Georgia, 'Times New Roman', serif", lh: 26, gap: 6 },
  "08": { font: "italic 20px Georgia, 'Times New Roman', serif", lh: 23, gap: 7 },
  "09": { font: "bold 16px Georgia, 'Times New Roman', serif", lh: 17, gap: 5 },
};
const FALLBACK = "tout là-haut je ressens l’appel du vide pour m’calmer je fabrique de la belle musique la vie dont j’rêve c’est pas la vie qu’j’ai certes les larmes cachées bien à l’abri d’mes cernes ";

const VS = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
const FS = `precision highp float;
uniform sampler2D uText;uniform sampler2D uTextM;uniform float uTime;uniform int uMode;uniform vec3 uPal[6];uniform vec3 uAcc;uniform vec2 uRes;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.1;a*=.5;}return v;}
vec3 pal(float t){t=clamp(t,0.,.9999)*5.;float f=fract(t);int i=int(floor(t));
 vec3 c0=uPal[0],c1=uPal[1];
 if(i==1){c0=uPal[1];c1=uPal[2];}else if(i==2){c0=uPal[2];c1=uPal[3];}else if(i==3){c0=uPal[3];c1=uPal[4];}else if(i==4){c0=uPal[4];c1=uPal[5];}
 return mix(c0,c1,f);}
float T(vec2 uv){return texture2D(uText,uv).r;}
float TM(vec2 uv){return texture2D(uTextM,uv,-.35).r;}
float G(vec2 p,vec2 c,vec2 r){vec2 d=(p-c)/r;return exp(-dot(d,d));}
vec2 rot(vec2 v,float a){float c=cos(a),s=sin(a);return vec2(v.x*c-v.y*s,v.x*s+v.y*c);}
// paroles enroulées autour de c : torsion fixe + rotation d'un seul bloc. les bras de la spirale semblent aspirés, et rien ne se cisaille avec le temps
float swirl(vec2 p,vec2 c,float A,float R,float spin,float warp,float wf,vec2 sc,float bands,float base,float chaos,float duty,float t){
 vec2 d=p-c;float r=length(d);vec2 q=rot(d,A*exp(-r/R)*(1.+.05*sin(t*.25))+spin*t+base);
 vec2 w=vec2(fbm(q*wf+vec2(1.7,9.2)+t*.01),fbm(q*wf+vec2(8.3,2.8)-t*.01))-.5;
 vec2 w2=vec2(fbm(q*wf*3.7+vec2(4.4,.3)),fbm(q*wf*3.7+vec2(.9,6.1)))-.5;vec2 u=q+w*warp+w2*chaos;
 float b=smoothstep(-duty-.2,-duty+.2,sin(u.y*bands+9.*fbm(u*2.2+4.))); // des paquets de lignes séparés par du noir, qui suivent le courant
 return TM(u*sc+.5)*b;}
float edge(vec2 p,float b,float tb,float lw){return smoothstep(lw,0.,abs(p.x-b))*step(tb,p.y);}
void main(){
 vec2 p=gl_FragCoord.xy/uRes;p.y=1.-p.y;float t=uTime;float v=0.;float L=0.;float acc=0.;bool fold=false;
 if(uMode==0){ // l'appel du vide — le champ de paroles tourne autour de la lumière, des vides le découpent
  vec2 c=vec2(.55,.43);float tx=swirl(p,c,7.5,.1,-.07,.45,1.3,vec2(.85,1.8),62.,0.,.035,.7,t);
  float e=(fbm(p*5.+vec2(2.,t*.03))-.5)*.08;
  float m=smoothstep(.012,-.012,p.y-(.56+2.6*p.x*p.x)+e)*smoothstep(.45,.38,G(p,vec2(0.),vec2(.34,.15))+e)+step(.4,p.x);m=min(1.,m);float halo=G(p,c,vec2(.28)),core=G(p,c,vec2(.095));
  v=tx*m*(.72+.45*halo)+core*1.15+halo*.2;
 } else if(uMode==1){ // imperméable — les paroles étirées en pluie sur trois plans, une lampe derrière la pluie
  vec2 c=vec2(.68,.6);float halo=G(p,c,vec2(.19)),core=G(p,c,vec2(.085));float rain=0.;
  // chaque colonne lit une tranche verticale des paroles : les jambages deviennent des gouttes, rien ne se compresse donc rien ne scintille
  for(int k=0;k<3;k++){float kf=float(k);float n=300.-kf*80.;float col=floor(p.x*n),fx=fract(p.x*n);
   float h=hash(vec2(col,kf*7.1+1.)),h2=hash(vec2(col,kf+3.)),h3=hash(vec2(col,kf+11.));
   float prof=smoothstep(.15,.42,fx)*smoothstep(.85,.58,fx);
   vec2 uv=vec2(h3*7.31+kf*.37+p.y*.015,p.y*(.6-kf*.12)*(.7+.6*h2)-t*(.16+kf*.1)*(.8+.4*h)+h*5.);
   rain+=smoothstep(.4,.8,T(uv))*prof*(.3+.7*h2)*(.32+kf*.22);}
  float bg=.02+.04*fbm(p*vec2(2.5,1.2)+vec2(0.,-t*.04));
  v=bg+rain*(.6+1.6*halo)+core*.9+halo*.24;
  acc=smoothstep(.28,.55,rain)*smoothstep(.2,.75,G(p,c,vec2(.11)));
 } else if(uMode==2){ // intro — l'anneau posé sur l'horizon, un ciel de paroles en nuages qui dérivent, le reflet en stries qui ondule
  float H=.61;vec2 sc=vec2(.62,.45);float rr=length(p-sc);
  float ring=exp(-pow((rr-.148-.003*sin(t*.5))*30.,2.))*step(p.y,H);
  if(p.y<H){float cl=fbm(vec2(p.x*2.4+t*.012,p.y*6.5-t*.004)+2.);float tx=TM(vec2(p.x*.9+t*.01,p.y*1.6+.04*sin(p.x*9.+t*.3)));
   v=smoothstep(.4,.75,cl)*(.6+.4*tx)*.42+exp(-(H-p.y)/.075)*(.55+.7*cl)*1.15;v*=1.-smoothstep(.15,.11,rr)*.85;}
  else{float yy=p.y-H;float tx=TM(vec2(p.x*.14+t*.006+.004*sin(p.x*40.+t*2.2+yy*90.),yy*3.2+.5));
   v=tx*max(G(p,vec2(sc.x,H+.06),vec2(.36,.11)),.6*exp(-yy/.035))*2.2+exp(-yy/.006)*.9;}
  v=(v+ring*.95)*(.5+hash(p*uRes+fract(t*.7)));
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
  float bl=.5+.5*sin(t*1.3);L=max(max(G(p,vec2(.44,.69),vec2(.026,.014)),G(p,vec2(.6,.69),vec2(.026,.014))),max(.78*G(p,vec2(.52,.68),vec2(.24,.12)),.28*G(p,vp,vec2(.12,.06))));
  v=v*(.6+.4*sqrt(L))+pow(L,1.6)*(1.05+.1*bl);fold=true;
 } else if(uMode==5){ // long fleuve — strates postérisées qui dérivent
  vec2 w=vec2(fbm(p*2.+vec2(-t*.03,0.)),fbm(p*2.+vec2(5.2,t*.02)));float n=fbm(p*vec2(3.,6.)+vec2(t*.05,0.)+(w-.5)*1.4);
  n=(n-.47)*1.4+.45+.4*exp(-pow((p.y-.33)/.16,2.))-.3*smoothstep(.45,1.,p.y);float post=floor(n*5.5)/4.5;v=post*.9+T(p*vec2(1.,2.)+vec2(t*.01,0.))*.05; // aplats exacts de la palette, comme la pochette
 } else if(uMode==6){ // sésame — la rangée de portes, la silhouette, la lumière qui respire derrière ; la porte ne s'ouvre jamais
  float x=p.x,y=p.y;float top=.468,id=10.;
  if(x<.1){top=.653;id=0.;}else if(x<.208){top=.604;id=1.;}else if(x<.3){top=.518;id=2.;}else if(x<.397){top=.464;id=3.;}else if(x<.47){top=.464;id=4.;}else if(x<.595){top=.395;id=5.;}else if(x<.697){top=.507;id=6.;}else if(x<.783){top=.482;id=7.;}else if(x<.86){top=.513;id=8.;}else if(x<.946){top=.48;id=9.;}
  float inP=step(top,y);float br=.5+.5*sin(t*.55);
  vec2 bc=vec2(.5,.535);vec2 d=p-bc;float r=length(d);float ang=atan(d.x,-d.y);
  float pent=.809/cos(.6283-abs(mod(ang+.6283,1.2566)-.6283));
  float R0=.088*mix(1.,pent,.35)+(fbm(vec2(ang*3.,t*.12))-.5)*.022+(noise(p*uRes*.35)-.5)*.008;
  float blob=step(r,R0)*step(y,.6);float halo=exp(-max(0.,r-R0)/(.1+.02*br))*(1.-blob);
  float cloud=fbm(p*vec2(6.,4.)+vec2(id*3.1,t*.012))*.8+fbm(p*24.+id*1.7)*.4;
  float tx=TM(vec2(x*1.5+id*.21,y*1.15+t*(.004+.006*hash(vec2(id,3.)))));
  float lit=halo*(.82+.18*br)*(.8+.4*hash(floor(p*uRes*.5)+floor(t*10.)));
  v=inP*(.07+.12*cloud+.05*tx+lit*(.72+.3*cloud+.15*tx))+(1.-inP)*(.025+lit*.14);
  float lw=1.3/uRes.x;
  float e=edge(p,.1,.604,lw)+edge(p,.208,.518,lw)+edge(p,.3,.464,lw)+edge(p,.397,.464,lw)+edge(p,.47,.395,lw)+edge(p,.595,.395,lw)+edge(p,.697,.482,lw)+edge(p,.705,.482,lw)+edge(p,.783,.482,lw)+edge(p,.86,.48,lw)+edge(p,.946,.468,lw);
  v+=min(1.,e)*(.55+.12*sin(t*2.3+x*40.)+lit*.4);
  float door=step(abs(x-.5),.07)*step(.6,y);float seam=exp(-abs(x-.5)*uRes.x/1.5)*smoothstep(.62,.7,y)*(.04+.08*br);
  v=mix(v,.02+G(p,vec2(.5,.6),vec2(.075,.065))*(.9+.1*br)+seam,door);
  v=mix(v,.03,blob);
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
 } else if(uMode==9){ // dequoituparles — le même tourbillon, plus lent, plus trouble, sans lumière au centre
  vec2 c=vec2(.42,.54);float tx=swirl(p,c,5.5,.09,-.035,.6,1.9,vec2(.9,1.5),70.,1.2,.1,.45,t);
  float e=(fbm(p*5.+vec2(7.,t*.02))-.5)*.1;
  float m=smoothstep(.5,.42,G(p,vec2(1.,.54),vec2(.15,.24))+e)*smoothstep(.5,.42,G(p,vec2(.1,1.03),vec2(.24,.13))+e)*smoothstep(.5,.42,G(p,vec2(.72,1.04),vec2(.16,.09))+e);float halo=G(p,c,vec2(.16));
  v=tx*m*.78+halo*.1;
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
 gl_FragColor=vec4(mix(pal(v),uAcc,clamp(acc,0.,1.)),1.);}`;

let lyricsPromise = null;
function loadLyrics() {
  if (!lyricsPromise) lyricsPromise = fetch(new URL('./assets/brief/paroles.md', document.baseURI)).then(r => r.text()).then(md => {
    const out = {}; for (const s of md.split(/\n## /).slice(1)) { const m = s.match(/^(\d\d)\.[^\n]*\n\n\*[^\n]*\*\n\n([\s\S]*)/); if (m) out[m[1]] = m[2].replace(/\s+/g, ' ').trim(); } return out;
  }).catch(() => ({}));
  return lyricsPromise;
}
function textCanvas(txt, seed, st) {
  const S = 1024, c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S); g.fillStyle = '#fff'; g.font = st.font; g.textBaseline = 'top';
  const words = txt.split(' '); let wi = Math.floor(seed * words.length);
  for (let y = 0; y < S; y += st.lh) { let x = -((y * 7.3 + seed * 997) % 180); while (x < S) { const w = words[wi++ % words.length]; g.fillText(w, x, y); x += g.measureText(w).width + st.gap; } }
  return c;
}
const hex = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

class CoverLive extends HTMLElement {
  static get observedAttributes() { return ['track', 'time']; }
  connectedCallback() {
    if (!this.cv) { this.style.cssText += ';position:absolute;inset:0;display:block;overflow:hidden;background:#07060C'; this.makeCanvas(); }
    // hors champ : on rend le contexte WebGL (le navigateur en limite le nombre), on le reprend en revenant
    if (!this.io) this.io = new IntersectionObserver(es => { this.visible = es[es.length - 1].isIntersecting; if (this.visible) this.wake(); else { clearTimeout(this.relT); this.relT = setTimeout(() => this.release(), 1500); } }, { rootMargin: '200px' });
    if (!this.ro) this.ro = new ResizeObserver(() => this.draw());
    this.io.observe(this); this.ro.observe(this);
    this.running = true; this.t0 = performance.now() - (this.paused || 0); this.wake(); this.loop();
  }
  disconnectedCallback() { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.io.disconnect(); this.ro.disconnect(); clearTimeout(this.relT); this.relT = setTimeout(() => this.release(), 400); }
  attributeChangedCallback(name) { if (!this.gl || this.lost) return; if (name === 'track') this.setTrack(); this.draw(); }
  makeCanvas() {
    if (this.cv) this.cv.remove();
    const cv = this.cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; this.appendChild(cv);
    this.lost = false; this.released = false; this.gl = null; this.u = null;
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; if (!this.released && this.visible !== false) { clearTimeout(this.rbT); this.rbT = setTimeout(() => this.wake(), 1200); } });
    cv.addEventListener('webglcontextrestored', () => { this.lost = false; this.initGL(); this.draw(); });
    this.initGL();
  }
  release() { if (this.released || this.lost || !this.gl) return; const ext = this.gl.getExtension('WEBGL_lose_context'); if (ext) { this.released = true; this.loseExt = ext; ext.loseContext(); } }
  wake() {
    clearTimeout(this.relT); if (!this.lost) return;
    if (this.released && this.loseExt) { this.released = false; this.loseExt.restoreContext(); return; }
    // contexte retiré par le navigateur : nouveau canvas, nouveau contexte (trois essais par minute au plus)
    const now = performance.now(); this.rb = (this.rb || []).filter(x => now - x < 60000); if (this.rb.length >= 3) return; this.rb.push(now); this.makeCanvas(); this.draw();
  }
  initGL() {
    const gl = this.gl = this.cv.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true }); if (!gl || gl.isContextLost()) return;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error('[cover-live]', gl.getShaderInfoLog(o)); return o; };
    const pr = this.pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const U = k => gl.getUniformLocation(pr, k);
    this.u = { time: U('uTime'), mode: U('uMode'), pal: U('uPal'), acc: U('uAcc'), res: U('uRes'), text: U('uText'), textM: U('uTextM') };
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    const mk = (unit, mip) => { gl.activeTexture(gl.TEXTURE0 + unit); const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (mip && aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      return tx; };
    // deux copies des paroles : nette (modes historiques) et mipmappée (modes qui tournent ou se compriment — pas de moiré)
    this.tex = mk(0, false); this.texM = mk(1, true);
    gl.uniform1i(this.u.text, 0); gl.uniform1i(this.u.textM, 1); this.setTrack();
  }
  setTrack() {
    const gl = this.gl, n = this.getAttribute('track') || '05'; this.track = n;
    gl.uniform1i(this.u.mode, MODE[n] ?? 0); gl.uniform3fv(this.u.pal, new Float32Array((PAL[n] || PAL['05']).flatMap(hex))); gl.uniform3fv(this.u.acc, new Float32Array(hex(ACC[n] || '#000000')));
    const st = TXT[n] || TXT0;
    const upload = (txt) => { if (this.track !== n || this.gl !== gl || this.lost) return; const c = textCanvas(txt, parseInt(n) / 11, st);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.texM); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c); gl.generateMipmap(gl.TEXTURE_2D);
      this.draw(); };
    upload(FALLBACK); loadLyrics().then(l => { if (l[n]) upload(l[n]); });
  }
  loop() {
    if (!this.running) return; this.raf = requestAnimationFrame(() => this.loop());
    this.paused = performance.now() - this.t0; if (this.visible !== false) this.draw();
  }
  draw() {
    const gl = this.gl; if (!gl || this.lost || !this.u) return;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1); const w = Math.max(1, Math.round(this.clientWidth * dpr)), h = Math.max(1, Math.round(this.clientHeight * dpr));
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; gl.viewport(0, 0, w, h); }
    const ft = this.getAttribute('time'); const t = ft != null && ft !== '' ? +ft : (performance.now() - (this.t0 ?? performance.now())) / 1000;
    gl.uniform1f(this.u.time, t); gl.uniform2f(this.u.res, w, h); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
if (!customElements.get('cover-live')) customElements.define('cover-live', CoverLive);
})();
