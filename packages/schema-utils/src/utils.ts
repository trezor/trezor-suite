/**
 * Sets a value in an object by a path
 * From https://stackoverflow.com/a/53762921
 * @param obj object to set value in
 * @param param path to the value
 * @param value value to set
 */
export function setDeepValue(obj: any, [prop, ...path]: string[], value: any) {
    if (!path.length) {
        obj[prop] = value;
    } else {
        if (!(prop in obj)) obj[prop] = {};
        setDeepValue(obj[prop], path, value);
    }
}
