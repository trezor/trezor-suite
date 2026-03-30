import { createMockDeps, mock } from '@suite-common/dependency-injection';
import type { WalletTable } from '@suite-common/suite-sync-storage';
import { asWalletDescriptor } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { createSuiteSyncStorageMock } from '../../../../tests/createSuiteSyncStorageMock.mock';
import { SuiteSyncUnavailableOnDeviceError } from '../../../createRefreshSuiteSyncKeys';
import { type UpdateWalletLabelDeps, createUpdateWalletLabel } from '../createUpdateWalletLabel';

const deviceStaticSessionId: StaticSessionId = '1@2:3';

describe(createUpdateWalletLabel.name, () => {
    it('updates wallet label', async () => {
        const updateResult: ReturnType<WalletTable['update']> = ok();

        const storage = createSuiteSyncStorageMock({
            wallets: { update: mock<WalletTable['update']>(() => updateResult) },
        });

        const deps = createMockDeps<UpdateWalletLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok(storage)),
            getWalletLabel: () => null,
        });

        const updateWalletLabel = createUpdateWalletLabel(deps);
        const result = await updateWalletLabel({
            deviceStaticSessionId,
            label: 'New Label',
        });

        expect(deps.ensureWalletSuiteSyncOn).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: true,
        });

        expect(storage.data.wallets.update).toHaveBeenCalledWith({
            walletDescriptor: asWalletDescriptor('1'),
            label: 'New Label',
        });

        expect(result).toBe(updateResult);
    });

    it('returns ensureWalletSuiteSyncOn error', async () => {
        const ensureWalletSuiteSyncOnResult = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<UpdateWalletLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ensureWalletSuiteSyncOnResult),
            getWalletLabel: () => null,
        });

        const updateWalletLabel = createUpdateWalletLabel(deps);
        const result = await updateWalletLabel({
            deviceStaticSessionId,
            label: 'New Label',
        });

        expect(deps.ensureWalletSuiteSyncOn).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: true,
        });
        expect(result).toBe(ensureWalletSuiteSyncOnResult);
    });
});
