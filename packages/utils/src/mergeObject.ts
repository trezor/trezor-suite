export const mergeObject = (
    target: Record<string, any>,
    source: Record<string, any> | string | boolean | number,
) => {
    Object.keys(source).forEach(key => {
        if (source instanceof Object && source[key] instanceof Object) {
            Object.assign(source[key], mergeObject(target[key], source[key]));
        }
    });
    // Join `target` and modified `source`
    Object.assign(target || {}, source);
    return target;
};
