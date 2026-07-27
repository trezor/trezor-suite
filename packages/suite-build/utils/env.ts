import dotenv from 'dotenv';
import path from 'path';

import type { Project } from './constants';

const repoRoot = path.resolve(__dirname, '../../..');

dotenv.config({ path: path.join(repoRoot, '.env.local'), override: false });

const {
    PROJECT,
    NODE_ENV,
    ANALYZE,
    LAUNCH_ELECTRON,
    ASSET_PREFIX,
    IS_CODESIGN_BUILD,
    SENTRY_AUTH_TOKEN,
    TEST_BUILD,
    TANSTACK_REACT_QUERY_DEV_TOOLS,
    TRANSPORT_BROWSER_PING,
} = process.env;

const project = PROJECT as Project;
const isDev = NODE_ENV !== 'production';
const isAnalyzing = ANALYZE === 'true';
const isCodesignBuild = IS_CODESIGN_BUILD === 'true';
const launchElectron = LAUNCH_ELECTRON === 'true';
const assetPrefix = ASSET_PREFIX || '';
const sentryAuthToken = SENTRY_AUTH_TOKEN;
const isTestBuild = TEST_BUILD === 'true';
const isTanstackReactQueryDevTools = TANSTACK_REACT_QUERY_DEV_TOOLS === 'true';
const transportBrowserPing = TRANSPORT_BROWSER_PING !== 'false';

export {
    isAnalyzing,
    isCodesignBuild,
    isDev,
    launchElectron,
    assetPrefix,
    project,
    sentryAuthToken,
    isTestBuild,
    isTanstackReactQueryDevTools,
    transportBrowserPing,
};
