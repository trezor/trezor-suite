import { createMockDeps, mock } from '@suite-common/dependency-injection';
import type { AddressTable } from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';
import { ok } from '@trezor/type-utils';

import { type WriteAddressLabelDeps, createWriteAddressLabel } from './createWriteAddressLabel';
import { createSuiteSyncStorageMock } from '../../../../mocks/mockCreateSuiteSyncStorage';

const deviceStaticSessionId: StaticSessionId = '1@2:3' as const;
const networkSymbol: NetworkSymbol = 'btc';
const accountDescriptor = asAccountDescriptor('accountDescriptor');

describe(createWriteAddressLabel.name, () => {
    it('writes address label to storage, reports analytics and propagates the result', () => {
        const updateResult: ReturnType<AddressTable['update']> = ok();
        const report = mock(() => {});

        const storage = createSuiteSyncStorageMock({
            addresses: { update: mock<AddressTable['update']>(() => updateResult) },
        });

        const deps = createMockDeps<WriteAddressLabelDeps>({
            analytics: { report },
            getAddressLabel: () => null,
        });

        const result = createWriteAddressLabel(deps)({
            storage,
            data: {
                deviceStaticSessionId,
                address: 'bc1address',
                label: 'New Address Label',
                accountDescriptor,
                networkSymbol,
            },
        });

        expect(storage.data.addresses.update).toHaveBeenCalledWith({
            address: 'bc1address',
            label: 'New Address Label',
            accountDescriptor,
            networkSymbol,
        });
        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    entity_type: 'receive_address',
                    network: 'btc',
                    action: 'created',
                }),
            }),
        );
        expect(result).toBe(updateResult);
    });
});
