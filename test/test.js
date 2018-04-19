import metablock from '../';
import {rollup} from 'rollup';
import assert from 'assert';
import {readFileSync} from 'fs';
import path from 'path';

process.chdir(__dirname);

const generateCode = (bundle) => bundle.generate({format: 'es'})
	.then(result => result.code);

describe('rollup-plugin-userscript-metablock', () => {

	describe('minimal', () => {
		const codePromise = rollup({
			input: 'main.js',
			plugins:[metablock()],
		}).then(generateCode);

		it('@name required', () => codePromise
			.then(nameRequired));
		it('@grant explictly', () => codePromise
			.then(grantExplictly));
		it('@grant none', () => codePromise
			.then(grantNone));
	});

	it('metablock file not exists', () => {
		assert.throws(() => {
			rollup({
				input: 'main.js',
				plugins:[metablock({file: '$NON_EXISTENT$.json'})],
			});
		}, /Metablock file not found/);
	})

	describe('blank.txt (invalid json)', () => {
		it('JSON.parse throw SyntaxError', () => {
			assert.throws(() => {
				JSON.parse(readFileSync('blank.txt', 'utf8'));
			}, /SyntaxError/g);
		});
	});

	describe('empty.json', () => {
		const codePromise = rollup({
			input: 'main.js',
			plugins:[metablock({file: 'empty.json'})],
		}).then(generateCode);

		it('@name required', () => codePromise
			.then(nameRequired));
		it('@grant explictly', () => codePromise
			.then(grantExplictly));
		it('@grant none', () => codePromise
			.then(grantNone));
	});

	describe('invalid name type (name1.json)', () => {
		const codePromise = rollup({
			input: 'main.js',
			plugins:[metablock({file: 'name1.json'})],
		}).then(generateCode);

		it('@name required', () => codePromise
			.then(nameRequired));
		it('@grant explictly', () => codePromise
			.then(grantExplictly));
		it('@grant none', () => codePromise
			.then(grantNone));
	});

	describe('key-value name without default (name2.json)', () => {
		it('key-value name without default throw Error', () => {
			assert.throws(() => {
				rollup({
					input: 'main.js',
					plugins:[metablock({file: 'name2.json'})],
				});
			}, Error);
		});
	});

	describe('basic (basic.json)', () => {
		const codePromise = rollup({
			input: 'main.js',
			plugins:[metablock({file: 'basic.json'})],
		}).then(generateCode);

		codePromise.then(console.log);

		it('@name required', () => codePromise
			.then(nameRequired));
		it('@grant explictly', () => codePromise
			.then(grantExplictly));
	});

	describe('basic (basic.js)', () => {
		const codePromise = rollup({
			input: 'main.js',
			plugins:[metablock({file: path.join(__dirname, 'basic.js')})],
		}).then(generateCode);

		it('@name required', () => codePromise
			.then(nameRequired));
		it('@grant explictly', () => codePromise
			.then(grantExplictly));
	});

	function grantExplictly(code) {
		assert.equal(true, (/@grant/g).test(code));
	}

	function grantNone(code) {
		assert.equal(true, (/@grant\s+none/g).test(code));
	}

	function nameRequired(code) {
		assert.equal(true, (/@name\s+.+/g).test(code));
	}
});
