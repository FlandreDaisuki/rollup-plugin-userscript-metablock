import metablock from '../../src/index.js';

export default {
	input: 'main.js',
	output: {
		file: 'out.user.js',
		format: 'es'
	},
	plugins: [metablock({file: 'metablock.json'})]
};
