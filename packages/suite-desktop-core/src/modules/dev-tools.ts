/**
 * Enable DevTools
 */
import { isDevEnv } from '@suite-common/suite-utils';

import { hasSwitch } from '../libs/process-switches';

import type { ModuleInit } from './index';

const openDevToolsFlag = hasSwitch('open-devtools');

export const SERVICE_NAME = 'dev-tools';

export const init: ModuleInit = ({ mainWindowProxy }) => {
    if (isDevEnv || openDevToolsFlag) {
        mainWindowProxy.getInstance()?.webContents.openDevTools();
    }
};
