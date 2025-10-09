/**
 * Enable DevTools
 */
import { isDevEnv } from '@suite-common/suite-utils';

import type { ModuleInit } from './module';
import { hasSwitch } from '../libs/process-switches';

const openDevToolsFlag = hasSwitch('open-devtools');

export const SERVICE_NAME = 'dev-tools';

export const init: ModuleInit = ({ mainWindowProxy }) => {
    if (isDevEnv || openDevToolsFlag) {
        mainWindowProxy.getInstance()?.webContents.openDevTools();
    }
};
