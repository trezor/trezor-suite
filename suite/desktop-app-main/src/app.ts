import { app as electronApp } from 'electron';
import path from 'path';

import { isDevEnv } from '@suite-common/suite-utils';

import { createDesktopMainCompositionRoot } from './createDesktopMainCompositionRoot';
import { hasSwitch } from './libs/process-switches';
import { clearUserDataOptimistically, initUserData } from './libs/user-data';

process.traceProcessWarnings = true;

// Without PLAYWRIGHT_RUN env variable, the version is set to 0.0 during e2e tests, and auto-updater fails to load
// @ts-expect-error using internal electron API to set suite version in dev mode correctly
if (isDevEnv || process.env.PLAYWRIGHT_RUN) electronApp.setVersion(process.env.VERSION);

global.resourcesPath = isDevEnv
    ? path.join(__dirname, '..', 'build', 'static')
    : process.resourcesPath;

const parseRemoveUserDataSwitch = () => {
    if (hasSwitch('remove-user-data-on-start')) {
        clearUserDataOptimistically();
    }
};
parseRemoveUserDataSwitch();

initUserData(); // has to be before initSentry and logger

const { app } = createDesktopMainCompositionRoot();

app();
