import {
    type SuiteSyncAddress,
    type SuiteSyncOutput,
    createSuiteSyncAddressId,
    createSuiteSyncOutputId,
} from '@suite-common/suite-sync-storage';
import { asAccountDescriptor } from '@suite-common/wallet-types';

import {
    fromSuiteSyncToSearchAccountLabels,
    fromSuiteSyncToSearchOutputLabels,
} from '../fromSuiteSyncToSearchAccountLabels';

const outputLabelsFixture: SuiteSyncOutput[] = [
    {
        id: createSuiteSyncOutputId('txid1', '0'),
        txId: 'txid1',
        txTargetId: '0',
        label: 'Label A',
        accountDescriptor: asAccountDescriptor('xpub...'),
        networkSymbol: 'btc',
    },
    {
        id: createSuiteSyncOutputId('txid1', '1'),
        txId: 'txid1',
        txTargetId: '1',
        label: 'Label B',
        accountDescriptor: asAccountDescriptor('xpub...'),
        networkSymbol: 'btc',
    },
    {
        id: createSuiteSyncOutputId('txid2', '0'),
        txId: 'txid2',
        txTargetId: '0',
        label: null,
        accountDescriptor: asAccountDescriptor('xpub...'),
        networkSymbol: 'btc',
    },
];

const addressLabelsFixture: SuiteSyncAddress[] = [
    {
        id: createSuiteSyncAddressId('tb1qaddress1', 'btc'),
        address: 'tb1qaddress1',
        label: 'Address label 1',
        accountDescriptor: asAccountDescriptor('xpub...'),
        networkSymbol: 'btc',
    },
    {
        id: createSuiteSyncAddressId('tb1qaddress2', 'btc'),
        address: 'tb1qaddress2',
        label: null,
        accountDescriptor: asAccountDescriptor('xpub...'),
        networkSymbol: 'btc',
    },
];

describe(fromSuiteSyncToSearchOutputLabels.name, () => {
    it('converts output labels to nested Maps', () => {
        const outputLabels = fromSuiteSyncToSearchOutputLabels(outputLabelsFixture);

        expect(outputLabels).toBeInstanceOf(Map);
        expect(outputLabels.get('txid1')).toBeInstanceOf(Map);
        expect(outputLabels.get('txid1')?.get('0')).toBe('Label A');
        expect(outputLabels.get('txid1')?.get('1')).toBe('Label B');
        expect(outputLabels.get('txid2')).toBeUndefined();
    });
});

describe(fromSuiteSyncToSearchAccountLabels.name, () => {
    it('converts account labels to search labels shape', () => {
        const searchLabels = fromSuiteSyncToSearchAccountLabels({
            accountLabel: null,
            outputLabels: outputLabelsFixture,
            addressLabels: addressLabelsFixture,
        });

        expect(searchLabels.accountLabel).toBeNull();
        expect(searchLabels.outputLabels).toBeInstanceOf(Map);
        expect(searchLabels.outputLabels.get('txid1')?.get('0')).toBe('Label A');
        expect(searchLabels.addressLabels).toBeInstanceOf(Map);
        expect(searchLabels.addressLabels.get('tb1qaddress1')).toBe('Address label 1');
    });
});
