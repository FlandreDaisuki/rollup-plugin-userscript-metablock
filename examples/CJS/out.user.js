// ==UserScript==
// @name      Hello, world
// @namespace https://www.example.com/
// @version   1.0.0
// @include   *://*.example.*
// @match     *://*/*
// @match     https://*.abc.com/*
// @resource  xml https://abc.com/example.xml
// @resource  main.css https://abc.com/main.css
// @noframes
// @run-at    document-start
// @grant     GM_setValue
// @grant     GM_getValue
// ==/UserScript==

console.log('Hello, world');
