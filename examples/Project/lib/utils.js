function print(...args) {
	console.log(...args);
}

function padleft(s, n, d = ' ') {
	return s.padStart(n, d);
}
export {
	print,
	padleft
};
