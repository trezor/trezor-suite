export const isSafeObjectKey = (key: string) =>
    !['__proto__', 'constructor', 'prototype'].includes(key);
