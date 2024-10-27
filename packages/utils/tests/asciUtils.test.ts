import { isAscii, getNonAsciiChars } from '../src/asciiUtils';

describe('isAscii', () => {
    it('should return true for ASCII only string', () => {
        expect(isAscii('this is only ascii')).toEqual(true);
    });

    it('should return true when called without parameter', () => {
        expect(isAscii()).toEqual(true);
    });

    it('should return false strings with non ASCII chars', () => {
        expect(isAscii('¥')).toEqual(false);
        expect(isAscii('železniční přejezd')).toEqual(false);
    });
});

describe('getNonAsciiChars', () => {
    test('should return null for an empty string', () => {
        expect(getNonAsciiChars('')).toBeNull();
    });

    test('should return null for ASCII-only characters', () => {
        expect(getNonAsciiChars('Hello, World!')).toBeNull();
    });

    test('should return all non-ASCII characters for a mixed string', () => {
        expect(getNonAsciiChars('Čau světe!')).toEqual(['Č', 'ě']);
    });

    test('should return all instances of repeating non-ASCII characters', () => {
        expect(getNonAsciiChars('Přátelé přátelé')).toEqual(['ř', 'á', 'é', 'ř', 'á', 'é']);
    });
});
