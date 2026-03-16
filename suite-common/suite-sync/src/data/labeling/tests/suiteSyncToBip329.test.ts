import {
    type SuiteSyncAddress,
    type SuiteSyncOutput,
    createSuiteSyncAddressId,
    createSuiteSyncOutputId,
} from '@suite-common/suite-sync-storage';
import { asAccountDescriptor } from '@suite-common/wallet-types';

import { suiteSyncToBip329 } from '../suiteSyncToBip329';

describe(suiteSyncToBip329.name, () => {
    it('transform properly', () => {
        const outputLabels: SuiteSyncOutput[] = [
            {
                id: createSuiteSyncOutputId(
                    '50e4fa9ebfca7d510feae7226a7d5d046114f54a7918cdd83e40c98d70d17e4d',
                    '0',
                ),
                txId: '50e4fa9ebfca7d510feae7226a7d5d046114f54a7918cdd83e40c98d70d17e4d',
                txTargetId: '0',
                label: 'this is expending transaction output or just tx',
                accountDescriptor: asAccountDescriptor('xpub...'),
                networkSymbol: 'btc',
            },
            {
                id: createSuiteSyncOutputId(
                    '519e17d6f3eb87cc8c4bf450d0dc2bad83a1387713680bec609bcb5d8e53335e',
                    '0',
                ),
                txId: '519e17d6f3eb87cc8c4bf450d0dc2bad83a1387713680bec609bcb5d8e53335e',
                txTargetId: '0',
                label: 'this is receive tx label',
                accountDescriptor: asAccountDescriptor('xpub...'),
                networkSymbol: 'btc',
            },
        ];
        const addressLabels: SuiteSyncAddress[] = [
            {
                id: createSuiteSyncAddressId('bc1qq46pg2kafgjvsh7me3puv0jujdl77a5829xlrs', 'btc'),
                address: 'bc1qq46pg2kafgjvsh7me3puv0jujdl77a5829xlrs',
                label: 'This address is labeled',
                accountDescriptor: asAccountDescriptor('xpub...'),
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
