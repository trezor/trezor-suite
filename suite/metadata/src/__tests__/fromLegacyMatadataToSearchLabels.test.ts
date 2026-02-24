import { AccountLabels } from '@suite-common/metadata-types';

import {
    fromLegacyMetadataToSearchAccountLabels,
    fromLegacyMetadataToSearchOutputLabels,
} from '../fromLegacyMetadataToSearchLabels';

describe('fromLegacyMetadataToSearchLabels', () => {
    const accountLabelsFixture: AccountLabels = {
        accountLabel: 'Account label',
        outputLabels: {
            txid1: {
                '0': 'Label A',
                '1': 'Label B',
            },
            txid2: {
                abc: 'Label C',
            },
        },
        addressLabels: {
            tb1qaddress1: 'Address label 1',
            tb1qaddress2: 'Address label 2',
        },
    };

    it('converts output labels to nested Maps', () => {
        const outputLabels = fromLegacyMetadataToSearchOutputLabels(
            accountLabelsFixture.outputLabels,
        );

        expect(outputLabels).toBeInstanceOf(Map);
        expect(outputLabels.get('txid1')).toBeInstanceOf(Map);
        expect(outputLabels.get('txid1')?.get('0')).toBe('Label A');
        expect(outputLabels.get('txid1')?.get('1')).toBe('Label B');
        expect(outputLabels.get('txid2')?.get('abc')).toBe('Label C');
    });

    it('converts account labels to search labels shape', () => {
        const searchLabels = fromLegacyMetadataToSearchAccountLabels(accountLabelsFixture);

        expect(searchLabels.accountLabel).toBe('Account label');
        expect(searchLabels.outputLabels).toBeInstanceOf(Map);
        expect(searchLabels.outputLabels.get('txid1')?.get('0')).toBe('Label A');
        expect(searchLabels.addressLabels).toBeInstanceOf(Map);
        expect(searchLabels.addressLabels.get('tb1qaddress1')).toBe('Address label 1');
    });

    it('handles empty legacy structures', () => {
        const searchLabels = fromLegacyMetadataToSearchAccountLabels({
            accountLabel: '',
            outputLabels: {},
            addressLabels: {},
        });

        expect(searchLabels.outputLabels.size).toBe(0);
        expect(searchLabels.addressLabels.size).toBe(0);
    });
});
