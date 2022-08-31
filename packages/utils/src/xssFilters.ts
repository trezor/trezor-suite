const LT = /</g;
const SQUOT = /'/g;
const QUOT = /"/g;

export const inHTML = (value: string) => value.replace(LT, '&lt;');

export const inSingleQuotes = (value: string) => value.replace(SQUOT, '&#39;');

export const inDoubleQuotes = (value: string) => value.replace(QUOT, '&quot;');
