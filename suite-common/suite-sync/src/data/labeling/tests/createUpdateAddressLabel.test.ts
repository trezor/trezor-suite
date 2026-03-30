import { createMockDeps, mock } from '@suite-common/dependency-injection';
import type { AddressTable } from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { createSuiteSyncStorageMock } from '../../../../tests/createSuiteSyncStorageMock.mock';
import { SuiteSyncUnavailableOnDeviceError } from '../../../createRefreshSuiteSyncKeys';
import type { UpdateAddressLabelDeps } from '../createUpdateAddressLabel';
import { createUpdateAddressLabel } from '../createUpdateAddressLabel';

const deviceStaticSessionId: StaticSessionId = '1@2:3';
const networkSymbol: NetworkSymbol = 'btc';
const accountDescriptor = asAccountDescriptor('accountDescriptor');
const getAddressLabel = () => null;

describe(createUpdateAddressLabel.name, () => {
    it('updates address label', async () => {
        const updateResult: ReturnType<AddressTable['update']> = ok();

        const storage = createSuiteSyncStorageMock({
            addresses: { update: mock<AddressTable['update']>(() => updateResult) },
        });

        const deps = createMockDeps<UpdateAddressLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok(storage)),
            getAddressLabel,
        });

        const updateAddressLabel = createUpdateAddressLabel(deps);
        const result = await updateAddressLabel({
            deviceStaticSessionId,
            address: 'bc1address',
            label: 'New Address Label',
            accountDescriptor,
            networkSymbol,
        });

        expect(deps.ensureWalletSuiteSyncOn).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: true,
        });

        expect(storage.data.addresses.update).toHaveBeenCalledWith({
            address: 'bc1address',
            label: 'New Address Label',
            accountDescriptor,
            networkSymbol,
        });

        expect(result).toBe(updateResult);
    });

    it('returns ensureWalletSuiteSyncOn error', async () => {
        const ensureWalletSuiteSyncOnResult = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<UpdateAddressLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ensureWalletSuiteSyncOnResult),
            getAddressLabel,
        });

        const updateAddressLabel = createUpdateAddressLabel(deps);
        const result = await updateAddressLabel({
            deviceStaticSessionId,
            address: 'bc1address',
            label: 'New Address Label',
            accountDescriptor,
            networkSymbol,
        });

        expect(deps.ensureWalletSuiteSyncOn).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: true,
        });
        expect(result).toBe(ensureWalletSuiteSyncOnResult);
    });
});
