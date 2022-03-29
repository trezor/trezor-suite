import * as utils from '../urlUtils';

describe('utils/urlUtils', () => {
    it('getOrigin', () => {
        expect(utils.getOrigin('file://index.html')).toEqual('file://');
        expect(utils.getOrigin('https://trezor.io')).toEqual('https://trezor.io');
        expect(utils.getOrigin('https://connect.trezor.io')).toEqual('https://connect.trezor.io');
        expect(utils.getOrigin('https://foo.connect.trezor.io/9/?query=1#hash2')).toEqual(
            'https://foo.connect.trezor.io',
        );

        // @ts-expect-error: invalid param
        expect(utils.getOrigin(undefined)).toEqual('unknown');
        // @ts-expect-error: invalid param
        expect(utils.getOrigin(null)).toEqual('unknown');
        // @ts-expect-error: invalid param
        expect(utils.getOrigin({})).toEqual('unknown');
    });

    it('getOnionDomain', () => {
        const dict = {
            'trezor.io': 'trezor.onion',
        };
        // expect(utils.getOnionDomain('trezor.io', dict)).toEqual('trezor.io');
        expect(utils.getOnionDomain('https://trezor.io', dict)).toEqual('http://trezor.onion');
        expect(utils.getOnionDomain('http://trezor.io', dict)).toEqual('http://trezor.onion');
        expect(utils.getOnionDomain('http://connect.trezor.io', dict)).toEqual(
            'http://connect.trezor.onion',
        );
        expect(
            utils.getOnionDomain('http://foo.bar.connect.trezor.io/9/?query=1#hash2', dict),
        ).toEqual('http://foo.bar.connect.trezor.onion/9/?query=1#hash2');
        expect(utils.getOnionDomain('wss://trezor.io', dict)).toEqual('ws://trezor.onion');
        expect(utils.getOnionDomain('ws://foo.bar.trezor.io/?foo=bar', dict)).toEqual(
            'ws://foo.bar.trezor.onion/?foo=bar',
        );
    });
});
