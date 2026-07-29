import{c as h,j as e,Z as t,C as i,S as l,M as c,G as p,W as n,a as d,p as x}from"./index-DcA5QI6X.js";import{F as b}from"./flame-BObxaZEu.js";/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=h("FileCheck2",[["path",{d:"M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4",key:"1pf5j1"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"m3 15 2 2 4-4",key:"1lhrkk"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=h("History",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=h("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]]),g=[{hash:"#/app",label:"Dashboard",icon:u},{hash:"#/app/quick",label:"Quick score",icon:t},{hash:"#/app/application",label:"Application",icon:i},{hash:"#/app/review",label:"Review",icon:l},{hash:"#/app/interview",label:"Interview",icon:c},{hash:"#/app/chancing",label:"Chancing",icon:p},{hash:"#/app/tools",label:"Tools",icon:n},{hash:"#/app/partner",label:"Partner",icon:d}],k=[{hash:"#/app/drafts",label:"Drafts",icon:y},{hash:"#/app/grill",label:"Grill",icon:b},{hash:"#/app/submit",label:"Submit",icon:m}];function w({route:r,children:s}){return e.jsxs("main",{className:"mx-auto max-w-6xl px-4 pb-24 pt-24 md:px-6",children:[e.jsx("nav",{className:"mb-8 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 shadow-sm",children:[...g,...x()?k:[]].map(a=>{const o=r===a.hash;return e.jsxs("a",{href:a.hash,className:`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${o?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`,children:[e.jsx(a.icon,{className:"h-4 w-4"})," ",a.label]},a.hash)})}),s]})}export{w as AppShell};
