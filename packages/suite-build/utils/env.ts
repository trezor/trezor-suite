import type { Project } from './constants';
import { getPublicKey } from './codesign';

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
const isDev = NODE_ENV !== 'production';
const isAnalyzing = ANALYZE === 'true';
const isCodesignBuild = IS_CODESIGN_BUILD === 'true';
const launchElectron = LAUNCH_ELECTRON === 'true';
const assetPrefix = ASSET_PREFIX || '';
const sentryAuthToken = SENTRY_AUTH_TOKEN;
const publicKey = getPublicKey();

export {
    isAnalyzing,
    isCodesignBuild,
    isDev,
    launchElectron,
    assetPrefix,
    project,
    sentryAuthToken,
    publicKey,
};
