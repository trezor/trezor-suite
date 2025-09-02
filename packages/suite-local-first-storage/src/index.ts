import { evoluWebDeps } from '@evolu/web';

import { initLocalFirstStorageThunkFactory } from '@suite-common/local-first-storage';

export const initSuiteLocalFirstStorageThunk = initLocalFirstStorageThunkFactory(evoluWebDeps);
