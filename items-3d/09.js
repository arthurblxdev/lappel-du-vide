// 09 dequoituparles! — l'œil : la nuit s'ouvre en amande, on ne voit des paupières qu'un bord ; l'iris est le tourbillon de paroles, la pupille un puits sans lumière au fond
// scène chargée par item-3d.js — le contrat est dans items-3d/LISEZMOI.md
(() => {
const f = x => x.toFixed(5), v3 = a => `vec3(${a.map(f).join(',')})`;
const nrm = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// l'œil est un grand globe presque plat (rayon RGL, sommet à l'origine) ; les paupières sont la même surface, TL plus haut, fendue en amande
const RGL = 1.8, TL = .07;
// le repère de l'iris : oe = son centre sur le globe, gz = l'axe du regard, à peine en coin (vers la droite)
const OX = .07, OY = -.03, oe = [OX, OY, Math.sqrt(RGL * RGL - OX * OX - OY * OY) - RGL];
const LACET = .14, TANGAGE = -.03;
const gz = [Math.sin(LACET) * Math.cos(TANGAGE), Math.sin(TANGAGE), Math.cos(LACET) * Math.cos(TANGAGE)];
const gx = nrm(cross([0, 1, 0], gz)), gy = cross(gz, gx);
// la source : une seule, hors champ, de face et d'en haut, un peu à gauche — un panneau étroit. l1 = d'où vient sa lumière, ll = la même dans le repère de l'iris,
// ls = le centre du panneau tel qu'il se reflète dans la cornée (lx, ly : sa largeur et sa hauteur)
const l1 = nrm([-.2, .38, .9]), ll = [dot(l1, gx), dot(l1, gy), dot(l1, gz)];
const ls = nrm([-.3, .32, .9]), lx = nrm(cross(ls, [0, 1, 0])), ly = cross(lx, ls);
// la cornée : une calotte sphérique (rayon au pied RB, hauteur HB, rayon de courbure RC) autour de l'axe du regard
// l'iris (rayon RI, à la hauteur ZI sur l'axe) : un cône (pente SL) qui plonge dans un puits (rayon R0, qui se resserre de TN par unité de profondeur), raccord arrondi KF
const RI = .48, RB = .53, HB = .1, ZI = -.16, SL = .3, R0 = .17, TN = .25, KF = .13, ZL = ZI - SL * (RI - R0) - KF * .5, RC = (RB * RB + HB * HB) / (2 * HB);
(window.ITEM3D = window.ITEM3D || {})["09"] = {
  txt: { font: "bold 144px Georgia, 'Times New Roman', serif", lh: 2048 / 12, gap: 36 }, // 12 lignes par texture, 3 textures par tour : 36 fibres
  glsl: `
#define PAS .7
#define NST 60
const vec3 OE=${v3(oe)};const vec3 GX=${v3(gx)};const vec3 GY=${v3(gy)};const vec3 GZ=${v3(gz)};
const vec3 L1=${v3(l1)};const vec3 LL=${v3(ll)};const vec3 LS=${v3(ls)};const vec3 LX=${v3(lx)};const vec3 LY=${v3(ly)};
const float RGL=${f(RGL)};const float TL=${f(TL)};const float RI=${f(RI)};const float RC=${f(RC)};const float HB=${f(HB)};const float ZI=${f(ZI)};
const float SL=${f(SL)};const float CA=${f(1 / Math.hypot(1, SL))};const float TN=${f(TN)};const float CB=${f(1 / Math.hypot(1, TN))};const float KF=${f(KF)};const float ZL=${f(ZL)};
float r0; // la pupille, qui respire à peine
void vue(vec2 q,out vec3 ro,out vec3 rd){r0=${f(R0)}*(1.+.04*sin(W*uPh*2.));vue0(q,.3*sin(W*uPh),4.,.2,vec3(0.,-.21,-.3),2.85,ro,rd);}
float smax(float a,float b,float k){return -smin(-a,-b,k);}
float imod(float x,float y){return x-y*floor((x+.5)/y);} // reste d'un entier, à l'abri des arrondis
// la fente des paupières, vue de face : deux arcs ; celui du haut est plus bas et plus plat (la paupière lourde)
float fente(vec2 p){return max(length(p-vec2(0.,-.9676))-1.2576,length(p-vec2(0.,.6745))-1.1245);}
float map(vec3 p){float g=length(p-vec3(0.,0.,-RGL))-RGL;vec3 d=p-OE;vec2 qa=vec2(dot(d,GX),dot(d,GY));
 float B=smax(sqrt(max(RC*RC-dot(qa,qa),0.))-RC+HB,0.,.03); // la cornée : une calotte bombée, autour de l'axe du regard
 float e=g-B;                                              // le blanc et sa cornée
 float l=g-TL-.75*B;                                       // les paupières, qui se soulèvent au passage de la cornée
 float c=fente(p.xy)-.7*clamp(e,0.,TL+.02);                // la fente est biseautée : le bord des paupières a une épaisseur
 l=smax(l,-c,.02);gm=e<l?1.:0.;return min(e,l);}
// l'iris dans son repère : sous le cône et hors du puits (qui se resserre), raccord arrondi
float iris(vec3 q){float r=length(q.xy);float a=(q.z-ZI+SL*(RI-r))*CA;float b=(r0-r-TN*(ZL-q.z))*CB;
 float h=clamp(.5+.5*(a-b)/KF,0.,1.);return mix(b,a,h)+KF*h*(1.-h);}
// l'ombre de la paupière sur ce qui est h plus bas qu'elle
float ombre(vec2 xy,float h){return smoothstep(.0,-.09,fente(xy+L1.xy/L1.z*h)-.03);}
float fond(vec3 ro,vec3 rd){return .016;}
float surf(vec3 ro,vec3 rd,vec3 p,vec3 n){map(p);float m=gm;float ndv=max(dot(n,-rd),0.);vec3 R=reflect(rd,n);float fe=fente(p.xy);
 float df=max(dot(n,L1),0.);float fres=pow(1.-ndv,3.);
 if(m<.5){ // les paupières : la nuit. on n'en voit que le bord — un liseré sur l'arête, la tranche qui prend la lumière en bas — et le reste se perd
  float fo=max(fe,0.);float haut=smoothstep(-.25,.15,p.y);         // la paupière du haut : plus discrète
  float A=exp(-fo/mix(.045,.03,haut))*mix(1.,.55,haut);
  return .016+A*(.03+.34*df)+.022*exp(-fo/.3)*df*(1.-.5*haut)+A*.3*pow(max(dot(R,L1),0.),40.);}
 // le blanc : un verre sombre, qui s'éteint vers les coins ; sous la cornée, l'iris
 vec3 q=vec3(dot(p-OE,GX),dot(p-OE,GY),dot(p-OE,GZ));float ra=length(q.xy);
 float co=smoothstep(RI+.03,RI-.07,ra);
 float sh=.35+.65*ombre(p.xy,TL);float ao=.4+.6*smoothstep(.0,-.12,fe);float coin=smoothstep(1.05,.45,abs(p.x));
 float v=(.05+.27*df*sh)*ao*coin+.08*pow(max(dot(R,L1),0.),8.)*sh;
 if(co>0.){
  vec3 rin=refract(rd,n,.75);vec3 qd=vec3(dot(rin,GX),dot(rin,GY),dot(rin,GZ));
  float t=0.;bool hit=false;vec3 qq=q;
  for(int i=0;i<48;i++){qq=q+qd*t;float d=iris(qq);if(d<.0012){hit=true;break;}t+=d;if(t>1.6)break;}
  float vi=.012;
  if(hit){float r=max(length(qq.xy),1e-4);float th=atan(qq.y,qq.x);
   float a=(qq.z-ZI+SL*(RI-r))*CA;float b=(r0-r-TN*(ZL-qq.z))*CB;float h=clamp(.5+.5*(a-b)/KF,0.,1.);
   vec2 g2=normalize(vec2(mix(-CB,-SL*CA,h),mix(TN*CB,CA,h)));vec3 ni=vec3(g2.x*qq.xy/r,g2.y);
   float dz=max(ZI-SL*(RI-r)-qq.z,0.);float w=log(r/RI)-.8*dz/r0;   // le long de la fibre : le log du rayon, prolongé par la profondeur dans le puits
   float tp=th-W*uPh/3.-.35*w+.3*w*w;                                 // la fibre se tord de plus en plus vers la pupille ; l'iris tourne d'un tiers de tour par boucle
   float kk=.35-.6*w;float sq=sqrt(1.+kk*kk);float su=(.3572-.5*(kk*sq+log(kk+sq)))/.6; // longueur le long de la fibre tordue : les lettres gardent leur largeur
   float V=-tp*3./W;float fv=fract(V);float J=V*12.;                  // trente-six fibres : trois secteurs de douze lignes de la texture
   float u0=su*3./W+.66+uPh/3.;                                       // les mots glissent d'un tiers de texture par boucle, vers la pupille
   float ja=2.*floor(J*.5+.25),jb=2.*floor(J*.5-.25)+1.;              // la ligne paire et la ligne impaire les plus proches : deux lectures, chacune continue autour de sa ligne (pas de liseré entre les lignes)
   float ua=u0+floor(imod(ja,36.)/12.)*.6667+hash(vec2(imod(ja,12.),7.)); // chaque secteur lit deux tiers plus loin, chaque ligne a son décalage : pas deux fois les mêmes mots, et la boucle se referme
   float ub=u0+floor(imod(jb,36.)/12.)*.6667+hash(vec2(imod(jb,12.),7.));
   float pair=step(imod(floor(J),2.),.5);float U=mix(ub,ua,pair);
   float tx=mix(T(vec2(ub,fv)),T(vec2(ua,fv)),pair)*smoothstep(0.,.006,min(fv,1.-fv))*smoothstep(0.,.012,abs(fract(U+.5)-.5));
   float s3=3.*tp-2.4*w;float arms=.24+.76*smoothstep(-.7,-.05,sin(s3+3.*fbm(vec2(cos(3.*tp),sin(3.*tp))*1.3+w*2.))); // trois bras, comme sur la pochette : des paquets de lignes séparés par du noir
   float D=max(ZL-qq.z,0.);                                           // profondeur dans le puits
   float sw=mix(1.,smoothstep(r0+.01,r0-.05,length(qq.xy+LL.xy/LL.z*D)),smoothstep(0.,.03,D)); // le bord du puits fait de l'ombre dedans
   vec3 pw=OE+GX*qq.x+GY*qq.y+GZ*qq.z;float sh2=.4+.6*ombre(pw.xy,TL-pw.z);
   float nl=max(dot(ni,LL),0.);float li=(.22+1.05*nl*sw*sh2)*exp(-D/.2);
   float cz=.85+.2*dot(qq.xy/r,-normalize(LL.xy));                    // la cornée concentre la lumière du côté opposé à la source
   float fib=.5+.5*sin(tp*51.+5.*sin(tp*12.+w*3.)+w*4.);              // le grain des fibres, sous les mots
   vi=(.1+.06*fib+tx*arms*.95)*li*cz+.012;}
  v=mix(v,vi*(.55+.45*smoothstep(RI+.01,RI-.07,ra))*(.5+.5*smoothstep(.0,-.05,fe)),co);}
 // le reflet de la source sur la cornée, le liseré
 float hy=dot(R,LY);float hl=smoothstep(.075,.045,abs(dot(R,LX)))*smoothstep(-.21,-.12,hy)*smoothstep(.21,.16,hy)*step(0.,dot(R,LS)); // un panneau haut et étroit, aux bords doux
 return v+fres*.08+hl*sh*(.25+.6*co)*(.8+.2*smoothstep(-.2,.2,hy));}
vec3 nrm(vec3 p){vec2 e=vec2(.002,0.);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
float rendu(vec2 q){vec3 ro,rd;vue(q,ro,rd);vec3 oc=ro-vec3(0.,0.,-RGL);float b=dot(oc,rd);float rb=RGL+TL+HB+.02;float h=b*b-dot(oc,oc)+rb*rb; // on part de la sphère qui enveloppe paupières et cornée
 bool hit=false;vec3 p=ro;
 if(h>0.){float t=-b-sqrt(h);float tf=t+.7;
  for(int i=0;i<NST;i++){p=ro+rd*t;float d=map(p);if(d<.0015){hit=true;break;}t+=d*PAS;if(t>tf)break;}}
 if(hit)return surf(ro,rd,p,nrm(p)); // hors de la boucle : la texture a besoin de voisins au même endroit du programme
 return fond(ro,rd);}
// deux rayons par pixel : les bords des paupières et les lettres sans escalier
void main(){vec2 q=(gl_FragCoord.xy-.5*uRes)/(.5*uRes.y);vec2 e=vec2(.25,.25)/(.5*uRes.y);
 gl_FragColor=developpe(.5*(rendu(q+e)+rendu(q-e)),q,false);}`,
  main: true,
};
})();
