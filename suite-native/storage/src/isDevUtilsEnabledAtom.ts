import { isDevelopOrDebugEnv } from '@suite-native/config';

import { atomWithUnecryptedStorage } from './atomWithUnecryptedStorage';

// The key predates this file and is kept so already persisted values stay valid.
export const isDevUtilsEnabledAtom = atomWithUnecryptedStorage<boolean>(
    'isDevUtilsScreenVisible',
    isDevelopOrDebugEnv(),
);
