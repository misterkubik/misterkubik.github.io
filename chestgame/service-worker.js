if(!self.define){let e,i={};const n=(n,r)=>(n=new URL(n+".js",r).href,i[n]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=i,document.head.appendChild(e)}else e=n,importScripts(n),i()})).then((()=>{let e=i[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(r,s)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(i[o])return;let t={};const c=e=>n(e,o),f={module:{uri:o},exports:t,require:c};i[o]=Promise.all(r.map((e=>f[e]||c(e)))).then((e=>(s(...e),t)))}}define(["./workbox-791ba835"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"2ffe94691ef1ec7cde5a.png",revision:null},{url:"5504b5c9462cae75109c.png",revision:null},{url:"index.html",revision:"13a573f0c53db715b32d42735d9faaeb"},{url:"main.css",revision:"3716d3dd9f41aea64b0c90bd42f58e4b"},{url:"main.js",revision:"08811ba8fb18e97e63330dbc49f0bfe5"},{url:"main.js.LICENSE.txt",revision:"c349fb2695a508ffb00dc75b9a74c650"}],{})}));