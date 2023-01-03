export const isDevEnv = process.env.NODE_ENV !== 'production';

export const isCodesignBuild = process.env.IS_CODESIGN_BUILD === 'true';
