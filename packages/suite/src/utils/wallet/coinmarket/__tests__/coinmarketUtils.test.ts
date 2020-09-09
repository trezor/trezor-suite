import { formatCryptoAmount } from '../coinmarketUtils';

describe('coinmarket utils', () => {
    it('formatCryptoAmount', () => {
        expect(formatCryptoAmount(Number('194.359760816544300225'))).toStrictEqual('194.3598');
    });
});
