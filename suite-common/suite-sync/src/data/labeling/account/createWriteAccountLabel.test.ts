import { createMockDeps, mock } from '@suite-common/dependency-injection';
import type { AccountTable } from '@suite-common/suite-sync-storage';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor, createAccountKey } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/device-utils';
import { ok } from '@trezor/type-utils';

import { type WriteAccountLabelDeps, createWriteAccountLabel } from './createWriteAccountLabel';
import { createSuiteSyncStorageMock } from '../../../../mocks/mockCreateSuiteSyncStorage';

const deviceStaticSessionId: StaticSessionId = '1@2:3' as const;
const accountDescriptor = asAccountDescriptor('accountDescriptor');
const btcSymbol = asNetworkSymbol('btc');

describe(createWriteAccountLabel.name, () => {
    it('writes account label to storage, reports analytics and propagates the result', () => {
        const updateResult: ReturnType<AccountTable['update']> = ok();
        const report = mock(() => {});

        const storage = createSuiteSyncStorageMock({
            accounts: { update: mock<AccountTable['update']>(() => updateResult) },
        });

        const deps = createMockDeps<WriteAccountLabelDeps>({
            analytics: { report },
            getAccountLabel: () => null,
        });

        const result = createWriteAccountLabel(deps)({
            storage,
            data: {
                deviceStaticSessionId,
                accountKey: createAccountKey({
                    accountDescriptor,
                    networkSymbol: btcSymbol,
                    deviceStaticSessionId,
                }),
                label: 'New Account Label',
            },
        });

        expect(storage.data.accounts.update).toHaveBeenCalledWith({
            accountDescriptor,
            networkSymbol: btcSymbol,
            label: 'New Account Label',
        });
        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    entity_type: 'account',
                    network: 'btc',
                    action: 'created',
                }),
            }),
        );
        expect(result).toBe(updateResult);
    });
});
