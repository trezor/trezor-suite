import { EvoluDeps } from '@evolu/common';

import { SuiteStorageCreator } from '@suite-common/suite-sync-storage';

import { EvoluStorage } from './evoluStorage';

// Todo: I have feeling this is not necessary
export const evoluStorageCreator =
    (evoluDeps: EvoluDeps, defaultRelayUrl: string): SuiteStorageCreator =>
    ({ owner, relayUrl }) =>
        new EvoluStorage({
            relayUrl: relayUrl === null || relayUrl.trim() === '' ? defaultRelayUrl : relayUrl,
            evoluDeps,
            owner,
        });
