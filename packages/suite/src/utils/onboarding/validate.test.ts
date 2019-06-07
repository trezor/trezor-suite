import { validateEmail, validateASCII } from './validate';

describe('validate.js', () => {
    describe('validateEmail', () => {
        it('should return true for valid email', () => {
            expect(validateEmail('satoshi@nakamoto.io')).toEqual(true);
        });

        it('should return false for invalid email', () => {
            const fooMails = ['', 'satoshi', 'satoshi@seznam', 'satoshi @foo.io'];
            fooMails.forEach(mail => {
                expect(validateEmail(mail)).toEqual(false);
            });
        });
    });

    describe('validateASCII', () => {
        it('should return true for ASCII only string', () => {
            expect(validateASCII('this is only ascii')).toEqual(true);
        });

        it('should return true when called without parameter', () => {
            expect(validateASCII()).toEqual(true);
        });

        it('should return false strings with non ASCII chars', () => {
            const fooStrings = ['¥', 'železniční přejezd'];
            fooStrings.forEach(str => {
                expect(validateASCII(str)).toEqual(false);
            });
        });
    });
});
