import * as anchorUtils from '../anchor';

describe('anchor utils', () => {
    test('getDefaultBackendType', () => {
        expect(anchorUtils.getTxAnchor('txid')).toBe('@account/transaction/txid');
    });
});
