import { bip329ToSlip15 } from "../src/bip329ToSlip15";
import { Bip329Label, Slip15LikeInput } from "../src/types";

describe('bip329ToSlip15', () => {
    it('should transform a full set of BIP-329 labels to SLIP-15 format', () => {
        const bip329Input: Bip329Label[] = [
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
            {
                type: 'tx', // This type should be ignored by the transform
                ref: 'some-other-txid',
                label: 'Ignored TX Label',
            },
        ];

        // This is the expected SLIP-15 object
        const expectedSlip15: Slip15LikeInput = {
            version: '1',
            accountLabel: 'Imported BIP32 wallet',
            outputLabels: {
                '50e4fa9ebfca7d510feae7226a7d5d046114f54a7918cdd83e40c98d70d17e4d': {
                    '0': 'this is expending transaction output or just tx',
                },
                '519e17d6f3eb87cc8c4bf450d0dc2bad83a1387713680bec609bcb5d8e53335e': {
                    '0': 'this is receive tx label',
                },
            },
            addressLabels: {
                bc1qq46pg2kafgjvsh7me3puv0jujdl77a5829xlrs: 'This address is labeled',
            },
        };

        const slip15Result = bip329ToSlip15(bip329Input);

        // Use deep equality to check the entire object structure
        expect(slip15Result).toEqual(expectedSlip15);
    });

    it('should handle an empty input array', () => {
        const bip329Input: Bip329Label[] = [];

        const expectedSlip15: Slip15LikeInput = {
            version: 'bip329_import',
            // No other properties should be defined
        };

        const slip15Result = bip329ToSlip15(bip329Input);
        expect(slip15Result).toEqual(expectedSlip15);
    });

    it('should ignore labels with missing or malformed refs', () => {
        const bip329Input: Bip329Label[] = [
            { type: 'addr', label: 'Missing ref' }, // No 'ref'
            { type: 'output', label: 'Missing ref' }, // No 'ref'
            { type: 'output', ref: 'just-a-txid', label: 'Malformed ref' }, // Missing ':vout'
            { type: 'output', ref: 'txid:vout:extra', label: 'Malformed ref' }, // Too many parts
        ];

        const expectedSlip15: Slip15LikeInput = {
            version: 'bip329_import',
            // No 'addressLabels' or 'outputLabels' should be created
        };

        const slip15Result = bip329ToSlip15(bip329Input);
        expect(slip15Result).toEqual(expectedSlip15);
    });

    it('should only use the first "wallet" label encountered', () => {
        const bip329Input: Bip329Label[] = [
            { type: 'wallet', label: 'First Wallet' },
            { type: 'wallet', label: 'Second Wallet (ignored)' },
        ];

        const expectedSlip15: Slip15LikeInput = {
            version: 'bip329_import',
            accountLabel: 'First Wallet',
        };

        const slip15Result = bip329ToSlip15(bip329Input);
        expect(slip15Result).toEqual(expectedSlip15);
    });
});