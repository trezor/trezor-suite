import type { Project } from './constants';

const {
    PROJECT,
    NODE_ENV,
    ANALYZE,
    LAUNCH_ELECTRON,
    ASSET_PREFIX,
    IS_CODESIGN_BUILD,
    SENTRY_AUTH_TOKEN,
} = process.env;

const project = PROJECT as Project;
const environment = NODE_ENV === 'production' ? 'production' : 'development';
const isDev = environment === 'development';
const isAnalyzing = ANALYZE === 'true';
const isCodesignBuild = IS_CODESIGN_BUILD === 'true';
const launchElectron = LAUNCH_ELECTRON === 'true';
const assetPrefix = ASSET_PREFIX || '';
const sentryAuthToken = SENTRY_AUTH_TOKEN;

export {
    environment,
    isAnalyzing,
    isCodesignBuild,
    isDev,
    launchElectron,
    assetPrefix,
    project,
    sentryAuthToken,
};
