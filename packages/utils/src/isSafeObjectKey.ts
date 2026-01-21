export const isSafeObjectKey = (key: string) =>
    !['__proto__', 'prototype', 'constructor'].includes(key);
