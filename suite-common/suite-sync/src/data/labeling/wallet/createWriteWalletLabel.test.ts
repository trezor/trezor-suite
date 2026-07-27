import { createMockDeps, mock } from '@suite-common/dependency-injection';
import type { WalletTable } from '@suite-common/suite-sync-storage';
import { type StaticSessionId } from '@trezor/connect';
import { asWalletDescriptor } from '@trezor/device-utils';
import { ok } from '@trezor/type-utils';

import { type WriteWalletLabelDeps, createWriteWalletLabel } from './createWriteWalletLabel';
import { createSuiteSyncStorageMock } from '../../../../mocks/mockCreateSuiteSyncStorage';

const deviceStaticSessionId: StaticSessionId = '1@2:3' as const;

describe(createWriteWalletLabel.name, () => {
    it('writes wallet label to storage, reports analytics and propagates the result', () => {
        const updateResult: ReturnType<WalletTable['update']> = ok();
        const report = mock(() => {});

        const storage = createSuiteSyncStorageMock({
            wallets: { update: mock<WalletTable['update']>(() => updateResult) },
        });

        const deps = createMockDeps<WriteWalletLabelDeps>({
            analytics: { report },
            getWalletLabel: () => null,
        });

        const result = createWriteWalletLabel(deps)({
            storage,
            data: { deviceStaticSessionId, label: 'New Label' },
        });

        expect(storage.data.wallets.update).toHaveBeenCalledWith({
            walletDescriptor: asWalletDescriptor('1'),
            label: 'New Label',
        });
        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ entity_type: 'wallet', action: 'created' }),
            }),
        );
        expect(result).toBe(updateResult);
    });

    it('does not report analytics when clearing a label', () => {
        const report = mock(() => {});

        const storage = createSuiteSyncStorageMock({
            wallets: { update: mock<WalletTable['update']>(() => ok()) },
        });

        const deps = createMockDeps<WriteWalletLabelDeps>({
            analytics: { report },
            getWalletLabel: () => 'Previous',
        });

        createWriteWalletLabel(deps)({
            storage,
            data: { deviceStaticSessionId, label: null },
        });

        expect(report).not.toHaveBeenCalled();
    });
});
