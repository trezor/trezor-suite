import { buildOption, formatCryptoAmount, symbolToInvityApiSymbol } from '../coinmarketUtils';

describe('coinmarket utils', () => {
    it('buildOption', () => {
        expect(buildOption('czk')).toStrictEqual({ value: 'czk', label: 'CZK' });
    });

    it('symbolToInvityApiSymbol', () => {
        expect(symbolToInvityApiSymbol('btc')).toStrictEqual('btc');
        expect(symbolToInvityApiSymbol('usdt')).toStrictEqual('usdt20');
    });

    it('formatCryptoAmount', () => {
        expect(formatCryptoAmount(Number('194.359760816544300225'))).toStrictEqual('194.3598');
        expect(formatCryptoAmount(Number('0.359760816544300225'))).toStrictEqual('0.359761');
        expect(formatCryptoAmount(Number('0.00123456'))).toStrictEqual('0.00123456');
    });
});
