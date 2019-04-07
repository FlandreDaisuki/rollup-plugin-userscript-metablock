import chalk from 'chalk';

export const jclone = (o) => JSON.parse(JSON.stringify(o));
export const isString = (v) => typeof(v) === 'string';
export const isObject = (v) => typeof(v) === 'object' && v !== null;
export const isMatchPattern = (s) => /^([*]|https?|file|ftp):\/\/([*]|[*][.][^*/]+)\/.*$/u.test(s);
export const isIPv4 = (s) => {
  if (/^\d{1,3}[.]\d{1,3}[.]\d{1,3}[.]\d{1,3}$/.test(s)) {
    return s.split('.').filter(Boolean).map(t => parseInt(t)).every(n => n >= 0 && n <= 255);
  }
  return false;
};
export const print = {
  warn: console.warn.bind(console, chalk.yellow('⚠')),
};
