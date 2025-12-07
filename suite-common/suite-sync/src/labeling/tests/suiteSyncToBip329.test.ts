import { AddressLabel, OutputLabel } from '@suite-common/suite-sync-storage';

import { suiteSyncToBip329 } from '../suiteSyncToBip329Params';

describe(suiteSyncToBip329.name, () => {
    it('transform properly', () => {
        const outputLabels: OutputLabel[] = [
            {
                txId: '50e4fa9ebfca7d510feae7226a7d5d046114f54a7918cdd83e40c98d70d17e4d',
                outputIndex: 0,
                label: 'this is expending transaction output or just tx',
                accountDescriptor: 'xpub...',
                networkSymbol: 'btc',
            },
            {
                txId: '519e17d6f3eb87cc8c4bf450d0dc2bad83a1387713680bec609bcb5d8e53335e',
                outputIndex: 0,
                label: 'this is receive tx label',
                accountDescriptor: 'xpub...',
                networkSymbol: 'btc',
            },
        ];
        const addressLabels: AddressLabel[] = [
            {
                address: 'bc1qq46pg2kafgjvsh7me3puv0jujdl77a5829xlrs',
                label: 'This address is labeled',
                accountDescriptor: 'xpub...',
                networkSymbol: 'btc',
            },
        ];
        const allSpendable = true;

        const bip329Output = suiteSyncToBip329({
            outputLabels,
            addressLabels,
            allSpendable,
        });

        const expectedResult = [
            {
                type: 'output',
                ref: '50e4fa9ebfca7d510feae7226a7d5d046114f54a7918cdd83e40c98d70d17e4d:0',
                label: 'this is expending transaction output or just tx',
            },
            {
                type: 'output',
                ref: '519e17d6f3eb87cc8c4bf450d0dc2bad83a1387713680bec609bcb5d8e53335e:0',
                label: 'this is receive tx label',
            },
            {
                type: 'addr',
                ref: 'bc1qq46pg2kafgjvsh7me3puv0jujdl77a5829xlrs',
                label: 'This address is labeled',
            },
        ];

        bip329Output.forEach((label, index) => {
            expect(label.type).toEqual(expectedResult[index].type);
            expect(label.ref).toEqual(expectedResult[index].ref);
            expect(label.label).toEqual(expectedResult[index].label);
        });
    });
});
