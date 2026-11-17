// 05 l'appelduvide — le vide vu d'en haut : un entonnoir de paroles qui tourne autour d'une lumière
// scène chargée par item-3d.js — le contrat est dans items-3d/LISEZMOI.md
(window.ITEM3D = window.ITEM3D || {})["05"] = {
  glsl: `
#define PAS .5
#define FAR 9.
#define NST 150
void vue(vec2 q,out vec3 ro,out vec3 rd){vue0(q,.3*sin(W*uPh),3.3,3.1,vec3(0.,-.3,0.),2.7,ro,rd);}
float hgt(float r){return -.42/(r+.22)+.3;}
float map(vec3 p){float r=length(p.xz);float s=.42/((r+.22)*(r+.22));float d=(abs(p.y-hgt(r))-.008)/sqrt(1.+s*s);return max(max(d,r-1.15),-1.15-p.y);}
float fond(vec3 ro,vec3 rd){float dl=axe(vec3(0.,-1.15,0.),ro,rd);float d2=axe(vec3(0.,-.5,0.),ro,rd);return .02+1.1*exp(-dl*dl/.012)+.1*exp(-d2*d2/.35);}
float surf(vec3 ro,vec3 rd,vec3 p,vec3 n){float r=length(p.xz);float th=atan(p.z,p.x);float tw=th+2.4/(r+.25)+W*uPh;
 float tx=T(vec2(tw/W*3.,-log(r+.05)*1.1));
 float arms=smoothstep(-.55,.05,sin(tw*3.+5.*fbm(vec2(r*5.,cos(tw)*1.5))));
 float li=exp(-r*2.2);float bord=smoothstep(1.15,.8,r);
 return (.04+tx*arms*(.28+.95*li)+li*li*.95)*bord+.02;}`,
};
