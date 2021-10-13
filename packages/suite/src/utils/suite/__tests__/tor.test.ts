import { TOR_URLS } from '@suite-constants';
import { getTorUrlIfAvailable, isTorDomain, toTorUrl } from '@suite-utils/tor';

describe('tor', () => {
    describe('getTorUrlIfAvailable', () => {
        const fixtures = [
            {
                desc: 'simple domain',
                in: 'https://trezor.io',
                out: `http://${TOR_URLS['trezor.io']}/`,
            },
            {
                desc: 'subdomain',
                in: 'https://cdn.trezor.io/static/medium/images/max/1024/1*RPmW1VsUphMbk83oKWXpLw.png',
                out: `http://cdn.${TOR_URLS['trezor.io']}/static/medium/images/max/1024/1*RPmW1VsUphMbk83oKWXpLw.png`,
            },
        ];

        fixtures.forEach(f => {
            it(f.desc, () => {
                expect(getTorUrlIfAvailable(f.in)).toEqual(f.out);
            });
        });
    });

    describe('isTorDomain', () => {
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
                expect(isTorDomain(f.in)).toEqual(f.out);
            });
        });
    });

    describe('toTorUrl', () => {
        const fixtures = [
            {
                desc: 'returns tor url',
                in: 'https://trezor.io',
                out: `http://${TOR_URLS['trezor.io']}/`,
            },
            {
                desc: 'throws',
                in: 'https://google.com',
            },
        ];

        fixtures.forEach(f => {
            it(f.desc, () => {
                if (!f.out) {
                    expect(() => toTorUrl(f.in)).toThrow();
                } else {
                    expect(toTorUrl(f.in)).toEqual(f.out);
                }
            });
        });
    });
});
