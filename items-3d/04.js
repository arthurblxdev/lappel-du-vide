// 04 buisness model — « c'est plus un cerveau, c'est un système solaire » : un soleil de paroles, ses orbites, trois planètes
// scène chargée par item-3d.js — le contrat est dans items-3d/LISEZMOI.md
(window.ITEM3D = window.ITEM3D || {})["04"] = {
  glsl: `
#define PAS .9
#define FAR 10.
#define NST 100
#define FOLD
void vue(vec2 q,out vec3 ro,out vec3 rd){vue0(q,.42*sin(W*uPh),4.5,1.5,vec3(0.,-.04,0.),2.9,ro,rd);}
vec3 pl(float r,float n,float p0){float a=W*(uPh*n+p0);return vec3(cos(a)*r,0.,sin(a)*r);}
float map(vec3 p){p.xy=rot(p.xy,.2);float r=length(p.xz);float d=length(p)-.3;gm=0.;
 float o=min(min(length(vec2(r-.58,p.y)),length(vec2(r-.86,p.y))),length(vec2(r-1.14,p.y)))-.005;if(o<d){d=o;gm=1.;}
 float s=min(min(length(p-pl(.58,2.,.1))-.06,length(p-pl(.86,1.,.45))-.1),length(p-pl(1.14,-1.,.8))-.075);if(s<d){d=s;gm=2.;}
 return d;}
float fond(vec3 ro,vec3 rd){float dl=axe(vec3(0.),ro,rd);return .018+.3*exp(-dl*dl/.1)+.07*exp(-dl*dl/1.1);}
float surf(vec3 ro,vec3 rd,vec3 p,vec3 n){map(p);float m=gm;float nv=max(dot(n,-rd),0.);
 if(m<.5){vec3 pt=p;pt.xy=rot(pt.xy,.2);float tx=T(vec2(atan(pt.x,pt.z)/W*2.+uPh,-pt.y*.9+.5));return .55+.5*tx*nv+.32*nv;}
 if(m<1.5)return .3;
 float df=max(dot(n,normalize(-p)),0.);return .05+.8*df+.12*pow(1.-nv,3.);}`,
};
