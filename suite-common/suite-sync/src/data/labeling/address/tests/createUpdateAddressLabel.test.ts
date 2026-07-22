import { createMockDeps, mock } from '@suite-common/dependency-injection';
import { type UpdateAddressLabelParams } from '@suite-common/suite-sync-types';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { createSuiteSyncStorageMock } from '../../../../../tests/createSuiteSyncStorageMock.mock';
import { SuiteSyncUnavailableOnDeviceError } from '../../../../createEnsureSuiteSyncKeys';
import { type UpdateAddressLabelDeps, createUpdateAddressLabel } from '../createUpdateAddressLabel';

const deviceStaticSessionId: StaticSessionId = '1@2:3';
const networkSymbol: NetworkSymbol = 'btc';
const accountDescriptor = asAccountDescriptor('accountDescriptor');

const params: UpdateAddressLabelParams = {
    deviceStaticSessionId,
    address: 'bc1address',
    label: 'New Address Label',
    accountDescriptor,
    networkSymbol,
};

describe(createUpdateAddressLabel.name, () => {
    it('ensures storage then writes the label with it', async () => {
        const storage = createSuiteSyncStorageMock();
        const writeResult = ok();

        const deps = createMockDeps<UpdateAddressLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok(storage)),
            writeAddressLabel: mock(() => writeResult),
        });

        const result = await createUpdateAddressLabel(deps)(params);

        expect(deps.ensureWalletSuiteSyncOn).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: true,
        });
        expect(deps.writeAddressLabel).toHaveBeenCalledWith({ storage, data: params });
        expect(result).toBe(writeResult);
    });

    it('returns ensureWalletSuiteSyncOn error without writing', async () => {
        const ensureWalletSuiteSyncOnResult = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<UpdateAddressLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ensureWalletSuiteSyncOnResult),
            writeAddressLabel: mock(() => ok()),
        });

        const result = await createUpdateAddressLabel(deps)(params);

        expect(result).toBe(ensureWalletSuiteSyncOnResult);
        expect(deps.writeAddressLabel).not.toHaveBeenCalled();
    });
});
