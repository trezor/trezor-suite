import { ok } from '@trezor/type-utils';

import { type SuiteSyncStorage } from '../src/SuiteSyncStorage';
import { type EntityListener, type SuiteSyncTable } from '../src/SuiteSyncTable';

export const createMockSuiteSyncTable = <T extends object>(): SuiteSyncTable<T> => ({
    update: _ => ok(),
    subscribe: (_: EntityListener<T>) => () => {},
});

type MockSuiteSyncStorageOverrides = {
    disconnectRelay?: SuiteSyncStorage['disconnectRelay'];
    dispose?: SuiteSyncStorage['dispose'];
    updateRelayUrl?: SuiteSyncStorage['updateRelayUrl'];
};

export const mockSuiteSyncStorage = (
    overrides: MockSuiteSyncStorageOverrides = {},
): SuiteSyncStorage => ({
    data: {
        wallets: createMockSuiteSyncTable(),
        accounts: createMockSuiteSyncTable(),
        addresses: createMockSuiteSyncTable(),
        outputs: createMockSuiteSyncTable(),
    },
    disconnectRelay: overrides.disconnectRelay ?? (async () => {}),
    updateRelayUrl: overrides.updateRelayUrl ?? (async (_url: string) => {}),
    dispose: overrides.dispose ?? (async () => {}),
});
