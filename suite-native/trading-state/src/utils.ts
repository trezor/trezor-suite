import { TradingExchangeType, TradingSellType } from '@suite-common/trading';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

export const getFormDraftKeyByTradeType = (tradeType: TradingSellType | TradingExchangeType) => {
    switch (tradeType) {
        case 'exchange':
            return getFormDraftKey('trading-exchange', '');
        case 'sell':
            return getFormDraftKey('trading-sell', '');
        default:
            return exhaustive(tradeType);
    }
};
