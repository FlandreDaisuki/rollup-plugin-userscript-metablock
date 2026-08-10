import { describe, expect, test } from 'vitest';
import { defineMetadata } from '../src/index.js';

describe('defineMetadata', () => {
  test('returns the same metadata object', () => {
    const metadata = {
      name: 'My userscript',
      grant: 'none',
    };

    expect(defineMetadata(metadata)).toBe(metadata);
  });
});
