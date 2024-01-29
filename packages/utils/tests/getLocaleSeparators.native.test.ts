import { getLocaleSeparators } from '../src/getLocaleSeparators.native';

describe('getLocaleSeparators', () => {
    it('should correctly identify separators for en-US', () => {
        expect(getLocaleSeparators('en-US')).toEqual({
            decimalSeparator: '.',
            thousandsSeparator: ',',
        });
    });

    it('should correctly identify separators for de-DE', () => {
        expect(getLocaleSeparators('de-DE')).toEqual({
            decimalSeparator: ',',
            thousandsSeparator: '.',
        });
    });

    it('should correctly identify separators for fr-FR', () => {
        expect(getLocaleSeparators('fr-FR')).toEqual({
            decimalSeparator: ',',
            thousandsSeparator: '\u202F',
        }); // note the non-breaking space
    });

    it('should correctly identify separators for ja-JP', () => {
        expect(getLocaleSeparators('ja-JP')).toEqual({
            decimalSeparator: '.',
            thousandsSeparator: ',',
        }); // Japanese uses the same separators as en-US
    });

    it('should correctly identify separators for cs-CZ', () => {
        expect(getLocaleSeparators('cs-CZ')).toEqual({
            decimalSeparator: ',',
            thousandsSeparator: '\u00A0',
        }); // note the non-breaking space
    });
});
