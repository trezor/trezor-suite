import { evoluReactNativeDeps } from '@evolu/react-native/expo-sqlite';

import { initLocalFirstStorageThunkFactory } from '@suite-common/local-first-storage';

export const initNativeLocalFirstStorageThunk =
    initLocalFirstStorageThunkFactory(evoluReactNativeDeps);
