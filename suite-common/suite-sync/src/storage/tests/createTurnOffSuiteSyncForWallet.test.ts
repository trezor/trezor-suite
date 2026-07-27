import { type Dispatch } from '@reduxjs/toolkit';

import { createMockDeps, mock } from '@suite-common/dependency-injection';
import { type StaticSessionId } from '@trezor/connect';

import { setSuiteSyncOwner } from '../../suiteSyncSlice';
import { createStorageIdFromDeviceStaticSessionId } from '../createStorageIdFromDeviceStaticSessionId';
import { createSubscriptionStorageMock } from '../createSubscriptionStorage.mock';
import {
    type CreateTurnOffSuiteSyncForWalletDeps,
    createTurnOffSuiteSyncForWallet,
} from '../createTurnOffSuiteSyncForWallet';

const DEVICE_STATIC_SESSION_ID_123: StaticSessionId = '1@2:3';

describe(createTurnOffSuiteSyncForWallet.name, () => {
    it('disposes wallet storage, deletes repository entry, and clears owner from state', async () => {
        const deps = createMockDeps<CreateTurnOffSuiteSyncForWalletDeps>({
            dispatch: mock<Dispatch>(() => {}),
            subscriptionStorage: createSubscriptionStorageMock(),
            suiteSyncStorageRepository: {
                get: null,
                delete: () => Promise.resolve(),
                set: null,
            },
        });

        await createTurnOffSuiteSyncForWallet(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
        });

        const storageId = createStorageIdFromDeviceStaticSessionId(DEVICE_STATIC_SESSION_ID_123);

        expect(deps.subscriptionStorage.dispose).toHaveBeenCalledWith(storageId);
        expect(deps.suiteSyncStorageRepository.delete).toHaveBeenCalledWith(storageId);
        expect(deps.dispatch).toHaveBeenCalledWith(
            setSuiteSyncOwner({
                deviceStaticId: DEVICE_STATIC_SESSION_ID_123,
                owner: null,
            }),
        );
    });
});
