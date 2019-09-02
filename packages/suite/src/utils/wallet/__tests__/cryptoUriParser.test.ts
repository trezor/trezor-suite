import { parseUri } from '../cryptoUriParser';

test('cryptoUriParser.parseUri', () => {
    expect(parseUri('http://www.trezor.io')).toEqual({
        address: '//www.trezor.io',
    });
    expect(parseUri('www.trezor.io')).toEqual({
        address: 'www.trezor.io',
    });
    expect(parseUri('www.trezor.io/route')).toEqual({
        address: 'www.trezor.io/route',
    });
    expect(parseUri('www.trezor.io/route?query=1&odd')).toEqual({
        address: 'www.trezor.io/route',
        query: '1',
    });
    expect(parseUri('www.trezor.io?query=1&amount=1')).toEqual({
        address: 'www.trezor.io',
        query: '1',
        amount: '1',
    });
});
