import { evoluReactNativeDeps } from '@evolu/react-native/expo-sqlite';

import { initLocalFirstStorageThunkFactory } from '@suite-common/local-first-storage';
export { useLocalFirstStorageAlerts } from './hooks/useLocalFirstStorageAlerts';

export const initNativeLocalFirstStorageThunk =
    initLocalFirstStorageThunkFactory(evoluReactNativeDeps);
