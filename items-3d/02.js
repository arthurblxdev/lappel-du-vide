// 02 vieux messages — la feuille de paroles, en volume : limbe mince et courbé, nervures, tige ; un côté s'effrite en mots qui dérivent, puis la feuille se reforme
// scène chargée par item-3d.js — le contrat est dans items-3d/LISEZMOI.md
(() => {
const W = Math.PI * 2, RAD = Math.PI / 180;
// ---- la géométrie, partagée entre le shader (la feuille) et le JS (les éclats qui s'en détachent) ----
const SC = .9;                                // taille de la feuille
const BASE = [.02, -.3, 0];                   // là où le limbe s'attache à la tige (monde)
const TILT = .2, YAW = -.3, PITCH = -.18;     // la feuille penche comme sur la pochette, et se tourne un peu
const TS = .4, ML = 2048 / 48, BW = 3.6;      // paroles : échelle de la texture, lignes par répétition, largeur d'un éclat (en hauteurs de ligne)
const TO = [.5, .5];                          // décalage des paroles dans la texture
const SW = .12;                               // les lobes tournent un peu sur eux-mêmes (pas de symétrie parfaite)
const CUP = .3, CT = .9, TW = .42, PL = .34, HY = .5; // la courbure : creux, pointes qui se recroquevillent, vrille, plis en éventail le long des nervures, centre du creux
const G0 = 0, G1 = .74, JA = .3;              // l'érosion : jusqu'où elle va (la nervure centrale), d'où elle part (à droite), part de hasard
const DE = [.99, .15];                        // sa direction
const E0 = -.17;                              // l'érosion au début de la boucle (négative : la feuille est d'abord entière)
const LT = .62;                               // longueur de la tige
// lobes : [départ x, y, angle en degrés depuis la nervure centrale, longueur, demi-largeur, hauteur du point le plus large, rayon de la nervure]
const LOBES = [
  [0, 0, 0, 1.30, .30, .72, .020],
  [0, .64, 40, .46, .10, .18, .010],
  [0, 0, 52, 1.02, .25, .56, .017],
  [.418, .326, 88, .40, .09, .16, .009],
  [.473, .369, 20, .34, .075, .14, .009],
  [0, 0, 102, .64, .15, .33, .013],
  [.313, -.067, 138, .24, .06, .10, .008],
];
const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const fr = x => x - Math.floor(x), sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const smin = (a, b, k) => { const h = Math.min(1, Math.max(0, .5 + .5 * (b - a) / k)); return b + (a - b) * h - k * h * (1 - h); };
// la silhouette (même calcul que dans le shader), q en unités de feuille
function sil(qx, qy) {
  [qx, qy] = rot(qx, qy, SW * (Math.hypot(qx, qy) - .5)); qx = Math.abs(qx); let ds = 1e9;
  for (const [ox, oy, a, L, lw, y0] of LOBES) {
    const ex = qx - ox, ey = qy - oy, s = Math.sin(a * RAD), c = Math.cos(a * RAD), px = Math.abs(ex * c - ey * s), py = ex * s + ey * c;
    const bx = lw, by = y0, cx = -lw, cy = L - y0, pbx = px - bx, pby = py - by;
    const h1 = Math.min(1, Math.max(0, (px * bx + py * by) / (bx * bx + by * by))), h2 = Math.min(1, Math.max(0, (pbx * cx + pby * cy) / (cx * cx + cy * cy)));
    const d1 = Math.hypot(px - bx * h1, py - by * h1), d2 = Math.hypot(pbx - cx * h2, pby - cy * h2), ins = Math.min(bx * py - by * px, cx * pby - cy * pbx);
    ds = Math.min(ds, (ins > 0 ? -1 : 1) * Math.min(d1, d2));
  }
  return smin(ds, Math.hypot(qx, qy - .30) - .36, .07);
}
// la hauteur du limbe au-dessus de son plan (la feuille est creusée, vrillée, gondolée)
const haut = (u, v) => {
  const y = v - HY, r2 = u * u + y * y, c = Math.max(Math.sqrt(r2) - .35, 0), r = Math.hypot(u, v), th = Math.abs(Math.atan2(u, v) - SW * (r / SC - .5));
  const pl = Math.min(smin(smin(th, Math.abs(th - .908), .15), Math.abs(th - 1.78), .15), .45);
  return CUP * r2 + CT * c * c + TW * u * y + PL * r * pl + .03 * Math.sin(4.2 * u + 2.1 * y + .6) + .025 * Math.sin(5.3 * y - 3.1 * u + 1.2);
};
const H0 = haut(0, 0), HS = -(haut(0, .001) - haut(0, -.001)) / .002;
// l'encombrement du limbe (mesuré) : le shader ne calcule la feuille que là où elle peut être
let HMIN = 9, HMAX = -9, CB = [0, 0, 0], RB = 0; const PTS = [];
for (let u = -1.1; u <= 1.1; u += .02) for (let v = -.5; v <= 1.4; v += .02) if (sil(u / SC, v / SC) < .01) { const h = haut(u, v); PTS.push([u, v, h]); HMIN = Math.min(HMIN, h); HMAX = Math.max(HMAX, h); }
for (let a = 0; a < 3; a++) CB[a] = (Math.min(...PTS.map(p => p[a])) + Math.max(...PTS.map(p => p[a]))) / 2;
for (const p of PTS) RB = Math.max(RB, Math.hypot(p[0] - CB[0], p[1] - CB[1], p[2] - CB[2]) + .03);
// repère de la feuille → monde : Ry(YAW)·Rx(PITCH)·Rz(TILT)
const mul = (A, B) => A.map((r, i) => r.map((_, j) => A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j]));
const Rz = a => [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]], Rx = a => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]], Ry = a => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]];
// elle se balance un peu autour de son attache (cycles entiers : la boucle est exacte)
const repere = ph => mul(Ry(YAW + .1 * Math.cos(W * ph)), mul(Rx(PITCH + .05 * Math.sin(W * (2 * ph + .15))), Rz(TILT + .035 * Math.sin(W * (ph + .3)))));
// les éclats : une brique de texte (une ligne, quelques mots) par éclat. on recense celles que l'érosion atteint
const LH = 1 / (ML * TS), BL = BW * LH;       // hauteur d'une ligne, largeur d'une brique (monde)
const seuil = (j, k) => { // le moment où la brique (ligne j, rang k) se détache — même formule dans le shader
  const o = BW * fr(j * .618), cu = ((k + .5) * BW - o) / ML, cv = (j + .5) / ML, tx = (cu - TO[0]) / TS, ty = (TO[1] - cv) / TS;
  const jit = .5 + .25 * (Math.sin(j * 2.4 + k * 5.1) + Math.sin(j * 7.3 - k * 3.7 + 1));
  return { thr: (G1 - (tx * DE[0] + ty * DE[1])) / (G1 - G0) + JA * (jit - .5), tx, ty };
};
const rnd = (i, n) => fr(Math.sin(i * 12.9898 + n * 78.233) * 43758.5453);
const EU = rot(BL / 2, 0, -TILT), EV = rot(0, LH / 2, -TILT); // demi-axes d'une brique dans le plan de la feuille
const ECLATS = [];
for (let j = -40; j < 60; j++) for (let k = -30; k < 30; k++) {
  const { thr, tx, ty } = seuil(j, k); if (thr >= 1) continue;
  const [u, v] = rot(tx, ty, -TILT); let dedans = false;
  for (let a = -1; a <= 1; a += .5) for (let b = -1; b <= 1; b += 1) if (sil((u + a * EU[0] + b * EV[0]) / SC, (v + a * EU[1] + b * EV[1]) / SC) < 0) dedans = true;
  if (dedans) ECLATS.push({ u, v, thr, r: [0, 1, 2, 3, 4, 5, 6, 7].map(n => rnd(ECLATS.length + 1, n + 1)) });
}
ECLATS.sort((a, b) => a.thr - b.thr); // dans l'ordre où ils partent : le shader ne parcourt que ceux qui sont détachés
const NC = ECLATS.length;
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
const tourne = (v, k, a) => { const c = Math.cos(a), s = Math.sin(a), kv = cross(k, v), kd = k[0] * v[0] + k[1] * v[1] + k[2] * v[2]; return v.map((x, i) => x * c + kv[i] * s + k[i] * kd * (1 - c)); };
const erosion = ph => E0 + (1 - E0) * (.5 - .5 * Math.cos(W * ph));
const A = new Float32Array(NC * 4), U = new Float32Array(NC * 4), V = new Float32Array(NC * 4), B = new Float32Array(4), UB = new Float32Array(3), UL = new Float32Array(9);
ECLATS.forEach((c, i) => { U[i * 4 + 3] = c.u; V[i * 4 + 3] = c.v; }); // le foyer de chaque éclat : sa place dans la feuille
// à chaque image : le repère de la feuille, l'érosion, et la place de chaque éclat détaché
function eclats(ph) {
  const LW = repere(ph), monde = v => [0, 1, 2].map(i => LW[i][0] * v[0] + LW[i][1] * v[1] + LW[i][2] * v[2]), base = [BASE[0], BASE[1] + .025 * Math.sin(W * (2 * ph + .4)), BASE[2]];
  const e = erosion(ph); let nd = 0; B.fill(0);
  ECLATS.forEach((c, i) => {
    const s = e - c.thr; if (s <= 0) return;
    const h = haut(c.u, c.v), hu = (haut(c.u + .001, c.v) - haut(c.u - .001, c.v)) / .002, hv = (haut(c.u, c.v + .001) - haut(c.u, c.v - .001)) / .002;
    let tu = monde([EU[0], EU[1], hu * EU[0] + hv * EU[1]]), tv = monde([EV[0], EV[1], hu * EV[0] + hv * EV[1]]);
    const n = norm(cross(tu, tv)), p0 = monde([c.u, c.v, h]), k = sst(0, .22, s), far = Math.min(s, 1.15);
    // dérive : vers le haut et vers la droite, comme une cendre ; un flottement qui boucle
    const dir = norm([.37 + .5 * (c.r[0] - .5), .88 + .5 * (c.r[1] - .5), .25 + .9 * (c.r[2] - .5)]), dist = .6 * far * (1.7 - .7 * far);
    const fl = [Math.sin(W * (ph * 2 + c.r[3])), Math.sin(W * (ph + c.r[4])), Math.sin(W * (ph * 2 + c.r[5]))];
    const pos = [0, 1, 2].map(a => base[a] + p0[a] + n[a] * .05 * k + dir[a] * dist + fl[a] * .035 * k * (.4 + far));
    // l'éclat tourne lentement sur lui-même, sans jamais montrer son dos
    const ax = norm([Math.cos(W * c.r[6]), Math.sin(W * c.r[6]), .35 * (c.r[7] - .5)]), ang = k * .45 * Math.sin(W * (ph + c.r[5])) + (c.r[4] - .5) * 1.1 * far;
    const face = .8 * sst(0, .5, s), lu = Math.hypot(...tu), lv = Math.hypot(...tv); // en s'éloignant il se présente de face : on lit ses mots
    tu = norm([tu[0] / lu * (1 - face) + face, tu[1] / lu * (1 - face), tu[2] / lu * (1 - face)]); tv = norm([tv[0] / lv * (1 - face), tv[1] / lv * (1 - face) + face, tv[2] / lv * (1 - face)]);
    const dd = tu[0] * tv[0] + tu[1] * tv[1] + tu[2] * tv[2]; tv = norm(tv.map((x, a) => x - dd * tu[a]));
    const sc = 1 - .3 * sst(.6, 1.15, s); tu = tourne(tu, ax, ang).map(x => x * sc * lu); tv = tourne(tv, ax, ang).map(x => x * sc * lv);
    A.set([pos[0], pos[1], pos[2], s], i * 4); U.set(tu, i * 4); V.set(tv, i * 4); nd = i + 1; B[0] += pos[0]; B[1] += pos[1]; B[2] += pos[2];
  });
  // la sphère qui les contient tous : hors d'elle, le shader ne les regarde pas
  if (nd) { B[0] /= nd; B[1] /= nd; B[2] /= nd; for (let i = 0; i < nd; i++) B[3] = Math.max(B[3], Math.hypot(A[i * 4] - B[0], A[i * 4 + 1] - B[1], A[i * 4 + 2] - B[2]) + .15); }
  UB.set(base); UL.set([LW[0][0], LW[1][0], LW[2][0], LW[0][1], LW[1][1], LW[2][1], LW[0][2], LW[1][2], LW[2][2]]);
  return { uBase: ['3fv', UB], uLW: ['3fv', UL], uE: ['1f', e], uN: ['1i', nd], uCb: ['4fv', B], uCa: ['4fv', A], uCu: ['4fv', U], uCv: ['4fv', V] };
}
const f = x => (Math.abs(x) < 1e-6 ? 0 : x).toFixed(5);
const v2 = a => `vec2(${f(a[0])},${f(a[1])})`, v3 = a => `vec3(${f(a[0])},${f(a[1])},${f(a[2])})`;
const lobes = LOBES.map(([ox, oy, a, L, lw, y0, rv]) => `lobe(q,z,${v2([ox, oy])},${v2([Math.sin(a * RAD), Math.cos(a * RAD)])},${f(L)},${f(lw)},${f(y0)},${f(rv)},${v2([1 / (lw * lw + y0 * y0), 1 / (lw * lw + (L - y0) * (L - y0))])},ds,dv);`).join('\n ');
const lobes0 = LOBES.map(([ox, oy, a, L, lw, y0]) => `ds=min(ds,lobe0(q,${v2([ox, oy])},${v2([Math.sin(a * RAD), Math.cos(a * RAD)])},${f(L)},${f(lw)},${f(y0)},${v2([1 / (lw * lw + y0 * y0), 1 / (lw * lw + (L - y0) * (L - y0))])}));`).join('\n ');
(window.ITEM3D = window.ITEM3D || {})["02"] = {
  uniforms: ph => eclats(ph),
  main: true, // son propre main : la normale du limbe se calcule directement (c'est une surface de hauteur), sans six appels à map
  glsl: `
uniform vec3 uBase;uniform vec3 uLW[3];uniform float uE;uniform int uN;uniform vec4 uCb;uniform vec4 uCa[${NC}];uniform vec4 uCu[${NC}];uniform vec4 uCv[${NC}];
#define PAS .85
#define FAR 9.
#define NST 110
const int NC=${NC};
const float SC=${f(SC)},TILT=${f(TILT)},TS=${f(TS)},ML=${f(ML)},BW=${f(BW)},SW=${f(SW)},CUP=${f(CUP)},CT=${f(CT)},TW=${f(TW)},PL=${f(PL)},HY=${f(HY)},G0=${f(G0)},G1=${f(G1)},JA=${f(JA)},LT=${f(LT)},H0=${f(H0)},HS=${f(HS)},HMIN=${f(HMIN)},HMAX=${f(HMAX)},RB=${f(RB)};
const float TH=.011;                 // demi-épaisseur du limbe
const float GY=-1.12;                // le sol
const vec3 CB=${v3(CB)};const vec2 TO=${v2(TO)};const vec2 DE=${v2(DE)};const vec2 EU=${v2(EU)};const vec2 EV=${v2(EV)};
const vec3 LP=vec3(.35,-1.,-.95);    // la lueur, au sol, derrière la feuille
const vec3 LF=vec3(-.47,.56,.68);    // un peu de nuit claire par devant
vec2 gq;                             // le point dans le repère de son lobe (x : écart à la nervure, y : le long)
float gw;                            // sa hauteur au-dessus de la surface moyenne du limbe
vec3 loc(vec3 p){p-=uBase;return vec3(dot(p,uLW[0]),dot(p,uLW[1]),dot(p,uLW[2]));} // monde → repère de la feuille (x : largeur, y : le long de la nervure centrale, z : vers nous)
void vue(vec2 q,out vec3 ro,out vec3 rd){vue0(q,-.08+.28*sin(W*uPh),4.2,.25,vec3(.05,-.03,0.),2.8,ro,rd);}
// la hauteur du limbe au-dessus de son plan : creusé, vrillé, gondolé comme une feuille morte
float haut(vec2 a){float y=a.y-HY;float r2=a.x*a.x+y*y;float c=max(sqrt(r2)-.35,0.);float r=length(a);float th=abs(atan(a.x,a.y)-SW*(r/SC-.5));
 float pl=min(smin(smin(th,abs(th-.908),.15),abs(th-1.78),.15),.45); // écart à la nervure la plus proche : le limbe se plie en éventail
 return CUP*r2+CT*c*c+TW*a.x*y+PL*r*pl+.03*sin(4.2*a.x+2.1*y+.6)+.025*sin(5.3*y-3.1*a.x+1.2);}
// un lobe : un losange effilé le long de sa nervure. o départ, cs direction, L longueur, lw demi-largeur, y0 là où il est le plus large, rv rayon de la nervure, ib inverses précalculés
void lobe(vec2 q,float z,vec2 o,vec2 cs,float L,float lw,float y0,float rv,vec2 ib,inout float ds,inout float dv){
 vec2 e=q-o;vec2 p=vec2(abs(e.x*cs.y-e.y*cs.x),e.x*cs.x+e.y*cs.y);vec2 b=vec2(lw,y0),c=vec2(-lw,L-y0),pb=p-b;
 float d1=length(p-b*clamp(dot(p,b)*ib.x,0.,1.)),d2=length(pb-c*clamp(dot(pb,c)*ib.y,0.,1.));
 float s=min(b.x*p.y-b.y*p.x,c.x*pb.y-c.y*pb.x);float d=(s>0.?-1.:1.)*min(d1,d2);if(d<ds){ds=d;gq=p;}
 float t=clamp(p.y/L,0.,.96);dv=min(dv,length(vec3(p.x,p.y-t*L,z))-rv*(1.-.7*t));}
// le même losange, sans sa nervure (pour le halo et pour découper les éclats)
float lobe0(vec2 q,vec2 o,vec2 cs,float L,float lw,float y0,vec2 ib){
 vec2 e=q-o;vec2 p=vec2(abs(e.x*cs.y-e.y*cs.x),e.x*cs.x+e.y*cs.y);vec2 b=vec2(lw,y0),c=vec2(-lw,L-y0),pb=p-b;
 float d1=length(p-b*clamp(dot(p,b)*ib.x,0.,1.)),d2=length(pb-c*clamp(dot(pb,c)*ib.y,0.,1.));
 return (min(b.x*p.y-b.y*p.x,c.x*pb.y-c.y*pb.x)>0.?-1.:1.)*min(d1,d2);}
float sil0(vec2 q){q=rot(q,SW*(length(q)-.5));q.x=abs(q.x);float ds=1e9;
 ${lobes0}
 return smin(ds,length(q-vec2(0.,.30))-.36,.07);}
// la silhouette dans le plan de la feuille (distance signée, négative dedans) ; dv : distance aux nervures, des tubes posés dans l'épaisseur
float sil(vec2 q,float z,out float dv){q=rot(q,SW*(length(q)-.5));q.x=abs(q.x);float ds=1e9;dv=1e9;
 ${lobes}
 return smin(ds,length(q-vec2(0.,.30))-.36,.07);}
// où tombe un point de la feuille dans les paroles (les lignes restent horizontales, comme sur la pochette)
vec2 tuv(vec2 a){vec2 t=rot(a,TILT);return vec2(t.x,-t.y)*TS+TO;}
// les bords des éclats ne sont pas coupés droit : ils sont déchirés
vec2 dech(vec2 a){return .009*sin(a.yx*vec2(47.,53.)+3.*sin(a*vec2(19.,23.)+a.yx*7.))+.005*sin(a.yx*vec2(113.,127.)+2.*sin(a*31.));}
// la brique de texte (une ligne, quelques mots) d'un point du limbe : x = le moment où elle se détache, y = distance à son bord
vec2 brique(vec2 a){vec2 uv=tuv(a);float j=floor(uv.y*ML);float o=BW*fract(j*.618);float U=(uv.x*ML+o)/BW;float k=floor(U);
 vec2 tc=vec2(((k+.5)*BW-o)/ML-TO.x,TO.y-(j+.5)/ML)/TS;float jit=.5+.25*(sin(j*2.4+k*5.1)+sin(j*7.3-k*3.7+1.));
 float fu=U-k,fv=uv.y*ML-j;
 return vec2((G1-dot(tc,DE))/(G1-G0)+JA*(jit-.5),min(min(fu,1.-fu)*BW,min(fv,1.-fv))/(ML*TS));}
// gm : 0 le limbe, 1 les nervures, 2 la tige, 3 le fil du bord
float map(vec3 p){vec3 l=loc(p);
 // la tige : elle prolonge la nervure centrale, se courbe un peu, s'évase au bout
 float t=clamp(-l.y/LT,0.,1.);float dt=(length(l-vec3(.09*t*t,-t*LT,H0+HS*t*LT+.08*t*t))-(.0155-.004*t+.011*smoothstep(.8,1.,t)))*.9;
 gm=2.;float bs=length(l-CB)-RB;if(bs>.1)return min(dt,bs);
 float zb=max(l.z-HMAX,HMIN-l.z)-TH-.01;if(zb>.1)return min(dt,zb);
 float w=l.z-haut(l.xy);gw=w;float dl=(abs(w)-TH)*.6;if(dl>.035)return min(dt,dl-.01); // loin du limbe : pas besoin de la silhouette
 float dv;float ds=sil(l.xy/SC,w/SC,dv)*SC;dv*=SC*.55;float d=max(dl,ds);float k=.008;
 if(d<.03&&(G1-dot(rot(l.xy,TILT),DE))/(G1-G0)-JA*.5-.18<uE){vec2 b=brique(l.xy+dech(l.xy));if(uE>b.x){d=max(d,max(b.y*.7,.003));k=0.;}} // la brique est partie : un trou, les nervures restent
 float df=(length(vec2(ds,w))-.0028)*.55; // le bord : un fil qui reste quand le limbe est parti
 float dn=min(k>0.?smin(d,dv,k):min(d,dv),df);if(dn<dt){gm=df<min(d,dv)?3.:dv<d?1.:0.;return dn;}return dt;}
// les éclats : des morceaux de limbe très minces, chacun porte ses mots. le plus proche devant tmax recouvre v
float eclats(vec3 ro,vec3 rd,float tmax,float v){vec3 oc=uCb.xyz-ro;float ob=dot(oc,rd);if(dot(oc,oc)-ob*ob>uCb.w*uCb.w)return v;
 float tb=tmax;vec2 hl=vec2(0.);float li=0.,sb=0.,eb=0.;bool hit=false;
 for(int i=0;i<NC;i++){if(i>=uN)break;vec4 a=uCa[i];oc=a.xyz-ro;ob=dot(oc,rd);if(dot(oc,oc)-ob*ob>.02)continue;vec3 U=uCu[i].xyz,V=uCv[i].xyz;vec3 n=cross(U,V);
  float t=dot(a.xyz-ro,n)/dot(rd,n);if(!(t>0.&&t<tb))continue;vec3 h=ro+rd*t-a.xyz;float x=dot(h,U)/dot(U,U),y=dot(h,V)/dot(V,V);if(abs(x)>1.2||abs(y)>1.6)continue;
  vec2 q=vec2(uCu[i].w,uCv[i].w)+x*EU+y*EV;vec2 dq=dech(q);float xx=abs(x+dot(dq,EU)/dot(EU,EU)),yy=abs(y+dot(dq,EV)/dot(EV,EV));if(xx>1.||yy>1.)continue;
  float ds=sil0(q/SC)*SC;if(ds>0.)continue;
  tb=t;hl=q;hit=true;sb=a.w;eb=min(min((1.-xx)*length(EU),(1.-yy)*length(EV)),-ds);vec3 Lv=LP-a.xyz-h;li=abs(dot(normalize(n),normalize(Lv)))*2.3/(1.+.5*dot(Lv,Lv));}
 if(!hit)return v;
 float tx=T(tuv(hl))*smoothstep(0.,.008,eb);float f=1.-.5*smoothstep(.7,1.15,sb);float mo=fbm(hl*6.+3.);
 return ((.05+.42*pow(li,1.3))*(.65+.7*mo)+tx*(.22+.8*li))*f;}
// des cendres montent de la lueur : deux plans de poussières, chacune fait un nombre entier de montées par boucle
float cendres(vec3 ro,vec3 rd,float tmax){float s=0.;vec3 oc=LP-ro;float ob=dot(oc,rd);if(dot(oc,oc)-ob*ob>4.4)return 0.;
 for(int k=0;k<2;k++){float fk=float(k);float t=(-.6+1.1*fk-ro.z)/rd.z;if(t<0.||t>tmax)continue;vec3 p=ro+rd*t;float id=floor(p.x/.2);
  for(int j=0;j<2;j++){float h=hash(vec2(id+fk*37.,float(j)*5.+1.)),h2=fract(h*17.3),h3=fract(h*91.7);float a=fract(h+uPh*(1.+floor(h2*2.)));
   vec2 o=vec2((id+.25+.5*h3)*.2,GY+.05+a*2.3);vec3 lv=LP-vec3(o,p.z);
   s+=smoothstep(1.,.3,length(p.xy-o)/(.005+.007*h2))*4.*a*(1.-a)*(.3+.7*h3)*1.5/(1.+1.6*dot(lv,lv))*smoothstep(4.,2.6,dot(lv,lv));}}
 return s;}
// là où le rayon ne touche rien : la nuit, le sol éclairé par la lueur (une nappe, comme des braises), son halo, les éclats et les cendres devant
float fond(vec3 ro,vec3 rd){float v=.018;float tt=1e9;
 if(rd.y<0.){tt=(GY-ro.y)/rd.y;vec3 g=ro+rd*tt;vec2 e=g.xz-LP.xz;float r2=dot(e,e);
  v+=.05*exp(-r2/4.);if(r2<3.)v+=.26*exp(-r2/.6)*(.75+.5*fbm(g.xz*4.+2.));}
 float tc=clamp(dot(LP-ro,rd),0.,tt);float dl=length(ro+rd*tc-LP);
 v+=.07*exp(-dl*dl/1.4)+.1*exp(-dl*dl/.12);
 // halation : la feuille éclaire un peu l'air autour d'elle (là où elle est encore entière)
 vec3 lo=loc(ro),ld=vec3(dot(rd,uLW[0]),dot(rd,uLW[1]),dot(rd,uLW[2]));vec2 q=(lo+ld*((.12-lo.z)/ld.z)).xy;
 if(dot(q-CB.xy,q-CB.xy)<2.2){q=(lo+ld*((clamp(haut(q),HMIN,HMAX)-lo.z)/ld.z)).xy;float ds=1.;if(dot(q-CB.xy,q-CB.xy)<1.4)ds=sil0(q/SC)*SC;
  float er=smoothstep(-.1,.15,uE-(G1-dot(rot(q,TILT),DE))/(G1-G0));vec3 lv=LP-ro-rd*dot(uBase-ro,rd);
  v+=.03*exp(-max(ds,0.)*16.)*(1.-.85*er)*2.3/(1.+.5*dot(lv,lv));}
 return eclats(ro,rd,1e9,v)+cendres(ro,rd,tt);}
// la feuille est éclairée à contre-jour, par en dessous : le limbe laisse passer la lueur (tr), les lettres plus encore ; nervures, tige et fil restent sombres
float surf(vec3 ro,vec3 rd,vec3 p,vec3 n,float m){vec3 l=loc(p);
 vec3 Lv=LP-p;float at=2.3/(1.+.5*dot(Lv,Lv));vec3 Ld=normalize(Lv);float nl=dot(n,Ld);float ndv=max(dot(n,-rd),0.); // at : la lueur vient du bas, elle faiblit en montant
 float dir=at*pow(clamp(nl*.7+.3,0.,1.),1.5);float fil=max(dot(n,LF),0.);float fr=pow(1.-ndv,3.);
 float sp=pow(max(dot(reflect(rd,n),LF),0.),14.);float tx=T(tuv(l.xy));float v;
 if(m>2.5){v=.05+.24*at;}
 else if(m>1.5){v=.035+.06*fil+.1*sp+.6*dir+.1*fr;}
 else if(m>.5){v=.04+at*(.14+.1*fil)+.1*sp+.2*dir;}
 else{float tr=at*clamp(-nl*1.2+.05,0.,1.);float fs=pow(max(dot(rd,Ld),0.),3.);
  float dv;float ds=sil(l.xy/SC,0.,dv)*SC;float mo=fbm(l.xy*6.+3.);float bord=smoothstep(0.,-.06,ds);float n1=smoothstep(.004,-.003,dv*SC); // les nervures : plus épaisses, elles laissent moins passer
  float ch=abs(fract((gq.y-gq.x*1.1)/.085)-.5)*.057;float n2=smoothstep(.007,.002,ch)*smoothstep(.0,.03,gq.x); // nervures secondaires, en chevrons
  tx*=smoothstep(0.,-.008,ds);
  v=((.05+.38*pow(min(tr,1.),1.3)+.1*fs)*(.65+.7*mo)*(.55+.45*bord)*(1.-.4*n2)+tx*(.22+.8*tr)*(.85+.3*mo)*(1.-.25*n2))*(1.-.7*n1)+.05*fil+.16*sp+.5*dir+.1*fr;}
 return eclats(ro,rd,length(p-ro),v)+cendres(ro,rd,length(p-ro));}
vec3 normale(vec3 p){vec2 e=vec2(1.,-1.)*.0015;return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx));}
void main(){
 vec2 q=(gl_FragCoord.xy-.5*uRes)/(.5*uRes.y);vec3 ro,rd;vue(q,ro,rd);
 float t=0.;bool hit=false;vec3 p=ro;
 for(int i=0;i<NST;i++){p=ro+rd*t;float d=map(p);if(d<.0015){hit=true;break;}t+=d*PAS;if(t>FAR)break;}
 float v;
 if(hit){float m=gm,w=gw;vec3 n;
  // sur une face du limbe, la normale vient de la pente de la surface ; ailleurs (tranches, nervures, fil, tige) on la mesure
  if(m<.5&&abs(w)>TH-.003){vec3 l=loc(p);vec2 g=(vec2(haut(l.xy+vec2(.002,0.)),haut(l.xy+vec2(0.,.002)))-(l.z-w))/.002;vec3 nl=normalize(vec3(-g,1.))*sign(w);n=uLW[0]*nl.x+uLW[1]*nl.y+uLW[2]*nl.z;}
  else n=normale(p);
  v=surf(ro,rd,p,n,m);}
 else v=fond(ro,rd);
 gl_FragColor=developpe(v,q,false);}`,
};
})();
