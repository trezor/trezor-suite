import { isPhishingDomain } from './isPhishingDomain';

describe('isPhishingDomain', () => {
    const good = ['trezor.io', 'connect.trezor.io'];

    good.forEach(domain => {
        it(`ok: ${domain}`, () => {
            expect(isPhishingDomain(domain)).toEqual(false);
        });
    });
});
