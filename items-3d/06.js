// 06 imperméable — la lumière d'un lampadaire sous la pluie : une boule de lumière dans l'air mouillé, la pluie (les paroles étirées en traits) qui s'allume en la traversant ; du lampadaire, juste un capot de tôle et un fil
// scène chargée par item-3d.js — le contrat est dans items-3d/LISEZMOI.md
(window.ITEM3D = window.ITEM3D || {})["06"] = {
  main: true,
  glsl: `
const vec3 LC=vec3(0.,3.,0.);    // la source : l'ampoule, au fond du capot
const float FOC=2.8;
const vec2 DM=vec2(.8993,-.4372); // de quel côté part la crosse
void vue(vec2 q,out vec3 ro,out vec3 rd){vue0(q,.42*sin(W*uPh),7.,1.3,vec3(-.35,2.05,0.),FOC,ro,rd);}

// ---- le lampadaire : presque rien. un capot (un cône de tôle, creux), et un fil de fer pour la crosse et le mât
float capot(vec3 p){vec3 c=p-LC;float d=max(cone(c+vec3(0.,.04,0.),.11,.3,.045),-cone(c+vec3(0.,.062,0.),.11,.285,.03))-.003;
 return min(d,length(vec2(length(c.xz)-.3,c.y+.15))-.011);}   // avec un ourlet au bord
float fil(vec3 p){float pu=dot(p.xz,DM),pw=dot(p.xz,vec2(-DM.y,DM.x)),y=p.y-LC.y;
 float d=max(length(vec2(length(vec2(pu-.4,max(y-.4,0.)))-.4,pw))-.014,.06-y);
 return min(d,length(vec3(pu-.8,p.y-clamp(p.y,.75,LC.y+.4),pw))-.019);}   // le mât ne descend pas jusqu'au sol : il se perd dans la nuit
float map(vec3 p){float a=capot(p),b=fil(p);gm=a<b?0.:1.;return min(a,b);}
vec3 nrm(vec3 p){vec2 e=vec2(.0015,0.);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
// le rayon ne marche que dans le cylindre qui contient le lampadaire ; prox = à quel point il l'a frôlé (pour adoucir le bord)
float marche(vec3 ro,vec3 rd,out float prox){prox=1e9;
 float a=dot(rd.xz,rd.xz),b=dot(ro.xz,rd.xz),c=dot(ro.xz,ro.xz)-.7;float h=b*b-a*c;if(h<0.)return -1.;
 h=sqrt(h);float t=(-b-h)/a,t1=(-b+h)/a;
 for(int i=0;i<70;i++){vec3 p=ro+rd*t;float d=map(p);prox=min(prox,d/t);if(d<.0012)return t;t+=d*.9;if(t>t1)break;}
 return -1.;}

// ---- la lumière : ce que l'ampoule éclaire à l'endroit p. le capot la coupe : il n'y a de lumière que dans le cône, dessous
float ombre(vec3 e,float r2){float el=e.y*inversesqrt(r2+1e-5);return smoothstep(-.3,-.58,el)*(1.+.5*smoothstep(-.6,-1.,el));}
float lumiere(vec3 p){vec3 e=p-LC;float r2=dot(e,e);return ombre(e,r2)*exp(-.42*r2)/(.12+r2);}
// la brume : la lumière diffusée le long du rayon (échantillons resserrés autour de l'ampoule)
float brume(vec3 ro,vec3 rd,float tm,float jit){
 float t0=dot(LC-ro,rd);vec3 c=ro+rd*t0-LC;float D=sqrt(dot(c,c)+.12);
 float a=atan(-t0/D),b=atan((tm-t0)/D);float s=0.;vec2 dr=.4*vec2(cos(W*uPh),sin(W*uPh));
 for(int i=0;i<8;i++){float th=mix(a,b,(float(i)+jit)/8.);vec3 p=ro+rd*(t0+D*tan(th));vec3 e=p-LC;float r2=dot(e,e);
  s+=ombre(e,r2)*exp(-.6*r2)*(.82+.36*noise(vec2(p.x*1.1+p.z*.6,p.y*1.5)+dr));}
 return s*(b-a)/(8.*D);}

// ---- la pluie : les paroles lues par tranches verticales. chaque colonne suit un jambage, qui devient un trait.
// elle n'existe que dans la lumière. feu = ce qui passe devant l'ampoule (l'accent sodium)
float pluie(vec3 ro,vec3 rd,float tm,float px,out float feu){float v=0.;feu=0.;
 for(int k=0;k<7;k++){float kf=float(k);
  float z=kf<1.5?-1.25+.45*kf:-.75+.4*kf;
  float t=(z-ro.z)/rd.z;vec3 p=ro+rd*t;float vis=step(t,tm);
  float n=38.-2.5*kf;float xx=(p.x+.03*p.y)*n+kf*5.37;float col=floor(xx),fx=xx-col;
  float h=hash(vec2(col,kf*7.1+1.)),h2=hash(vec2(col,kf+3.)),h3=hash(vec2(col,kf+11.));
  float w=max(.0058,1.1*px*t)*n;
  float g=smoothstep(w,w*.3,abs(fx-.3-.4*h2));
  vec2 uv=vec2(h3*7.31+kf*.37,p.y*.032*(.75+.5*h2)+uPh*(1.+floor(h*2.)+step(2.5,kf))+h*5.);
  g*=smoothstep(.35,.75,T(uv))*(.45+.55*h2)*vis;
  float li=lumiere(p);v+=g*li;feu+=g*step(.3,z)*min(li*2.,1.);}
 // un plan de plus, juste derrière la source : près de l'axe, les colonnes voisines lisent des tranches voisines, si bien que dans les gouttes les plus éclairées
 // on devine une lettre, un bout de mot (étiré, haché) ; plus loin elles se décalent et tout redevient pluie
 {float t=(-.28-ro.z)/rd.z;vec3 p=ro+rd*t;float n=34.;float xx=p.x*n;float col=floor(xx),fx=xx-col;float h=hash(vec2(col,3.3)),h2=hash(vec2(col,8.1));
  float br=smoothstep(.12,.7,abs(p.x));float w=mix(.27,max(.0058,1.1*px*t)*n,br);float cx=mix(.5,.3+.4*h2,br);
  float g=smoothstep(w,w*.3,abs(fx-cx))*smoothstep(.35,.75,T(vec2((col+cx)/n*.1+.37,p.y*.06+uPh+(h-.5)*(.004+.5*br))))*step(t,tm);
  v+=g*lumiere(p)*(.6+.4*br);}
 return v;}

// ---- le sol : presque rien. une lueur mouillée, là où la lumière tombe
float sol(vec3 ro,vec3 rd,float t){vec3 g=ro+rd*t;
 vec2 u=normalize(ro.xz);float s=dot(g.xz,u),x=dot(g.xz,vec2(-u.y,u.x));
 float m=.7+.6*fbm(g.xz*.9+3.);
 return (.11*exp(-dot(g.xz,g.xz)/5.)+.13*exp(-x*x/(.3+.12*max(s,0.)))*smoothstep(-.4,1.2,s)*exp(-max(s-1.,0.)/2.5))*m;}

// le tirage, comme pour la grenade (10) : du grain dans les valeurs moyennes, puis des paliers doux sur les teintes de la palette (le socle vignette et regraine ensuite)
float tirage(float v){float g=noise(gl_FragCoord.xy*.6+fract(uTime)*91.)+hash(gl_FragCoord.yx+fract(uTime)*37.)-1.;
 v=max(v+g*.05*smoothstep(.02,.3,v),0.);float x=v*5.;return (floor(x)+smoothstep(.12,.88,fract(x)))*.2;}

void main(){
 vec2 q=(gl_FragCoord.xy-.5*uRes)/(.5*uRes.y);vec3 ro,rd;vue(q,ro,rd);
 float px=2./(uRes.y*FOC);float jit=hash(gl_FragCoord.xy);
 float prox;float th=marche(ro,rd,prox);float ts=rd.y<0.?-ro.y/rd.y:1e9;
 float tm=30.;float v=.016;float fer=0.;
 if(th>0.&&th<ts){tm=th;fer=1.;vec3 p=ro+rd*th;vec3 n=nrm(p);map(p);float nv=max(dot(n,-rd),0.);
  vec3 l=LC-p;float r2=dot(l,l);l*=inversesqrt(r2);float ndl=dot(n,l);
  if(gm<.5){ // le capot : noir dehors, blanc dedans (l'émail renvoie l'ampoule)
   float ded=step(0.,ndl)*smoothstep(-.142,-.128,p.y-LC.y);   // dedans (hors l'ourlet, qui reste noir)
   v=mix(.03+.07*smoothstep(.08,-.16,p.y-LC.y)+.05*pow(1.-nv,2.),.45+.7*ndl,ded);fer=1.-ded;}
  else{ // le fil de fer : à peine plus clair que la nuit, il prend un peu de lumière là où elle le touche, et s'éteint vers le bas
   v=mix(.016,.034+.03*pow(1.-nv,2.),smoothstep(.75,1.9,p.y))+.5*max(ndl,0.)*lumiere(p);}}
 else if(ts<60.){tm=ts;v=.016+sol(ro,rd,ts)*exp(-ts*.02);
  v=mix(.022,v,smoothstep(0.,1.5*px,prox));}
 else v=mix(.022,v,smoothstep(0.,1.5*px,prox));
 v+=.44*brume(ro,rd,tm,jit)*(1.-.7*fer);
 // la lumière regardée en face brûle : elle dépasse 1 et se replie (un anneau clair, le centre plus sombre : le soleil devient un trou)
 if(v>1.)v=1.-.45*(1.-exp(-(v-1.)*1.2));
 // la pluie s'ajoute sans replier ; seules les gouttes tout près de la source vont au blanc, les autres restent dans les gris et tombent vite dans la nuit
 float feu;float pl=1.-exp(-.8*pluie(ro,rd,tm,px,feu));v+=pl*(1.-v);
 gacc=smoothstep(.2,.55,feu)*smoothstep(.3,.12,axe(LC-vec3(0.,.26,0.),ro,rd))*.85;
 gl_FragColor=developpe(tirage(v),q,false);}`,
};
