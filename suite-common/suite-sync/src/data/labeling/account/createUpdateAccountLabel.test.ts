import { createMockDeps, mock } from '@suite-common/dependency-injection';
import { asAccountDescriptor, createAccountKey } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { type UpdateAccountLabelDeps, createUpdateAccountLabel } from './createUpdateAccountLabel';
import { createSuiteSyncStorageMock } from '../../../../mocks/mockCreateSuiteSyncStorage';
import { SuiteSyncUnavailableOnDeviceError } from '../../../createEnsureSuiteSyncKeys';

const deviceStaticSessionId: StaticSessionId = '1@2:3';
const accountKey = createAccountKey({
    accountDescriptor: asAccountDescriptor('accountDescriptor'),
    networkSymbol: 'btc',
    deviceStaticSessionId,
});

describe(createUpdateAccountLabel.name, () => {
    it('ensures storage then writes the label with it', async () => {
        const storage = createSuiteSyncStorageMock();
        const writeResult = ok();

        const deps = createMockDeps<UpdateAccountLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok(storage)),
            writeAccountLabel: mock(() => writeResult),
        });

        const result = await createUpdateAccountLabel(deps)({
            deviceStaticSessionId,
            accountKey,
            label: 'New Account Label',
        });

        expect(deps.ensureWalletSuiteSyncOn).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: true,
        });
        expect(deps.writeAccountLabel).toHaveBeenCalledWith({
            storage,
            data: { deviceStaticSessionId, accountKey, label: 'New Account Label' },
        });
        expect(result).toBe(writeResult);
    });

    it('returns ensureWalletSuiteSyncOn error without writing', async () => {
        const ensureWalletSuiteSyncOnResult = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<UpdateAccountLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ensureWalletSuiteSyncOnResult),
            writeAccountLabel: mock(() => ok()),
        });

        const result = await createUpdateAccountLabel(deps)({
            deviceStaticSessionId,
            accountKey,
            label: 'New Account Label',
        });

        expect(result).toBe(ensureWalletSuiteSyncOnResult);
        expect(deps.writeAccountLabel).not.toHaveBeenCalled();
    });
});
