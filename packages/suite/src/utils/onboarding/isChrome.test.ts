import isChrome from './isChrome';

describe('isChrome.js', () => {
    it('should return true for chrome Version 70.0.3538.102', () => {
        expect(
            isChrome({
                userAgent:
                    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36',
                vendor: 'Google Inc.',
            }),
        ).toEqual(true);
    });

    it('should return false for mozzila 63.0 ', () => {
        expect(
            isChrome({
                userAgent:
                    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:63.0) Gecko/20100101 Firefox/63.0',
                vendor: '',
            }),
        ).toEqual(false);
    });
});
