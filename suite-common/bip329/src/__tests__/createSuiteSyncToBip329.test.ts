import {
    createSuiteSyncAddressId,
    createSuiteSyncOutputId,
} from '@suite-common/suite-sync-storage';
import { asTxTargetId } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { createSuiteSyncToBip329 } from '../suiteSync/createSuiteSyncToBip329';

const account = mockWalletAccount({
    symbol: 'btc',
    deviceState: 'walletDescriptor@deviceId:1',
});
const address = 'bc1qq46pg2kafgjvsh7me3puv0jujdl77a5829xlrs';

describe(createSuiteSyncToBip329.name, () => {
    it('returns mapped labels from the injected getter', () => {
        const allLabelsForAccount = {
            accountLabel: 'Account Label',
            addressLabels: [
                {
                    id: createSuiteSyncAddressId(address, 'btc'),
                    address,
                    label: 'Address label',
                    accountDescriptor: account.descriptor,
                    networkSymbol: 'btc',
                },
            ],
            outputLabels: [
                {
                    id: createSuiteSyncOutputId('txid', asTxTargetId('1')),
                    txId: 'txid',
                    txTargetId: asTxTargetId('1'),
                    label: 'Output label',
                    accountDescriptor: account.descriptor,
                    networkSymbol: 'btc',
                },
            ],
        };
        const getAllLabelsForAccount = jest.fn().mockImplementation(() => allLabelsForAccount);
        const exportSuiteSyncToBip329 = createSuiteSyncToBip329({
            getAllLabelsForAccount,
        });

        const result = exportSuiteSyncToBip329({
            account,
        });

        expect(getAllLabelsForAccount).toHaveBeenCalledWith({
            walletDescriptor: 'walletDescriptor',
            accountDescriptor: account.descriptor,
            networkSymbol: account.symbol,
        });
        expect(result).toEqual({
            accountLabel: 'Account Label',
            labelsToExport: [
                {
                    type: 'output',
                    ref: 'txid:1',
                    label: 'Output label',
                    spendable: true,
                },
                {
                    type: 'addr',
                    ref: address,
                    label: 'Address label',
                },
            ],
        });
    });
});
