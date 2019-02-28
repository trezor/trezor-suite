import * as utils from '../cryptoUriParser';

describe('crypto uri parser', () => {
    it('parseUri', () => {
        expect(utils.parseUri('http://www.trezor.io')).toEqual({ address: '//www.trezor.io' }); // TODO: Error in function
        expect(utils.parseUri('www.trezor.io')).toEqual({ address: 'www.trezor.io' });
        expect(utils.parseUri('www.trezor.io/TT')).toEqual({ address: 'www.trezor.io/TT' });
        expect(utils.parseUri('www.trezor.io/TT?param1=aha')).toEqual({ address: 'www.trezor.io/TT', param1: 'aha' });
        expect(utils.parseUri('www.trezor.io/TT?param1=aha&param2=hah')).toEqual({ address: 'www.trezor.io/TT', param1: 'aha', param2: 'hah' });
    });
});
