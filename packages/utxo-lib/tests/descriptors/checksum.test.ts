// Test vectors from https://github.com/bitcoin/bips/blob/master/bip-0380.mediawiki#test-vectors

import {
    addDescriptorChecksum,
    getDescriptorChecksum,
    verifyDescriptorChecksum,
} from '../../src/descriptors/checksum';

describe('getDescriptorChecksum', () => {
    it('computes checksum for raw(deadbeef)', () => {
        expect(getDescriptorChecksum('raw(deadbeef)')).toBe('89f8spxm');
    });

    it('throws for a descriptor containing an invalid character', () => {
        expect(() => getDescriptorChecksum('raw(Ü)')).toThrow('Invalid character in descriptor');
    });

    // Round-trip: the checksum of the same input is always identical
    it('is deterministic', () => {
        const desc =
            '[deadbeef/0h/1h/2h]xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL/3/4/5/*';
        expect(getDescriptorChecksum(desc)).toBe(getDescriptorChecksum(desc));
    });

    it('with receive and change descriptor (BIP389)', () => {
        const fromAllSeed =
            'wpkh([5c9e228d/84h/0h/0h]xpub6DDUPHpUo4pcy43iJeZjbSVWGav1SMMmuWdMHiGtkK8rhKmfbomtkwW6GKs1GGAKehT6QRocrmda3WWxXawpjmwaUHfFRXuKrXSapdckEYF/<0;1>/*)';
        const expectedChecksum = 'u9auedf8';
        expect(getDescriptorChecksum(fromAllSeed)).toBe(expectedChecksum);
    });

    it('with received descriptor (Bitcoin Core)', () => {
        const fromAllSeed =
            'wpkh([5c9e228d/84h/0h/0h]xpub6DDUPHpUo4pcy43iJeZjbSVWGav1SMMmuWdMHiGtkK8rhKmfbomtkwW6GKs1GGAKehT6QRocrmda3WWxXawpjmwaUHfFRXuKrXSapdckEYF/0/*)';
        const expectedChecksum = 'vyj8qz0q';
        expect(getDescriptorChecksum(fromAllSeed)).toBe(expectedChecksum);
    });

    it('with change descriptor (Bitcoin Core)', () => {
        const fromAllSeed =
            'wpkh([5c9e228d/84h/0h/0h]xpub6DDUPHpUo4pcy43iJeZjbSVWGav1SMMmuWdMHiGtkK8rhKmfbomtkwW6GKs1GGAKehT6QRocrmda3WWxXawpjmwaUHfFRXuKrXSapdckEYF/1/*)';
        const expectedChecksum = 'ashxahlc';
        expect(getDescriptorChecksum(fromAllSeed)).toBe(expectedChecksum);
    });
});

describe('addDescriptorChecksum', () => {
    it('appends #<checksum> to raw(deadbeef)', () => {
        expect(addDescriptorChecksum('raw(deadbeef)')).toBe('raw(deadbeef)#89f8spxm');
    });

    it('output always passes verifyDescriptorChecksum', () => {
        const expressions = [
            '0260b2003c386519fc9eadf2b5cf124dd8eea4c4e68d5e154050a9346ea98ce600',
            '[deadbeef/0h/0h/0h]0260b2003c386519fc9eadf2b5cf124dd8eea4c4e68d5e154050a9346ea98ce600',
            "[deadbeef/0'/0'/0']0260b2003c386519fc9eadf2b5cf124dd8eea4c4e68d5e154050a9346ea98ce600",
            'xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL',
            '[deadbeef/0h/1h/2h]xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL',
            '[deadbeef/0h/1h/2h]xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL/3/4/5',
            '[deadbeef/0h/1h/2h]xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL/3/4/5/*',
            'xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL/3h/4h/5h/*',
            'xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL/3h/4h/5h/*h',
        ];
        for (const expr of expressions) {
            expect(verifyDescriptorChecksum(addDescriptorChecksum(expr))).toBe(true);
        }
    });
});

describe('verifyDescriptorChecksum', () => {
    describe('valid', () => {
        it('accepts raw(deadbeef)#89f8spxm', () => {
            expect(verifyDescriptorChecksum('raw(deadbeef)#89f8spxm')).toBe(true);
        });
    });

    describe('invalid', () => {
        it('rejects when there is no checksum', () => {
            expect(verifyDescriptorChecksum('raw(deadbeef)')).toBe(false);
        });

        it('rejects when checksum is missing after #', () => {
            expect(verifyDescriptorChecksum('raw(deadbeef)#')).toBe(false);
        });

        it('rejects a checksum that is too short (7 chars)', () => {
            expect(verifyDescriptorChecksum('raw(deadbeef)#89f8spx')).toBe(false);
        });

        it('rejects a checksum that is too long (9 chars)', () => {
            expect(verifyDescriptorChecksum('raw(deadbeef)#89f8spxmx')).toBe(false);
        });

        it('rejects when the payload has been altered', () => {
            // deedbeef vs deadbeef
            expect(verifyDescriptorChecksum('raw(deedbeef)#89f8spxm')).toBe(false);
        });

        it('rejects when the checksum contains invalid characters', () => {
            // second char is '#' which is not in CHECKSUM_CHARSET
            expect(verifyDescriptorChecksum('raw(deedbeef)##9f8spxm')).toBe(false);
        });

        it('rejects when the payload contains characters outside INPUT_CHARSET', () => {
            expect(verifyDescriptorChecksum('raw(Ü)#00000000')).toBe(false);
        });
    });
});
