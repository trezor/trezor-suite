export const removeEmpty = (input: any) => {
    if (Array.isArray(input)) input.map(item => removeEmpty(item));
    Object.keys(input).forEach(key => {
        if (input[key] && typeof input[key] === 'object') removeEmpty(input[key]);
        else if (input[key] === undefined) delete input[key];
    });

    return input;
};
