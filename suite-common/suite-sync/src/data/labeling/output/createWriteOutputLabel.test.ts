import { createMockDeps, mock } from '@suite-common/dependency-injection';
import { type OutputTable, type SuiteSyncOutput } from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor, asTxTargetId } from '@suite-common/wallet-types';
import { ok } from '@trezor/type-utils';

import { type WriteOutputLabelDeps, createWriteOutputLabel } from './createWriteOutputLabel';
import { createSuiteSyncStorageMock } from '../../../../mocks/mockCreateSuiteSyncStorage';

const deviceStaticSessionId = '1@2:3' as const;
const networkSymbol: NetworkSymbol = 'btc';
const accountDescriptor = asAccountDescriptor('accountDescriptor');

describe(createWriteOutputLabel.name, () => {
    it('writes output label to storage, reports analytics and propagates the result', () => {
        const updateResult: ReturnType<OutputTable['update']> = ok();
        const report = mock(() => {});

        const storage = createSuiteSyncStorageMock({
            outputs: { update: mock<OutputTable['update']>(() => updateResult) },
        });

        const deps = createMockDeps<WriteOutputLabelDeps>({
            analytics: { report },
            getOutputLabel: () => null,
        });

        const result = createWriteOutputLabel(deps)({
            storage,
            data: {
                deviceStaticSessionId,
                txId: 'txid',
                txTargetId: asTxTargetId('1'),
                label: 'New Output Label',
                accountDescriptor,
                networkSymbol,
            },
        });

        expect(storage.data.outputs.update).toHaveBeenCalledWith({
            txId: 'txid',
            txTargetId: asTxTargetId('1'),
            label: 'New Output Label',
            accountDescriptor,
            networkSymbol,
        } satisfies Partial<SuiteSyncOutput>);
        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    entity_type: 'output',
                    network: 'btc',
                    action: 'created',
                }),
            }),
        );
        expect(result).toBe(updateResult);
    });
});
