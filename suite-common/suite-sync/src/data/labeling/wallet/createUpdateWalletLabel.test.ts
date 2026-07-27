import { createMockDeps, mock } from '@suite-common/dependency-injection';
import { type StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { type UpdateWalletLabelDeps, createUpdateWalletLabel } from './createUpdateWalletLabel';
import { createSuiteSyncStorageMock } from '../../../../mocks/mockCreateSuiteSyncStorage';
import { SuiteSyncUnavailableOnDeviceError } from '../../../createEnsureSuiteSyncKeys';

const deviceStaticSessionId: StaticSessionId = '1@2:3';

describe(createUpdateWalletLabel.name, () => {
    it('ensures storage then writes the label with it', async () => {
        const storage = createSuiteSyncStorageMock();
        const writeResult = ok();

        const deps = createMockDeps<UpdateWalletLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok(storage)),
            writeWalletLabel: mock(() => writeResult),
        });

        const result = await createUpdateWalletLabel(deps)({
            deviceStaticSessionId,
            label: 'New Label',
        });

        expect(deps.ensureWalletSuiteSyncOn).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: true,
        });
        expect(deps.writeWalletLabel).toHaveBeenCalledWith({
            storage,
            data: { deviceStaticSessionId, label: 'New Label' },
        });
        expect(result).toBe(writeResult);
    });

    it('returns ensureWalletSuiteSyncOn error without writing', async () => {
        const ensureWalletSuiteSyncOnResult = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<UpdateWalletLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ensureWalletSuiteSyncOnResult),
            writeWalletLabel: mock(() => ok()),
        });

        const result = await createUpdateWalletLabel(deps)({
            deviceStaticSessionId,
            label: 'New Label',
        });

        expect(result).toBe(ensureWalletSuiteSyncOnResult);
        expect(deps.writeWalletLabel).not.toHaveBeenCalled();
    });
});
