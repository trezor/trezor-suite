import { createMockDeps, mock } from '@suite-common/dependency-injection';
import { type OutputTable, type SuiteSyncOutput } from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { createSuiteSyncStorageMock } from '../../../../tests/createSuiteSyncStorageMock.mock';
import { SuiteSyncUnavailableOnDeviceError } from '../../../createRefreshSuiteSyncKeys';
import type { UpdateOutputLabelDeps } from '../createUpdateOutputLabel';
import { createUpdateOutputLabel } from '../createUpdateOutputLabel';

const deviceStaticSessionId: StaticSessionId = '1@2:3';
const networkSymbol: NetworkSymbol = 'btc';
const accountDescriptor = asAccountDescriptor('accountDescriptor');

describe(createUpdateOutputLabel.name, () => {
    it('updates output label', async () => {
        const updateResult: ReturnType<OutputTable['update']> = ok();

        const storage = createSuiteSyncStorageMock({
            outputs: { update: mock<OutputTable['update']>(() => updateResult) },
        });

        const deps = createMockDeps<UpdateOutputLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok(storage)),
        });

        const updateOutputLabel = createUpdateOutputLabel(deps);
        const result = await updateOutputLabel({
            deviceStaticSessionId,
            txId: 'txid',
            txTargetId: '1',
            label: 'New Output Label',
            accountDescriptor,
            networkSymbol,
        });

        expect(deps.ensureWalletSuiteSyncOn).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: true,
        });

        expect(storage.data.outputs.update).toHaveBeenCalledWith({
            txId: 'txid',
            txTargetId: '1',
            label: 'New Output Label',
            accountDescriptor,
            networkSymbol,
        } satisfies Partial<SuiteSyncOutput>);

        expect(result).toBe(updateResult);
    });

    it('returns ensureWalletSuiteSyncOn error', async () => {
        const ensureWalletSuiteSyncOnResult = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<UpdateOutputLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ensureWalletSuiteSyncOnResult),
        });

        const updateOutputLabel = createUpdateOutputLabel(deps);
        const result = await updateOutputLabel({
            deviceStaticSessionId,
            txId: 'txid',
            txTargetId: '1',
            label: 'New Output Label',
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
