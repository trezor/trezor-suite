// process.env.NODE_ENV is set by webpack.mode

export const isDev = () => process.env.NODE_ENV === 'development';

export const normalizeVersion = (version: string) => {
    // remove any zeros that are not preceded by Latin letters, decimal digits, underscores
    return version.replace(/\b0+/g, '');
};
