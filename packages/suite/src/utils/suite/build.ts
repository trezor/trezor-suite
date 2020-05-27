// process.env.BUILD is set by package.json
// process.env.NODE_ENV is set by webpack.mode

export const isDev = (): boolean =>
    process.env.BUILD === 'development' || process.env.NODE_ENV === 'development';

export const isBeta = (): boolean => process.env.BUILD === 'beta';

export const normalizeVersion = (version: string) => {
    // remove any zeros that are not preceded by Latin letters, decimal digits, underscores
    return version.replace(/\b0+/g, '');
};
