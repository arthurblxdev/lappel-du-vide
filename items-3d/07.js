// 07 long fleuve — le fleuve vu du ciel, plein cadre, dans le langage de la pochette : un ruban d'or qui serpente du fond au premier plan entre des strates en aplats ; les paroles sont l'eau
// scène chargée par item-3d.js — le contrat est dans items-3d/LISEZMOI.md
(() => {
// le cours du fleuve, du premier plan (aval) vers le fond : une chaîne d'arcs [rayon, balayage en degrés (+ : tourne à gauche, − : à droite)]. grand rayon : un bief presque droit, qui traverse le cadre ; petit rayon : un virage
const COURS = [[14, 26], [1.05, 144], [9, -6], [1.0, -137], [9, 5], [1.05, 125], [10, -4], [1.1, -111], [1.3, 95], [1.6, -70]];
const CAP0 = -7, PIV = 0, ICI = [.55, -.2]; // cap de départ (degrés) ; la fin de l'arc PIV est posée en ICI (repère du plan : x, y = −z, la caméra est du côté des y négatifs)
const f = v => v < 0 ? `(${v.toFixed(5)})` : v.toFixed(5);
function arcs() {
  const D = Math.PI / 180, Q = Math.PI / 2, out = []; let x = 0, y = 0, psi = CAP0 * D, s = 0, bief = 0;
  for (const [R, sw] of COURS) {
    const sg = Math.sign(sw), dl = Math.abs(sw) * D, cx = x - sg * R * Math.sin(psi), cy = y + sg * R * Math.cos(psi), pm = psi + sg * dl / 2, pe = psi + sg * dl;
    const ys = Array.from({ length: 33 }, (_, i) => cy - sg * R * Math.cos(pm + sg * dl * (i / 32 - .5)));
    // bief : un tronçon entre deux retournements des paroles (là où le cap passe la verticale). au plus un retournement par arc
    out.push({ R, sg, cx, cy, h: dl / 2, pm, sm: s + R * dl / 2, lo: Math.min(...ys), hi: Math.max(...ys), bief, sens: Math.cos(psi) < 0 ? -1 : 1 });
    bief += Math.abs(Math.floor((pe - Q) / Math.PI) - Math.floor((psi - Q) / Math.PI));
    x = cx + sg * R * Math.sin(pe); y = cy - sg * R * Math.cos(pe); psi = pe; s += R * dl;
    out[out.length - 1].x1 = x; out[out.length - 1].y1 = y;
  }
  const dx = ICI[0] - out[PIV].x1, dy = ICI[1] - out[PIV].y1; out.forEach(a => { a.cx += dx; a.cy += dy; a.lo += dy; a.hi += dy; });
  return out;
}
const A = arcs();
// la distance à un arc. repère local : y vers le milieu de l'arc, x dans le sens du parcours. un arc qui ne peut pas gagner est écarté avant le calcul complet
const arc = (a, gagne) => `q=P-vec2(${f(a.cx)},${f(a.cy)});r=length(q);dd=abs(r-${f(a.R)});if(dd<d){q=vec2(dot(q,vec2(${f(Math.cos(a.pm))},${f(Math.sin(a.pm))})),dot(q,vec2(${f(a.sg * Math.sin(a.pm))},${f(-a.sg * Math.cos(a.pm))})));
  if(${f(Math.sin(a.h))}*q.y<${f(Math.cos(a.h))}*abs(q.x))dd=length(vec2(abs(q.x),q.y)-vec2(${f(Math.sin(a.h) * a.R)},${f(Math.cos(a.h) * a.R)}));
  if(dd<d){${gagne}}}`;
// à plus de LOIN du fil le paysage ne dépend plus de la distance au fleuve : on ne teste que les arcs de la même bande
const LOIN = 2.2, Y0 = Math.min(...A.map(a => a.lo)), Y1 = Math.max(...A.map(a => a.hi));
const bande = a => [a.lo > Y0 ? `P.y>${f(a.lo - LOIN)}` : '', a.hi < Y1 ? `P.y<${f(a.hi + LOIN)}` : ''].filter(Boolean).join('&&') || 'true';
const RIV = A.map(a => `if(${bande(a)}){` + arc(a, 'd=dd;') + '}').join('\n ');
const RIVC = A.map(a => arc(a, `d=dd;b=atan(q.x,q.y);o=vec4(${f(a.sg)}*(${f(a.R)}-r),${f(a.sm)}+${f(a.R)}*b,${f(a.pm)}+${f(a.sg)}*b,0.);o.w=${f(a.bief)}+(cos(o.z)*${f(a.sens)}<0.?1.:0.);`)).join('\n ');

(window.ITEM3D = window.ITEM3D || {})["07"] = {
  main: true,
  txt: { font: "italic 50px Georgia, 'Times New Roman', serif", lh: 64, gap: 15 }, // 32 lignes de 64 px dans la texture
  glsl: `
#define DH .11    // écart de hauteur entre deux strates (les plus hautes se resserrent)
#define RW .37    // demi-largeur du lit
#define LH .09    // hauteur d'une ligne de paroles
#define TW .4     // largeur d'une strate
#define PER (32.*LH) // un tour de texture, en longueur le long du fil : ce que le courant parcourt en une boucle
// vue d'avion : il vire à peine, et prend un peu de hauteur
void vue(vec2 q,out vec3 ro,out vec3 rd){vue0(q,.14*sin(W*uPh),4.6,3.9-.25*cos(W*uPh),vec3(0.,0.,-.7),2.8,ro,rd);}
// distance au fil du fleuve. P = (x, −z)
float riv(vec2 P){float d=1e9,r,dd;vec2 q;
 ${RIV}
 return d;}
// au plus près du fil : (écart signé, + à gauche du sens du parcours ; abscisse le long du fil ; cap ; bief)
vec4 rivc(vec2 P){float d=1e9,r,dd,b;vec2 q;vec4 o=vec4(0.);
 ${RIVC}
 return o;}
// bruit à contours organiques, centré sur 0 ; les octaves trop fines pour le pixel s'effacent
float fb(vec2 p,float px){float v=0.,a=1.,fr=1.;for(int i=0;i<4;i++){v+=a*(noise(p)-.5)*clamp(1.5-px*fr*1.5,0.,1.);p=p*2.13+vec2(3.1,1.7);fr*=2.13;a*=.58;}return v;}
// le même, qui se referme tous les N pas en x (pour que la lumière sur l'eau descende le courant et reboucle)
float pn(vec2 p,float N){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float x0=mod(i.x,N),x1=mod(i.x+1.,N);
 return mix(mix(hash(vec2(x0,i.y)),hash(vec2(x1,i.y)),f.x),mix(hash(vec2(x0,i.y+1.)),hash(vec2(x1,i.y+1.)),f.x),f.y);}
// le paysage en strates, comme des courbes de niveau : sous 1 l'eau, puis une strate par unité (brun, vert d'eau, vert nuit, nuit). le premier plan descend vers la nuit, le fond reste clair
float F(vec2 P,float px){float d=riv(P)-RW;
 vec2 q=P+.22*vec2(sin(P.y*1.3+1.5*sin(P.x*.9)),sin(P.x*1.1+1.7+1.4*sin(P.y*.8)));
 float lg=sin(P.x*1.15+1.9*sin(P.y*.75+.6)+2.1)*sin(P.y*1.35+1.2*sin(P.x*.6)+.4); // la berge brune : large par endroits, presque absente ailleurs
 return 1.+min(d/TW,1.45)+.75*lg*smoothstep(0.,.3,d)*(1.-smoothstep(.5,1.,d))+2.*fb(q*vec2(1.45,2.2)+vec2(4.1,7.3),px*2.2)*(.7*smoothstep(-.2,.05,d)+.4*smoothstep(.1,.6,d))+clamp(.75-.5*P.y,0.,2.4)*smoothstep(.1,.7,d);}
float haut(float j){return DH*j*(1.15-.09*j);} // la hauteur de la strate j (0 : l'eau)
// l'eau, en indice de palette : l'or, des taches jaunes qui descendent le courant, et les paroles à l'encre brune.
// cinq lignes fines qui suivent le fil et glissent vers l'aval (un tour de texture par boucle) ; elles restent à l'endroit : là où le fleuve repart vers la gauche elles se retournent.
// chaque bief porte cinq rangées qui se suivent dans le texte ; au premier plan, la quatrième dit « la vie c'est pas un long fleuve tranquille, on sait naviguer » (rangée 4 de la texture).
// dans le virage, et entre deux phrases, la ligne se défait en un filet de lumière
float eau(vec2 P,float px){vec4 c=rivc(P);
 float g=pn(vec2((c.y/PER+uPh)*6.,c.x*3.+7.),6.)+.4*fb(P*vec2(2.5,4.)+9.,px*4.)-.4*smoothstep(.35,1.,abs(c.x)/RW);float I=4.+smoothstep(-1.5*px,1.5*px,g-.5);
 float y=c.x/LH+2.5,j=floor(y);if(j<0.||j>4.)return I;
 float cs=cos(c.z),o=cs<0.?-1.:1.,fy=fract(y),li=o>0.?4.-j:j; // li : la ligne, comptée depuis le haut de l'image
 float u=o*((c.y-(j-2.)*LH*c.z)/PER+uPh)+(2.-li)*.07+c.w*.23+.652;float h=fract(u),m=smoothstep(.1,.35,abs(cs))*smoothstep(.05,.16,h)*smoothstep(.99,.89,h);
 float tx=T(vec2(u,(mod(1.+6.*c.w+li,32.)+(o>0.?1.-fy:fy))/32.))*m;
 float filet=1.-smoothstep(-.02,.02,abs(fy-.5)+.03-.08*(1.-smoothstep(0.,.3,m)));
 return mix(mix(I,5.,filet),3.,smoothstep(.08,.6,tx));}
void main(){
 vec2 q=(gl_FragCoord.xy-.5*uRes)/(.5*uRes.y);vec3 ro,rd;vue(q,ro,rd);float px=1./(1.4*uRes.y),hx=length(rd.xz)+1e-4,vy=-rd.y;
 vec2 lo=normalize(vec2(-.85,.5))*.06; // vers la lumière : elle vient de la gauche, un peu du fond
 // les strates sont des feuilles posées à des hauteurs différentes : on les traverse de la plus haute à l'eau, chaque bord lissé sur un pixel
 float cov=0.,v=0.,fp=0.;
 for(int i=0;i<5;i++){float j=4.-float(i),t=(haut(j)-ro.y)/rd.y;vec3 p=ro+rd*t;vec2 P=vec2(p.x,-p.z);float fw=t*px/vy;
  float f=F(P,fw),w=.6*max(i>0?abs(f-fp)*t*px/((haut(j+1.)-haut(j))*hx):0.,3.5*fw);fp=f;
  float a=j>.5?smoothstep(-w,w,f-j):1.;
  if(a>.002){float sup=smoothstep(-w,w,f-(j+1.)),I=j>.5?4.-j:(sup<.998?eau(P,fw):3.); // sup : on est déjà sous la feuille du dessus (son flanc, de la même teinte qu'elle)
   float om=I>.5&&sup<.998?smoothstep(-6.*w,6.*w,F(P+lo,fw)-(j+1.)):0.;                // l'ombre fine de la feuille du dessus, du côté opposé à la lumière
   float cible=j>.5?max(I-1.,0.):3.;                                                    // l'ombre et le flanc tirent vers la teinte de la feuille du dessus
   v+=(1.-cov)*a*mix(I,cible,max(sup,(j>.5?.6:.45)*om));cov+=(1.-cov)*a;}
  if(cov>.995)break;}
 v/=5.;v+=(hash(gl_FragCoord.xy*.73+fract(uTime)*37.)-.5)*.035; // un peu plus de grain que le socle, comme la pochette
 v/=1.-.22*dot(q*vec2(.8,.55),q*vec2(.8,.55)); // la vignette du socle est compensée : les aplats restent ceux de la palette jusqu'aux bords
 gl_FragColor=developpe(v,q,false);}`,
};
})();
