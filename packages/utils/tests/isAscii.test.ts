import { isAscii } from '../src/isAscii';

describe('isAscii', () => {
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
});
