if(!self.define){let e,i={};const s=(s,n)=>(s=new URL(s+".js",n).href,i[s]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=s,e.onload=i,document.head.appendChild(e)}else e=s,importScripts(s),i()})).then((()=>{let e=i[s];if(!e)throw new Error(`Module ${s} didn’t register its module`);return e})));self.define=(n,t)=>{const c=e||("document"in self?document.currentScript.src:"")||location.href;if(i[c])return;let r={};const o=e=>s(e,c),l={module:{uri:c},exports:r,require:o};i[c]=Promise.all(n.map((e=>l[e]||o(e)))).then((e=>(t(...e),r)))}}define(["./workbox-239d0d27"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/index-B1ewVfAh.js",revision:null},{url:"assets/index-DTyKELeX.css",revision:null},{url:"assets/NotFound-BYMqNtWp.js",revision:null},{url:"assets/NotFound-mw9GQ2fM.css",revision:null},{url:"index.html",revision:"76b78f08c3c6f76a26da7ccab13f66a4"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"favicon.ico",revision:"0ae5c4eb2eee1cb224f3594bfc826ce2"},{url:"robots.txt",revision:"31b60c8d8c0e7cf276a68137d22a0c46"},{url:"manifest.webmanifest",revision:"9fa1153e2be5b61b63cb22f14d09c080"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html"))),e.registerRoute(/^https:\/\/hizhixia\.site\/.*\.(png|jpg|jpeg|svg|gif|webp)/i,new e.CacheFirst({cacheName:"images-cache",plugins:[new e.ExpirationPlugin({maxEntries:100,maxAgeSeconds:2592e3})]}),"GET"),e.registerRoute(/^https:\/\/hizhixia\.site\/page\/archives\//i,new e.NetworkFirst({cacheName:"api-cache",plugins:[new e.ExpirationPlugin({maxEntries:10,maxAgeSeconds:3600})]}),"GET")}));
