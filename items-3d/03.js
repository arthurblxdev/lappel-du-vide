// 03 sidehustle — la lampe à lave : le verre, le socle, la lave qui monte et redescend
// scène chargée par item-3d.js — le contrat est dans items-3d/LISEZMOI.md
(() => {
// la lave : [phase de montée, allers-retours par boucle, phase x, phase z, rayon]
const LAVE = [[.02,1,.10,.55,.125],[.37,1,.62,.21,.10],[.71,1,.33,.80,.14],[.18,2,.90,.05,.085],[.55,1,.47,.40,.115],[.86,2,.15,.70,.09],[.44,1,.78,.93,.105]];
const W = Math.PI * 2;
function lave(ph) {
  const out = new Float32Array(32);
  LAVE.forEach(([py, n, px, pz, r], i) => {
    const s = .5 - .5 * Math.cos(W * (ph * n + py)), y = -.42 + .95 * s, rad = r * .84 * (1 + .12 * Math.sin(W * (ph * 2 + px)));
    const verre = .34 - .21 * Math.min(1, Math.max(0, (y + .35) / .97)), amp = Math.max(0, verre - rad - .05);
    out.set([amp * Math.sin(W * (ph + px)), y, amp * Math.cos(W * (ph + pz)), rad], i * 4);
  });
  out.set([0, -.56, 0, .22 + .012 * Math.sin(W * ph * 2)], 28); // la réserve, au fond
  return out;
}
(window.ITEM3D = window.ITEM3D || {})["03"] = {
  uniforms: ph => ({ uB: ['4fv', lave(ph)] }),
  glsl: `
uniform vec4 uB[8];
#define PAS 1.
#define FAR 9.
#define NST 90
void vue(vec2 q,out vec3 ro,out vec3 rd){vue0(q,.42*sin(W*uPh),4.2,.5,vec3(0.,-.14,0.),2.8,ro,rd);}
float verre(vec3 p){return roundCone(p-vec3(0.,-.35,0.),.34,.13,.97);}
float metal(vec3 p){float a=cone(p-vec3(0.,-.825,0.),.225,.42,.29)-.012;float b=cone(p-vec3(0.,-.45,0.),.15,.29,.38)-.012;float c=cone(p-vec3(0.,.83,0.),.17,.15,.085)-.01;return min(min(a,b),c);}
float lave(vec3 p){float d=1e9;for(int i=0;i<8;i++){vec4 b=uB[i];vec3 e=p-b.xyz;e.y*=.72;d=smin(d,length(e)-b.w,.1);}return max(d,verre(p)+.03);}
vec3 nLave(vec3 p){vec2 e=vec2(.003,0.);return normalize(vec3(lave(p+e.xyy)-lave(p-e.xyy),lave(p+e.yxy)-lave(p-e.yxy),lave(p+e.yyx)-lave(p-e.yyx)));}
float map(vec3 p){float a=verre(p),b=metal(p);gm=a<b?0.:1.;return min(a,b);}
float fond(vec3 ro,vec3 rd){float v=.016;
 if(rd.y<0.){float tt=(-1.05-ro.y)/rd.y;vec3 p=ro+rd*tt;float r=length(p.xz);v+=exp(-r*r/.6)*.2*smoothstep(.4,.66,r);}
 float dl=axe(vec3(0.,.05,0.),ro,rd);v+=.07*exp(-dl*dl/.45);return v;}
float surf(vec3 ro,vec3 rd,vec3 p,vec3 n){map(p);float m=gm;vec3 L1=normalize(vec3(-.6,.7,.5));float ndv=max(dot(n,-rd),0.);
 if(m>.5){float sp=pow(max(dot(reflect(rd,n),L1),0.),24.);float g=exp(-abs(p.y+.3)*9.)+.6*exp(-abs(p.y-.66)*12.);
  return .025+.035*max(dot(n,L1),0.)+.28*sp+.1*pow(1.-ndv,3.)+g*.2+.04*exp(-(p.y+1.05)*6.);}
 float fres=pow(1.-ndv,2.5);float sp=pow(max(dot(reflect(rd,n),L1),0.),40.);
 float strie=pow(max(dot(normalize(n.xz),normalize(L1.xz)),0.),60.)*smoothstep(-.3,0.,p.y)*smoothstep(.62,.3,p.y)*.2;
 vec3 rin=refract(rd,n,.78);vec3 pi=p-n*.004;float ti=0.;float dmin=1.;bool hb=false;vec3 pp=pi;
 for(int i=0;i<56;i++){pp=pi+rin*ti;if(ti>.02&&verre(pp)>.002)break;float db=lave(pp);dmin=min(dmin,db);if(db<.002){hb=true;break;}ti+=max(db,.004)*.9;if(ti>1.5)break;}
 float vin;
 if(hb){vec3 nb=nLave(pp);float lit=clamp(.5-.5*nb.y,0.,1.);float h=exp(-(pp.y+.55)*.9);float nv=max(dot(nb,-rin),0.);
  float tx=T(vec2(pp.x,-pp.y)*.5+.5);
  vin=(.26+.42*lit*h+.08*h)*(.5+.5*nv)+tx*(.25+.3*h)*smoothstep(.1,.6,nv);}
 else{vin=.035+.11*exp(-(pp.y+.6)*1.8)+exp(-dmin*14.)*.16+fond(pp,rin)*.5;}
 return vin+fres*.22+sp*.6+strie;}`,
};
})();
