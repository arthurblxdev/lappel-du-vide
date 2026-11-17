// 08 sésame interlude — la porte fermée : la lumière passe autour et dessous, elle respire derrière ; la porte ne s'ouvre jamais
// scène chargée par item-3d.js — le contrat est dans items-3d/LISEZMOI.md
(window.ITEM3D = window.ITEM3D || {})["08"] = {
  glsl: `
#define PAS .9
#define FAR 11.
#define NST 100
void vue(vec2 q,out vec3 ro,out vec3 rd){vue0(q,.42*sin(W*uPh),4.5,.12,vec3(0.,-.04,0.),2.8,ro,rd);}
float map(vec3 p){float fr=max(box(p,vec3(.5,.95,.07)),-box(p-vec3(0.,-.06,0.),vec3(.4,.9,.3)));
 float dr=box(p-vec3(0.,-.065,-.01),vec3(.39,.885,.025))-.004;float kn=length(p-vec3(.3,-.1,.05))-.035;float fl=p.y+.95;
 gm=0.;float d=fr;if(dr<d){d=dr;gm=1.;}if(kn<d){d=kn;gm=2.;}if(fl<d){d=fl;gm=3.;}return d;}
float fond(vec3 ro,vec3 rd){float br=.8+.2*sin(W*uPh*2.);vec3 pz=ro+rd*((-.35-ro.z)/rd.z);vec2 e=(pz.xy-vec2(0.,-.06))/vec2(.8,1.25);return .02+.26*exp(-dot(e,e))*br;}
float surf(vec3 ro,vec3 rd,vec3 p,vec3 n){map(p);float m=gm;float nv=max(dot(n,-rd),0.);float br=.8+.2*sin(W*uPh*2.);
 vec2 dd=abs(p.xy-vec2(0.,-.06))-vec2(.397,.893);float e=abs(max(dd.x,dd.y));float seam=exp(-e*42.)*br*step(-.03,p.z);
 if(m>2.5){float sous=exp(-p.x*p.x/.1)*exp(-max(p.z,0.)*2.4)*step(.02,p.z)*.6*br;vec2 k=p.xz+vec2(0.,.75);float der=exp(-dot(k,k)/.7)*.42*br*step(p.z,-.07);
  return .028+sous+der;}
 if(m>1.5)return .16+.3*nv+seam;
 if(m>.5){float tx=T(vec2(p.x,-p.y)*.6+.5);return .06+.06*tx+.05*nv+seam*.95;}
 return .05+.08*nv+seam*.75+.1*pow(1.-nv,3.);}`,
};
