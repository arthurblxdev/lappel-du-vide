// 10 persephone — la grenade cassée, posée au sol, développée comme un tirage (nuit, grain, paliers, cœur solarisé) : la peau tachée, le blanc sec de l'écorce, le calice, les arilles mats et translucides pris dans le blanc autour d'un cœur vide qui brûle, les paroles droites à travers eux, trois grains tombés
// scène chargée par item-3d.js — le contrat est dans items-3d/LISEZMOI.md
(() => {
// les grains tombés au sol : [x, z, angle de couché]
const TOMBES = [[.46,.50,.3],[.61,.62,2.5],[.12,.86,3.4]];
const G = new Float32Array(32);
TOMBES.forEach(([x, z, a], i) => G.set([x, z, Math.cos(a), Math.sin(a)], i * 4));
(window.ITEM3D = window.ITEM3D || {})["10"] = {
  txt: { font: "italic bold 50px Georgia, 'Times New Roman', serif", lh: 64, gap: 14 },
  uniforms: () => ({ uG: ['4fv', G] }),
  glsl: `
uniform vec4 uG[8];
#define PAS .9
#define FAR 9.
#define NST 100
#define FOLD
const float YG=-.6;                         // le sol
const vec3 NC=vec3(.3397,.1998,.9191);      // la cassure regarde par là : normalize(.34,.2,.92)
const vec3 UF=vec3(.938,0.,-.3467);         // repère de la cassure : droite…
const vec3 VF=vec3(-.0693,.9798,-.1874);    // …et haut
const vec3 AX=vec3(-.2246,.8984,-.3773);    // l'axe du fruit, vers le calice : normalize(-.25,1.,-.42)
const vec3 AU=vec3(.9701,.2425,0.);         // deux axes en travers, pour tourner autour
const vec3 AV=vec3(.0915,-.3661,-.9261);
const vec3 AF=vec3(-.0799,.9666,-.2436);    // l'axe du fruit vu du repère de la cassure
const vec3 SL=vec3(.15,.13,.12);            // pas du semis des arilles : dans le rang, entre rangs, entre couches (en quinconce)
vec3 c1,a1,tc,ta;float r1,gd2,tr,gao=.1;    // l'arille touché (centre, axe, rayon), l'écart avec son voisin ; le grain tombé ; la distance aux arilles, pour leur ombre sur le blanc
float gq=0.;                                // 0 : le rayon avance ; 1 : il a touché un arille ; 2 : autre chose
void vue(vec2 q,out vec3 ro,out vec3 rd){vue0(q,.42*sin(W*uPh),4.2,.5,vec3(0.,.02,0.),2.8,ro,rd);}
vec3 fc(vec3 p){return vec3(dot(p,UF),dot(p,VF),dot(p,NC));} // vers le repère de la cassure
vec3 h3(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.xxy+p.yxx)*p.zyx);}
float bosse(vec2 d,float r){float t=max(1.-dot(d,d)/(r*r),0.);return t*t;}
// un arille : une larme, le ventre vers a, la pointe vers -a
float larme(vec3 e,vec3 a,float r){float s=dot(e,a);float t=s-.2*r;vec3 q=e-s*a;float m=max(-t,0.)/r;float k=1.+.45*m*m;return (length(vec2(length(q)*k,t*(t<0.?.69:1.)))-r)/k;}
// hauteur de la cassure, le long de NC : celle des arilles (deux bosses, la poche d'un quartier arraché), celle de l'écorce (déchirée ; un morceau est parti devant la poche)
float casse(vec2 q){return .2+.06*bosse(q-vec2(-.25,.22),.4)+.04*bosse(q-vec2(.3,.3),.3)-.36*bosse(q-vec2(.33,-.4),.33)+.03*bosse(q-vec2(-.3,-.3),.35);}
float bord(float u,float v){float b=bosse(vec2(u-.5,v+.5),.4);return .08+(.045*sin(4.3*u+1.3)*sin(3.7*v+.4)+.02*sin(10.*u+7.*v)+.01*sin(19.*v-13.*u))*(1.-.8*b)-.4*b;}
// les membranes : cinq cloisons inégales qui partent du cœur (droites ici, ondulées par la déformation du semis)
float rayon(vec2 q,vec2 d){return dot(q,d)>0.?abs(q.x*d.y-q.y*d.x):length(q);}
float cloison(vec2 q){return min(min(rayon(q,vec2(.9397,.342)),rayon(q,vec2(-.0872,.9962))),min(min(rayon(q,vec2(-.9397,.342)),rayon(q,vec2(-.6691,-.7431))),rayon(q,vec2(.5,-.866))));}
vec3 ondule(vec3 P){return .045*sin(P.yzx*3.1+vec3(.7,2.3,4.1))+.018*sin(P.zxy*6.3+vec3(1.9,.4,3.3));}
// le fruit : un peu aplati, six pans doux ; le calice : un tube évasé à six dents
float corps(float h,float ro,float an){return length(vec2(ro,h*(h>0.?1.05:1.15)))-.68*(1.+.03*cos(6.*an+.5)*smoothstep(.05,.45,ro));}
float calice(float h,float ro,float an){float y=h-.58;float rr=.1+.18*y+.9*y*y;float d=abs(ro-rr)-.017-.012*smoothstep(.1,-.02,y)+.03*y;
 d=max(d,(y-.14-.14*(1.-abs(sin(3.*an+.4))))*.45);return max(d,-.12-y);}
// les arilles : semés en quinconce dans le repère déformé, entiers (jamais coupés par la cassure), gros au point de se toucher (un pli entre deux, pas de fente où le rayon se perd) ; .07 : le plus grand pas permis quand aucun n'est proche
float grains(vec3 P,vec3 w,vec3 dw){float d1=.07,d2=.07;float k0=floor(w.z/SL.z-.5);
 for(int kk=0;kk<2;kk++){float k=k0+float(kk);float pk=mod(k,2.);float ov=pk*SL.y*.37;float j0=floor((w.y-ov)/SL.y-.5);
  for(int jj=0;jj<2;jj++){float j=j0+float(jj);float ou=mod(j+pk,2.)*SL.x*.5;float i0=floor((w.x-ou)/SL.x-.5);
   for(int ii=0;ii<2;ii++){vec3 id=vec3(i0+float(ii),j,k);vec3 hh=h3(id+vec3(7.,3.,11.));
    vec3 cw=(id+.5+(hh-.5)*.4)*SL+vec3(ou,ov,0.);float rc=dot(cw,cw);float hc=dot(cw,AF);
    if(rc<.08||rc+hc*hc*.4>.325)continue; // ni dans le cœur, ni dans l'écorce
    float lc=dot(cw.xy,cw.xy);float cz=cw.z-casse(cw.xy);if(cz>0.||cz<-.2||(cw.z>0.&&lc<.04)||(lc>.07&&cloison(cw.xy)<.035))continue; // ni au-dessus de la cassure, ni noyé dans le blanc, ni devant le cœur, ni sur une membrane
    float r=.072+.016*hh.x;vec3 c=cw-dw;vec3 a=normalize(cw+(hh.yzx-.5)*.25);float dd=larme(P-c,a,r);
    if(dd<d1){d2=d1;d1=dd;c1=c;a1=a;r1=r;}else d2=min(d2,dd);}}}
 gd2=d2-d1;return d1;}
float map(vec3 p){vec3 P=fc(p);
 // une fois l'arille touché (seuil du socle : .0015), la normale et la matière ne regardent plus que lui
 if(gq>.5&&gq<1.5){gm=0.;return larme(P-c1,a1,r1);}
 float d=1e9;gm=4.;float yg=p.y-YG;if(yg<-.03)return 9.;
 // les grains tombés : seulement près du sol, et dans leur coin
 if(yg<.18){vec2 e=abs(p.xz-vec2(.37,.68))-vec2(.35,.29);float db=max(e.x,e.y);
  if(db>.05)d=db;else for(int i=0;i<3;i++){vec4 g=uG[i];float r=.056+.004*float(i);vec3 a=vec3(g.z,0.,g.w);vec3 c=vec3(g.x,YG+r*.93,g.y);float dd=larme(p-c,a,r);if(dd<d){d=dd;tc=c;ta=a;tr=r;}}}
 else d=yg-.15;
 float bs=length(p-AX*.12)-.84;if(bs>.2)return min(d,bs);
 float h=dot(p,AX);vec3 q=p-h*AX;float ro=length(q);float an=atan(dot(q,AV),dot(q,AU));
 float bd=corps(h,ro,an);
 // l'écorce, déchirée à la cassure ; le calice
 float ec=abs(bd+.036)-.036;if(ec<.1&&P.z>-.45)ec=max(ec,(P.z-bord(P.x,P.y))*.45);
 if(h>.4)ec=smin(ec,calice(h,ro,an),.035);
 if(ec<d){d=ec;gm=1.;}
 if(bd<-.02){vec3 dw=ondule(P);vec3 w=P+dw;float lw=length(w.xy);float fa=w.z-casse(w.xy);
  if(gq<.5){gao=.1;if(fa>-.3){float g=fa>.14?(fa-.1)*.7:max(grains(P,w,dw),bd+.025);gao=g;if(g<d){d=g;gm=0.;}}}
  // le blanc du dedans : le lit où les arilles sont pris, les membranes qui en montent entre les loges ; le cœur est vide, ouvert vers nous
  float me=(fa-.06)*.7;if(fa<.2){me=smin((fa+.19)*.7,max(cloison(w.xy)-.005+.1*min(fa+.1,0.),max(.27-lw,fa+.1+.015*sin(31.*lw)+.1*smoothstep(.42,.62,lw)+.1*smoothstep(.36,.27,lw)-.08*bosse(w.xy-vec2(.33,-.4),.33))*.7),.03);
   me=max(max(me,bd+.06),-min(length(w)-.27,max(lw-.19,-w.z)));}
  if(me<d){d=me;gm=2.;}}
 if(d<.0015&&gq<.5)gq=gm<.5?1.:2.;
 return d;}
// la lumière du dedans : elle respire, deux souffles par boucle, l'onde part du cœur
float souffle(float r){return .84+.16*sin(W*(uPh*2.-r*.9));}
// ce que la cassure envoie dehors, vers un point g
float eclat(vec3 g){vec3 dl=g-NC*.12;float d2=dot(dl,dl);float cn=dot(dl,NC)/sqrt(d2);return (.25+.75*smoothstep(.35,.8,cn))*smoothstep(-.1,.35,cn)/(d2+.15);}
// le tirage : du grain dans les valeurs moyennes, puis des paliers doux sur les teintes de la palette (le socle replie, vignette et regraine ensuite)
float tirage(float v){float g=noise(gl_FragCoord.xy*.6+fract(uTime)*91.)+hash(gl_FragCoord.yx+fract(uTime)*37.)-1.;
 v=max(v+g*.05*smoothstep(.02,.3,v),0.);float x=v*5.;return (floor(x)+smoothstep(.12,.88,fract(x)))*.2;}
// la nuit, un halo, et le sol : une flaque sourde devant la cassure, l'ombre sous le fruit, l'ombre de chaque grain tombé et la tache de lumière qui le traverse
float fond(vec3 ro,vec3 rd){float v=.014;float dl=axe(vec3(0.,.05,0.),ro,rd);v+=.05*exp(-dl*dl/.6);
 if(rd.y<0.){float t=(YG-ro.y)/rd.y;vec3 g=ro+rd*t;vec3 dv=g-NC*.12;float E=eclat(g)*(-dv.y)/length(dv)*souffle(1.);
  vec2 gp=g.xz-vec2(-.04,-.06);float rr=dot(gp,gp);E+=.05*exp(-rr/.9);E*=smoothstep(.03,.4,rr);
  vec2 bx=abs(g.xz-vec2(.37,.68))-vec2(.35,.29);
  if(max(bx.x,bx.y)<.35)for(int i=0;i<3;i++){vec4 g4=uG[i];vec2 c=g4.xy;vec2 dc=c-NC.xz*.12;float dd=length(dc);vec2 dir=dc/dd;float len=.2*dd+.03;
   vec2 e=g.xz-c;float s=clamp(dot(e,dir),-.02,len);float ds=length(e-dir*s);
   E*=1.-.75*smoothstep(.11,.02,ds);
   vec2 ec=e-dir*(len*.55+.04);E+=eclat(vec3(c.x,YG+.06,c.y))*.3*exp(-dot(ec,ec)/.0012);}
  v+=E*.65*(.55+.9*fbm(g.xz*9.))-.03*exp(-rr/.15);}
 return tirage(v);}
float surf(vec3 ro,vec3 rd,vec3 p,vec3 n){map(p);float m=gm;float nv=max(dot(n,-rd),0.);float r=length(p);
 vec3 L1=normalize(vec3(-.55,.75,.45));
 float br=souffle(r);float l=br*exp(-max(r-.22,0.)*4.2);float v;
 if(m<.5){ // un arille : mat, translucide ; la lumière du cœur le traverse (plus clair de ce côté, liseré à contre-jour, le pépin en ombre) ; les paroles droites, vues à travers lui
  vec3 P=fc(p),N=fc(n),R=fc(rd);vec3 rin=refract(R,N,.75);
  vec3 e=c1-P;e-=a1*dot(e,a1)*.45;vec3 ri=normalize(rin-a1*dot(rin,a1)*.45);float pep=1.-smoothstep(.2,.55,length(cross(e,ri))/r1);
  float tx=T(vec2(p.x,-p.y)*.45+.5);
  float lit=.5+.5*dot(N,-normalize(P));float jo=smoothstep(0.,.045,gd2);float per=fract(r1*913.7);float tr=l*(.4+.6*lit);
  v=.02+1.3*tr*(1.-.62*pow(nv,1.5))*(.25+.75*jo)*(.75+.5*per)*(1.-.5*pep)+tx*(.1+.75*l)*smoothstep(.05,.4,nv)+.17*pow(max(dot(n,L1),0.),1.5)*(.4+.6*per)*(.3+.7*jo);}
 else if(m<1.5){ // l'écorce : la peau dehors (dans la nuit, tachée, piquée), le blanc sec sur la tranche ; le calice
  float h=dot(p,AX);vec3 q=p-h*AX;float ro2=length(q);float an=atan(dot(q,AV),dot(q,AU));float bd=corps(h,ro2,an);
  float cal=(h>.6&&ro2<.34)?1.:0.;float tex=fbm(p.xy*7.+p.z*vec2(3.,5.));float fin=fbm(p.xy*41.+p.z*23.);float peau=max(smoothstep(-.014,-.005,bd),cal);
  vec3 L2=normalize(vec3(-.45,.85,-.2));float d2=max(dot(n,L2),0.);float tache=smoothstep(.75,.3,noise(p.xy*4.3+p.z*vec2(2.,-3.)+7.));
  float sk=.012+(.11+.16*cal)*d2*(.15+1.7*tex*tex)*(.55+.9*fin)*(.5+.5*tache)+(.02+.1*cal)*max(dot(n,L1),0.)*(.4+1.2*fin)+.07*pow(max(dot(reflect(rd,n),L2),0.),9.)*tex*fin*4.+pow(1.-nv,2.5)*(.035+.2*d2)*(.4+1.2*tex)+.05*pow(max(dot(n,normalize(vec3(.1,-.6,.75))),0.),1.5);
  float pi=(.1+.8*br*exp(-max(r-.22,0.)*3.))*(1.-.5*clamp((bd+.072)/.072,0.,1.))*(.35+.7*tex+.7*fin);
  v=mix(pi,sk,peau);}
 else if(m<2.5){ // le blanc du dedans : pâle, mat, fibreux, il conduit la lumière ; les arilles y posent leur ombre
  vec3 P=fc(p);float tex=fbm(vec2(atan(P.y,P.x)*7.,length(P.xy)*4.+P.z*3.));float mou=noise(P.xy*17.+P.z*9.);
  v=.04+.9*l*(.6+.4*nv)*(.55+.5*tex+.5*mou)*(.35+.65*smoothstep(0.,.07,gao));}
 else{ // un grain tombé : la même matière, éclairée de côté par la cassure ; la lumière ressort de l'autre côté
  vec3 Ld=normalize(NC*.12-p);float I=min(eclat(p)*souffle(1.),1.);vec3 rin=refract(rd,n,.75);
  vec3 e=tc-p;e-=ta*dot(e,ta)*.45;vec3 ri=normalize(rin-ta*dot(rin,ta)*.45);float pep=1.-smoothstep(.2,.55,length(cross(e,ri))/tr);
  float tx=T(vec2(p.x,-p.y)*.45+.5);float w=.5+.5*dot(n,Ld);
  v=.02+.8*I*(.15+.85*w*w)*(1.-.55*pow(nv,1.5))*(1.-.5*pep)+.5*I*pow(max(dot(n,-Ld),0.),3.)+tx*(.1+.6*I)*smoothstep(.05,.4,nv)+.15*pow(max(dot(n,L1),0.),1.5);}
 if(m<2.5){ // le cœur : on regarde la lumière en face ; elle brûle, dépasse 1 et se replie (le soleil devient un trou)
  float dc=axe(vec3(0.),ro,rd);if(dot(p-ro,rd)>dot(-ro,rd)-.05)v=mix(v,1.7,br*exp(-dc*dc/.02));v+=br*.14*exp(-dc*dc/.15);}
 return tirage(min(v,1.72));}`,
};
})();
