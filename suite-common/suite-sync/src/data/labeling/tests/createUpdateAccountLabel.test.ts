import { createMockDeps, mock } from '@suite-common/dependency-injection';
import type { AccountTable } from '@suite-common/suite-sync-storage';
import { asAccountDescriptor, createAccountKey } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { createSuiteSyncStorageMock } from '../../../../tests/createSuiteSyncStorageMock.mock';
import { SuiteSyncUnavailableOnDeviceError } from '../../../createEnsureSuiteSyncKeys';
import { type UpdateAccountLabelDeps, createUpdateAccountLabel } from '../createUpdateAccountLabel';

const deviceStaticSessionId: StaticSessionId = '1@2:3';
const getAccountLabel = () => null;

describe(createUpdateAccountLabel.name, () => {
    it('updates account label and propagates update result', async () => {
        const updateResult: ReturnType<AccountTable['update']> = ok();

        const storage = createSuiteSyncStorageMock({
            accounts: { update: mock<AccountTable['update']>(() => updateResult) },
        });

        const deps = createMockDeps<UpdateAccountLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok(storage)),
            getAccountLabel,
        });

        const updateAccountLabel = createUpdateAccountLabel(deps);
        const result = await updateAccountLabel({
            deviceStaticSessionId,
            accountKey: createAccountKey({
                accountDescriptor: asAccountDescriptor('accountDescriptor'),
                networkSymbol: 'btc',
                deviceStaticSessionId: '1@2:3',
            }),
            label: 'New Account Label',
        });

        expect(deps.ensureWalletSuiteSyncOn).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: true,
        });

        expect(storage.data.accounts.update).toHaveBeenCalledWith({
            accountDescriptor: asAccountDescriptor('accountDescriptor'),
            networkSymbol: 'btc',
            label: 'New Account Label',
        });

        expect(result).toBe(updateResult);
    });

    it('returns ensureWalletSuiteSyncOn error', async () => {
        const ensureWalletSuiteSyncOnResult = err(SuiteSyncUnavailableOnDeviceError());

        const deps = createMockDeps<UpdateAccountLabelDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ensureWalletSuiteSyncOnResult),
            getAccountLabel,
        });

        const updateAccountLabel = createUpdateAccountLabel(deps);
        const result = await updateAccountLabel({
            deviceStaticSessionId,
            accountKey: createAccountKey({
                accountDescriptor: asAccountDescriptor('accountDescriptor'),
                networkSymbol: 'btc',
                deviceStaticSessionId: '1@2:3',
            }),
            label: 'New Account Label',
        });

        expect(deps.ensureWalletSuiteSyncOn).toHaveBeenCalledWith({
            deviceStaticSessionId,
            isWriteMode: true,
        });
        expect(result).toBe(ensureWalletSuiteSyncOnResult);
    });
});
