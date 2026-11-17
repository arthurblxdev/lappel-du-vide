// 01 intro — le soleil levant : un astre en volume sur l'horizon, sa couronne, son halo, sa lumière en stries sur la houle, un ciel de paroles en nuages
// scène chargée par item-3d.js — le contrat est dans items-3d/LISEZMOI.md
(window.ITEM3D = window.ITEM3D || {})["01"] = {
  main: true, // tout est analytique (une sphère, un plan d'eau, un banc de nuages) : pas de marche de rayon, des bords nets, et le repli (FOLD) demandé à la main à la fin
  glsl: `
#define RS .56   // rayon de l'astre
#define HC 1.5   // hauteur du banc de nuages à l'aplomb de l'astre
#define TAU .32  // sa pente : il monte vers nous
const vec3 CS=vec3(0.,.27,0.); // le centre de l'astre : l'eau est à y = 0, un quart du disque est encore dessous
void vue(vec2 q,out vec3 ro,out vec3 rd){vue0(q,.42*sin(W*uPh),4.6,.06,vec3(0.,.5,0.),2.8,ro,rd);}
float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);vec2 e=vec2(0.,1.);
 return mix(mix(mix(hash3(i),hash3(i+e.yxx),f.x),mix(hash3(i+e.xyx),hash3(i+e.yyx),f.x),f.y),mix(mix(hash3(i+e.xxy),hash3(i+e.yxy),f.x),mix(hash3(i+e.xyy),hash3(i+e.yyy),f.x),f.y),f.z);}
float fbm3(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n3(p);p=p*2.07+vec3(3.1,7.7,1.3);a*=.5;}return v;}
vec2 cyc(float n,float ph){float a=W*(uPh*n+ph);return vec2(cos(a),sin(a));} // un tour entier par boucle : tout ce qui dérive revient
float doux(float x){x=max(x,0.);return .98*x/pow(1.+x*x*x*x,.25);} // tout ce qui n'est pas l'astre reste sous 1 : seul l'astre se replie
// l'astre le long d'un rayon : x = la couronne et le halo, y = le corps (au-dessus de 1, il se repliera : le cœur plus sombre que le bord), z = la couverture du disque
vec3 astre(vec3 ro,vec3 rd,bool fin,float net){
 vec3 oc=ro-CS;float b=dot(oc,rd);vec3 pc=oc-b*rd;float d=length(pc);vec3 dir=pc/max(d,1e-4);float av=step(b,0.);
 float dd=max(d-RS,0.)/RS;float j=.5,j2=.5;
 if(fin){vec3 o=vec3(.3*cyc(1.,0.),0.);j=n3(dir*3.+o+4.);j2=clamp(.5+(n3(dir*13.+o.yxz*2.+9.)*.5+n3(dir*31.+o.zyx*4.+2.)*.3+n3(dir*67.+o*6.+5.)*.2-.5)*3.2,0.,1.);}
 float cor=(.8*exp(-dd/(.08+.32*j*j))*(.3+.7*j2)+.14*exp(-dd/(.16+.6*j*j))*j2*j2+.6*exp(-dd/.03)+.13*exp(-dd/.4)+.15*exp(-dd/1.4))*av;
 float couv=smoothstep(RS+net,RS-net,d)*av;
 float mu2=clamp(1.-d*d/(RS*RS),0.,1.);
 float E=.98+.45*(1.-exp(-mu2*3.2));
 if(fin&&couv>0.){
  vec3 p=ro+rd*(-b-sqrt(mu2)*RS);vec3 n=(p-CS)/RS;
  vec3 o=vec3(.25*cyc(1.,.3),0.);
  float g=fbm3(n*8.5+o);float pl=smoothstep(.38,.62,fbm3(n*2.1+o.zxy+5.)); // la matière de l'astre : des plages plus ou moins chaudes, où les paroles affleurent plus ou moins
  // les paroles font le tour de l'astre ; la ligne « je souris maintenant j'vois le soleil en face » passe un peu au-dessus du centre, toujours allumée
  // (.525, .4512 : où tombe cette phrase dans la texture des paroles, composée en Georgia ; avec une autre police ce serait une autre ligne)
  vec2 tu=vec2(atan(n.x,n.z)*RS,-(p.y-CS.y-.1))*.35+vec2(.525,.4512);
  float tx=T(tu);float cle=smoothstep(.0166,.0107,abs(tu.y-.4512));
  float w=smoothstep(.05,.45,mu2);
  E+=(g-.5)*.55*w-tx*(.1+.5*max(pl,cle))*w;
 }
 return vec3(cor,E,couv);}
// le ciel : la nuit, l'aube au ras de l'eau, un banc de nuages (un plan incliné qui monte vers nous) où les paroles sont couchées
float ciel(vec3 ro,vec3 rd){
 float ar=.28*sin(W*uPh);ro.xz=rot(ro.xz,ar);rd.xz=rot(rd.xz,ar); // le banc de nuages suit la caméra aux deux tiers : il tourne trois fois moins que la mer, les lignes restent droites
 vec3 sd=normalize(CS-ro);float a2=2.*(1.-dot(rd,sd));float ry=max(rd.y,0.);
 float aube=exp(-ry/.045)*(.07+.45*exp(-a2/.12))+.05*exp(-ry/.16)*exp(-a2/1.2);
 float t=max(HC+ro.z*TAU-ro.y,.2)/max(rd.y-rd.z*TAU,.02);vec3 P=ro+rd*t;vec2 c=vec2(P.x,P.z*1.05);
 vec2 o=.2*cyc(1.,.1);vec2 k=vec2(.45,1.5);
 vec2 cw=c+.5*vec2(noise(c*.9+o+11.),noise(c*.9-o+23.));float fin=fbm(c*vec2(2.,5.5)+o.yx+1.)-.5;
 float cl=fbm(cw*k+o+3.)+.2*fin;float cl2=fbm((cw-normalize(c+vec2(0.,.001))*.22)*k+o+3.)+.2*fin;
 float pres=smoothstep(.02,.12,a2); // autour de l'astre le ciel reste dégagé : la couronne a de l'air
 float m=smoothstep(.43,.6,cl)*pres;float lis=smoothstep(.43,.5,cl)*(1.-smoothstep(.5,.66,cl))*pres; // le liseré : le bord mince du nuage laisse passer la lumière
 float face=clamp((cl-cl2)*5.+.35,0.,1.); // le côté tourné vers l'astre
 float mots=smoothstep(.36,.56,noise(c*vec2(1.1,2.6)+o*1.5+31.)); // les paroles affleurent par paquets de mots
 // les lignes ondulent avec la vapeur ; au loin, trop petites pour être lues, elles s'effacent ; la couture de la texture (où une ligne se coupe) tombe dans un creux
 vec2 tu=vec2(c.x*.3,-(c.y+(cw.x-c.x)*.25)*.19)+.5;
 float tx=texture2D(uText,tu,mix(-1.5,-.4,smoothstep(4.5,7.,t))).r*smoothstep(.53,.62,cl)*mots*pres*smoothstep(8.5,6.,t)*smoothstep(.0,.07,abs(fract(tu.x+.5)-.5));
 float L=.08+1.4*exp(-a2/.06); // ce que l'astre pose sur le nuage : fort près de lui, presque rien au loin
 return .02+aube*(1.-.8*m)+m*(.042+L*.14*face)+lis*L*(.18+.55*face)+tx*(.13+L*.8);}
// la houle : des trains d'ondes qui avancent vers nous, chacun fait un nombre entier de cycles par boucle. fp = ce que couvre un pixel en profondeur : les ondes plus fines s'effacent
float houle(vec2 p,float fp){float h=0.,f=7.,w=1.;
 for(int i=0;i<12;i++){float fi=float(i);float a=.95*sin(fi*2.4+.6);vec2 d=vec2(sin(a),cos(a));
  float x=dot(d,p)*f-W*uPh*(1.+floor(fi*.6))+fi*1.7;float e=exp(sin(x)-1.);
  h+=e*w*(1.-smoothstep(.12,.45,fp*f/W));p-=d*e*cos(x)*w*.05;f*=1.5;w*=.7;}
 return h;}
float eau(vec3 ro,vec3 rd,float tw){
 vec3 P=ro+rd*tw;float fp=tw*tw/(ro.y*2.8*.5*uRes.y);
 float e=max(.0015,fp*.6);float h0=houle(P.xz,fp);
 vec2 sl=vec2(houle(P.xz+vec2(e,0.),fp)-h0,houle(P.xz+vec2(0.,e),fp)-h0)/e*.01;
 // la grande houle : deux ondes longues, peu pentues, qui font onduler le reflet
 sl+=.045*vec2(.3,1.)*cos(dot(P.xz,vec2(1.1,3.6))-W*uPh+1.)+.035*vec2(-.4,1.)*cos(dot(P.xz,vec2(-2.4,6.1))-W*uPh*2.);
 // les vagues plus fines que le pixel : un tirage par facette, des tirets d'un pixel de haut
 float lv=log2(max(fp,1e-5)/.004);float l0=floor(lv),lf=lv-l0;float c0=.008*exp2(l0);vec3 o=vec3(0.,1.5*cyc(1.,0.));
 float s1=mix(n3(vec3(P.xz/c0,l0*3.7)+o),n3(vec3(P.xz/(2.*c0),l0*3.7+3.7)+o),lf);
 float s2=mix(n3(vec3(P.xz/c0,l0*3.7+50.)+o),n3(vec3(P.xz/(2.*c0),l0*3.7+53.7)+o),lf);
 sl+=(vec2(s2,s1)-.5)*(.12+.78*smoothstep(.0015,.03,fp));
 vec3 n=normalize(vec3(-sl.x,1.,-sl.y));vec3 rr=reflect(rd,n);float vis=smoothstep(-.02,.02,rr.y);rr.y=abs(rr.y)+.003;rr=normalize(rr);
 float fr=.6+.2*pow(1.-max(dot(n,-rd),0.),5.);
 vec3 A=astre(P,rr,false,.002+fp*.25);
 // l'astre lui-même est surexposé (il se replie) ; son reflet, moins fort, reste clair
 float E=.015+vis*mix(doux(ciel(P,rr)+A.x*.7+.1*exp(-rr.y/.04))*fr*.8,.94,A.z);
 // au pied de l'astre l'eau est blanche de lumière : il touche la mer, il ne flotte pas
 float rp=length(P.xz);E=mix(E,.95,.92*exp(-max(rp-.49,0.)/.55)*smoothstep(0.,.7,dot(P.xz,ro.xz)/(rp*length(ro.xz))));
 // au loin l'eau se fond dans la brume de l'aube
 vec3 sd=normalize(CS-ro);float a2=2.*(1.-dot(rd,sd));
 E=mix(E,.05+.3*exp(-a2/.1),smoothstep(3.,40.,tw)*.8);
 return E;}
void main(){
 vec2 q=(gl_FragCoord.xy-.5*uRes)/(.5*uRes.y);vec3 ro,rd;vue(q,ro,rd);
 vec3 A=astre(ro,rd,true,.002);float v;
 if(rd.y>=0.){v=mix(doux(ciel(ro,rd)+A.x),A.y,A.z);} // au-dessus de l'horizon : le ciel et la couronne, l'astre par-dessus
 else{float tw=-ro.y/rd.y;vec3 oc=ro-CS;float b=dot(oc,rd);float d2=dot(oc,oc)-b*b;
  float ys=ro.y+rd.y*(-b-sqrt(max(RS*RS-d2,0.))); // hauteur où le rayon entre dans l'astre : sous l'eau, c'est l'eau qu'on voit
  float dev=clamp((tw+b)/.6+.5,0.,1.); // la couronne ne passe devant l'eau que là où l'eau est derrière l'astre
  // au ras de l'eau le pied de l'astre se noie dans sa propre lumière
  v=mix(min(eau(ro,rd,tw)+A.x*dev*.5,.97),mix(A.y,1.,.8*exp(-max(ys,0.)/.045)),A.z*smoothstep(0.,.004,ys));}
 gl_FragColor=developpe(v,q,true);
}`,
};
