if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,t)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(s[r])return;let o={};const c=e=>i(e,r),l={module:{uri:r},exports:o,require:c};s[r]=Promise.all(n.map((e=>l[e]||c(e)))).then((e=>(t(...e),o)))}}define(["./workbox-fb0596ae"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/index-CFYsU7Oc.css",revision:null},{url:"assets/index-CJyzuFk2.js",revision:null},{url:"assets/NotFound-BnMoBMZZ.js",revision:null},{url:"assets/NotFound-BOC-r4H1.css",revision:null},{url:"index.html",revision:"73bfb116a2e0112138788893a298c7d4"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"favicon.ico",revision:"0ae5c4eb2eee1cb224f3594bfc826ce2"},{url:"robots.txt",revision:"498a27a78933e4a6c909a2327dde59c5"},{url:"manifest.webmanifest",revision:"9fa1153e2be5b61b63cb22f14d09c080"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html"))),e.registerRoute(/^https:\/\/hizhixia\.site\/.*\.(png|jpg|jpeg|svg|gif|webp)/i,new e.CacheFirst({cacheName:"images-cache",plugins:[new e.ExpirationPlugin({maxEntries:100,maxAgeSeconds:2592e3})]}),"GET"),e.registerRoute(/^https:\/\/hizhixia\.site\/page\/archives\//i,new e.NetworkFirst({cacheName:"api-cache",plugins:[new e.ExpirationPlugin({maxEntries:10,maxAgeSeconds:3600})]}),"GET")}));
