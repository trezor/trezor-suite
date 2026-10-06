import { normalizeDexTransactionData } from './normalizeDexTransactionData';

describe(normalizeDexTransactionData.name, () => {
    it('converts Solana transaction data from base64 to hex', () => {
        expect(
            normalizeDexTransactionData({
                data: 'AQID/w==',
                networkType: 'solana',
            }),
        ).toBe('010203ff');
    });

    it('keeps EVM transaction data unchanged', () => {
        expect(
            normalizeDexTransactionData({
                data: '0xabcdef',
                networkType: 'ethereum',
            }),
        ).toBe('0xabcdef');
    });
});
