// ==UserScript==
// @name      Project
// @description       bbb
// @description:en    ccc
// @description:zh-TW ddd
// @namespace https://www.example.com/
// @version   5.4.3
// @include   /^https?//example[.]com/.*$/
// @include   http://*
// @grant     none
// ==/UserScript==

function print(...args) {
  console.log(...args);
}

function padleft(s, n, d = ' ') {
  return s.padStart(n, d);
}

print(padleft('5', 3, '0'));
print(padleft('500', 3, '0'));
print(padleft('50000', 3, '0'));
