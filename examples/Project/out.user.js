// ==UserScript==
// @name              Project
// @namespace         https://www.example.com/
// @description       bbb
// @description:en    ccc
// @description:zh-TW ddd
// @version           1.0
// @include           *
// @grant             none
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
