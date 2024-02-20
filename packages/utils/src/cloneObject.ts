// Makes a deep copy of an object.
export const cloneObject = <T>(obj: T): T => {
    const jsonString = JSON.stringify(obj);
    if (jsonString === undefined) {
        // jsonString === undefined IF and only IF obj === undefined
        // therefore no need to clone
        return obj;
    }

    return JSON.parse(jsonString);
};
