import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { rollup } from 'rollup';
import metablock from '../../src/index.js';

const fixturePath = (...segments) => path.resolve(import.meta.dirname, ...segments);

const generateCode = async (pluginOptions) => {
  const bundle = await rollup({
    input: fixturePath('main.js'),
    plugins: [metablock(pluginOptions)],
  });

  try {
    const { output } = await bundle.generate({ format: 'esm' });
    const chunks = output.filter(({ type }) => type === 'chunk');

    if (chunks.length !== 1) {
      throw new Error(`Expected one generated chunk, received ${chunks.length}.`);
    }

    return chunks[0].code;
  }
  finally {
    await bundle.close();
  }
};

describe('bundle generation', () => {
  test.each([
    {
      name: 'prepends metadata loaded from JSON',
      fixture: 'simplest',
      metadataFile: 'metablock.json',
    },
    {
      name: 'prepends metadata loaded from YAML',
      fixture: 'yaml',
      metadataFile: 'metablock.yaml',
    },
    {
      name: 'applies metadata overrides',
      fixture: 'override',
      metadataFile: 'metablock.yaml',
      options: {
        override: {
          name: '我的第一個腳本',
        },
      },
    },
    {
      name: 'loads metadata from CommonJS',
      fixture: 'metablock.cjs',
      metadataFile: 'metablock.cjs',
    },
    {
      name: 'loads metadata from an ES module',
      fixture: 'metablock.mjs',
      metadataFile: 'metablock.mjs',
    },
    {
      name: 'appends the default order when no placeholder is provided',
      fixture: 'order1',
      metadataFile: 'metablock.yaml',
      options: {
        order: ['grant'],
      },
    },
    {
      name: 'uses only the first order placeholder',
      fixture: 'order2',
      metadataFile: 'metablock.yaml',
      options: {
        order: ['version', '...', 'grant', '...'],
      },
    },
    {
      name: 'uses the default metadata order',
      fixture: 'order3',
      metadataFile: 'metablock.yaml',
      options: {
        order: ['...'],
      },
    },
  ])('$name', async ({ fixture, metadataFile, options = {} }) => {
    const testCaseDir = fixturePath(fixture);
    const expectedCode = await readFile(path.resolve(testCaseDir, 'answer.txt'), 'utf8');
    const code = await generateCode({
      file: path.resolve(testCaseDir, metadataFile),
      ...options,
    });

    expect(code).toBe(expectedCode);
  });
});
