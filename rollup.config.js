import babel from 'rollup-plugin-babel';

export default {
	input: 'src/index.js',
	output: [{
		file: 'dist/rollup-plugin-userscript-metablock.common.js',
		format: 'cjs'
	}],
	external: ['fs'],
	plugins: [ babel() ]
};
