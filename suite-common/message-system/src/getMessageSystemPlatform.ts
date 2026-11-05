import { type MessageSystemPlatform } from '@suite-common/message-system-core';
import { getBrowserName, getBrowserVersion } from '@suite-common/suite-utils';
import { getCommitHash, getEnvironment, getOsName, getSuiteVersion } from '@trezor/env-utils';

import { getCachedOsVersion } from './cachedEnvData';

// Browser conditions only apply to the web app, so the user agent is not parsed anywhere else.
const getBrowserFacts = () =>
    getEnvironment() === 'web'
        ? { browserName: getBrowserName(), browserVersion: getBrowserVersion() }
        : { browserName: '', browserVersion: '' };

/**
 * Reads the platform facts from the ambient environment. Usable only where `window` exists, which
 * is why the core takes them as an argument instead.
 */
export const getMessageSystemPlatform = (): MessageSystemPlatform => ({
    suiteEnvironment: getEnvironment(),
    suiteVersion: getSuiteVersion(),
    commitHash: getCommitHash(),
    osName: getOsName(),
    osVersion: getCachedOsVersion(),
    ...getBrowserFacts(),
});
