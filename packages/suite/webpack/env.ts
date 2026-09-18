/* eslint-disable import/no-extraneous-dependencies -- build-time tooling belongs in devDependencies */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

/**
 * Webpack loads this through ts-node as CommonJS, Vite loads it as an ES module where `__dirname`
 * does not exist, so the repository root is found by walking up from the working directory.
 */
const findRepoRoot = (from: string) => {
    let directory = from;
    while (directory !== path.dirname(directory)) {
        if (fs.existsSync(path.join(directory, 'yarn.lock'))) {
            return directory;
        }
        directory = path.dirname(directory);
    }

    return from;
};

dotenv.config({ path: path.join(findRepoRoot(process.cwd()), '.env.local'), override: false });

const {
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
    sentryAuthToken,
    isTestBuild,
    isTanstackReactQueryDevTools,
    transportBrowserPing,
};
