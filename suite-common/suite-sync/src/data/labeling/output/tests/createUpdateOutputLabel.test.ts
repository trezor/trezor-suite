import { createMockDeps, mock } from '@suite-common/dependency-injection';
import { type UpdateOutputLabelParams } from '@suite-common/suite-sync-types';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor, asTxTargetId } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { createSuiteSyncStorageMock } from '../../../../../tests/createSuiteSyncStorageMock.mock';
import { SuiteSyncUnavailableOnDeviceError } from '../../../../createEnsureSuiteSyncKeys';
import { type UpdateOutputLabelDeps, createUpdateOutputLabel } from '../createUpdateOutputLabel';

const deviceStaticSessionId: StaticSessionId = '1@2:3';
const networkSymbol: NetworkSymbol = 'btc';
const accountDescriptor = asAccountDescriptor('accountDescriptor');

const params: UpdateOutputLabelParams = {
    deviceStaticSessionId,
    txId: 'txid',
    txTargetId: asTxTargetId('1'),
    label: 'New Output Label',
    accountDescriptor,
    networkSymbol,
};

describe(createUpdateOutputLabel.name, () => {
    it('ensures storage then writes the label with it', async () => {
        const storage = createSuiteSyncStorageMock();
        const writeResult = ok();

        const deps = createMockDeps<UpdateOutputLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok(storage)),
            writeOutputLabel: mock(() => writeResult),
        });

        const result = await createUpdateOutputLabel(deps)(params);

        expect(deps.ensureWalletSuiteSyncOn).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: true,
        });
        expect(deps.writeOutputLabel).toHaveBeenCalledWith({ storage, data: params });
        expect(result).toBe(writeResult);
    });

    it('returns ensureWalletSuiteSyncOn error without writing', async () => {
        const ensureWalletSuiteSyncOnResult = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<UpdateOutputLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ensureWalletSuiteSyncOnResult),
            writeOutputLabel: mock(() => ok()),
        });

        const result = await createUpdateOutputLabel(deps)(params);

        expect(result).toBe(ensureWalletSuiteSyncOnResult);
        expect(deps.writeOutputLabel).not.toHaveBeenCalled();
    });
});
