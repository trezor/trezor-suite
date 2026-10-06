import { asGetter } from '@suite-common/dependency-injection';

import { type GetDebugSettingsDep } from '../src/connectInitTypes';

export const mockGetDebugSettings = (): GetDebugSettingsDep['getDebugSettings'] =>
    asGetter(() => ({
        transports: [],
        showConnectLogs: false,
    }));
