import{c as r,j as e,Z as t,C as c,S as i,M as l,G as n,W as p,a as d,p as x}from"./index-DrDp8joS.js";import{S as b}from"./supabaseClient-CDCxlHx4.js";import{F as m}from"./flame-DyVEiWRP.js";/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=r("FileCheck2",[["path",{d:"M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4",key:"1pf5j1"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"m3 15 2 2 4-4",key:"1lhrkk"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=r("History",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=r("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=r("UserRound",[["circle",{cx:"12",cy:"8",r:"5",key:"1hypcn"}],["path",{d:"M20 21a8 8 0 0 0-16 0",key:"rfgkzh"}]]),f=[{hash:"#/app",label:"Dashboard",icon:k},{hash:"#/app/quick",label:"Quick score",icon:t},{hash:"#/app/application",label:"Application",icon:c},{hash:"#/app/review",label:"Review",icon:i},{hash:"#/app/interview",label:"Interview",icon:l},{hash:"#/app/chancing",label:"Chancing",icon:n},{hash:"#/app/tools",label:"Tools",icon:p},{hash:"#/app/partner",label:"Partner",icon:d}],v=[{hash:"#/app/drafts",label:"Drafts",icon:u},{hash:"#/app/grill",label:"Grill",icon:m},{hash:"#/app/submit",label:"Submit",icon:y}];function C({route:h,children:o}){return e.jsxs("main",{className:"mx-auto max-w-6xl px-4 pb-24 pt-24 md:px-6",children:[e.jsx("nav",{className:"mb-8 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 shadow-sm",children:[...f,...x()?v:[],...b?[{hash:"#/app/account",label:"Account",icon:g}]:[]].map(a=>{const s=h===a.hash;return e.jsxs("a",{href:a.hash,className:`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${s?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`,children:[e.jsx(a.icon,{className:"h-4 w-4"})," ",a.label]},a.hash)})}),o]})}export{C as AppShell};
