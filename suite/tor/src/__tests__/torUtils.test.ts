import { TOR_URLS } from '@trezor/urls';

import { getIsTorDomain, isOnionUrl } from '../torUtils';

describe('torUtils', () => {
    describe(getIsTorDomain.name, () => {
        const fixtures = [
            {
                desc: 'yes',
                in: TOR_URLS['trezor.io'],
                out: true,
            },
            {
                desc: 'no',
                in: 'google.com',
                out: false,
            },
        ];

        fixtures.forEach(f => {
            it(f.desc, () => {
                expect(getIsTorDomain(f.in)).toEqual(f.out);
            });
        });
    });

    describe(isOnionUrl.name, () => {
        const fixtures = [
            {
                desc: 'yes',
                in: `https://${TOR_URLS['trezor.io']}`,
                out: true,
            },
            {
                desc: 'no',
                in: 'https://google.com',
                out: false,
            },
            {
                desc: 'yes with params',
                in: `https://${TOR_URLS['trezor.io']}/foo/bar?foo=bar`,
                out: true,
            },
            {
                desc: 'no false positive',
                in: 'https://my.onion.com',
                out: false,
            },
        ];

        fixtures.forEach(f => {
            it(f.desc, () => {
                expect(isOnionUrl(f.in)).toEqual(f.out);
            });
        });
    });
});
