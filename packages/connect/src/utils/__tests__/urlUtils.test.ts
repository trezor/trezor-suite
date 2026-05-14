import { getHost, getOrigin } from '@trezor/connect-common/src/utils/urlUtils';

describe('utils/urlUtils', () => {
    it('getOrigin', () => {
        expect(getOrigin('file://index.html')).toEqual('file://');
        expect(getOrigin('https://trezor.io')).toEqual('https://trezor.io');
        expect(getOrigin('https://connect.trezor.io')).toEqual('https://connect.trezor.io');
        expect(getOrigin('https://foo.connect.trezor.io/9/?query=1#hash2')).toEqual(
            'https://foo.connect.trezor.io',
        );

        expect(getOrigin(undefined)).toEqual('unknown');
        expect(getOrigin(null)).toEqual('unknown');
        expect(getOrigin({})).toEqual('unknown');
    });

    it('getHost', () => {
        expect(getHost('http://localhost:8088/')).toEqual('localhost');
        expect(getHost('http://subdomain.localhost:8088/')).toEqual('localhost');
        expect(getHost('file://index.html')).toEqual(undefined);
        expect(getHost('https://trezor.io')).toEqual('trezor.io');
        expect(getHost('https://connect.trezor.io')).toEqual('trezor.io');
        expect(getHost('https://foo.connect.trezor.io/9/?query=1#hash2')).toEqual('trezor.io');

        expect(getHost(undefined)).toEqual(undefined);
        expect(getHost(null)).toEqual(undefined);
        expect(getHost({})).toEqual(undefined);
    });
});
