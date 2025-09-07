export const safeBigIntStringify = (v: unknown) =>
    JSON.stringify(v, (_k, val) => (typeof val === 'bigint' ? val.toString() : val));
