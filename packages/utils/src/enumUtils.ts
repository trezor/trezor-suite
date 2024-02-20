type EnumValue = string | number;
type EnumObject = Record<string, EnumValue>;

/**
 * Find enum value and return corresponding key
 */
export function getKeyByValue<E extends EnumObject>(obj: E, value: E[keyof E]) {
    return obj && (Object.keys(obj) as (keyof E)[]).find(x => obj[x] === value);
}

/**
 * Find enum key and return corresponding value
 */
export function getValueByKey<E extends EnumObject>(obj: E, enumKey: keyof E) {
    const key = obj && (Object.keys(obj) as (keyof E)[]).find(x => x === enumKey);

    return key && obj[key];
}
