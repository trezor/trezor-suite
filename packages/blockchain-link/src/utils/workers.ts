export const removeEmpty = obj => {
    Object.keys(obj).forEach(key => {
        if (Array.isArray(obj[key])) obj[key].map(o => removeEmpty(o));
        if (obj[key] && typeof obj[key] === 'object') removeEmpty(obj[key]);
        else if (obj[key] === undefined) delete obj[key];
    });

    return obj;
};
