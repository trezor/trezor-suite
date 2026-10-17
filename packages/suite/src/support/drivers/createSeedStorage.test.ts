import { deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { createMockDeps } from '@trezor/dependency-injection';

import * as STORAGE from 'src/actions/suite/constants/storageConstants';
import { createEmptyStoragePayload } from 'src/storage/createEmptyStoragePayload';

import { type SeedStorageDeps, createSeedStorage } from './createSeedStorage';

describe(createSeedStorage.name, () => {
    const device = mockSuiteDevice();
    const account = mockWalletAccount({ symbol: asNetworkSymbol('btc') });

    const createDeps = () =>
        createMockDeps<SeedStorageDeps>({
            dispatch: () => undefined,
            getState: () => ({
                wallet: { accounts: [account] },
                device: { ...deviceInitialState, devices: [device], selectedDevice: device },
            }),
            selectDevice: () => Promise.resolve(undefined),
        });

    it('dispatches one @storage/load with the given slices over the empty defaults', async () => {
        const deps = createDeps();
        const storage = { accounts: [account], devices: [device] };

        const result = await createSeedStorage(deps)({ storage });

        expect(deps.dispatch).toHaveBeenCalledTimes(1);
        expect(deps.dispatch).toHaveBeenCalledWith({
            type: STORAGE.LOAD,
            payload: { ...createEmptyStoragePayload(), ...storage },
        });
        expect(deps.selectDevice).not.toHaveBeenCalled();
        expect(result).toEqual({
            accounts: 1,
            devices: 1,
            selectedDevice: true,
            filledKeys: Object.keys(createEmptyStoragePayload()).filter(
                key => !Object.hasOwn(storage, key),
            ),
            unknownKeys: [],
        });
    });

    it('reports keys no store reads and selects the device it was given', async () => {
        const deps = createDeps();

        const result = await createSeedStorage(deps)({
            storage: { accounts: [], devicess: [device] },
            selectedDevice: device,
        });

        expect(result.unknownKeys).toEqual(['devicess']);
        expect(result.filledKeys).toContain('devices');
        expect(deps.selectDevice).toHaveBeenCalledWith(device);
    });
});
