import { CryptoId } from 'invity-api';

import {
    getStatusMessage,
    tradingGetExchangeReceiveCryptoId,
} from 'src/utils/wallet/trading/exchangeUtils';

describe('trading/exchange utils', () => {
    it('getStatusMessage', () => {
        expect(getStatusMessage('CONVERTING')).toBe('TR_EXCHANGE_STATUS_CONVERTING');
        expect(getStatusMessage('CONFIRMING')).toBe('TR_EXCHANGE_STATUS_CONFIRMING');
        expect(getStatusMessage('KYC')).toBe('TR_EXCHANGE_STATUS_KYC');
        expect(getStatusMessage('ERROR')).toBe('TR_EXCHANGE_STATUS_ERROR');
        expect(getStatusMessage('SUCCESS')).toBe('TR_EXCHANGE_STATUS_SUCCESS');
    });

    it('tradingGetExchangeReceiveCryptoId', () => {
        // default cryptoId
        expect(tradingGetExchangeReceiveCryptoId('bitcoin' as CryptoId)).toBe('ethereum');
        expect(tradingGetExchangeReceiveCryptoId('litecoin' as CryptoId)).toBe('bitcoin');
        expect(
            tradingGetExchangeReceiveCryptoId(
                'ethereum--0x0000000000085d4780b73119b644ae5ecd22b376' as CryptoId,
            ),
        ).toBe('bitcoin');

        // already selected
        expect(
            tradingGetExchangeReceiveCryptoId('bitcoin' as CryptoId, 'bitcoin' as CryptoId),
        ).toBe('ethereum');
        expect(
            tradingGetExchangeReceiveCryptoId(
                'bitcoin' as CryptoId,
                'ethereum--0x0000000000085d4780b73119b644ae5ecd22b376' as CryptoId,
            ),
        ).toBe('ethereum--0x0000000000085d4780b73119b644ae5ecd22b376');
    });
});
