import * as utils from '../backend';

describe('backend utils', () => {
    test('getDefaultBackendType', () => {
        expect(utils.getDefaultBackendType('btc')).toBe('blockbook');
        expect(utils.getDefaultBackendType('ltc')).toBe('blockbook');
        expect(utils.getDefaultBackendType('ada')).toBe('blockfrost');
        expect(utils.getDefaultBackendType('tada')).toBe('blockfrost');
    });
});
