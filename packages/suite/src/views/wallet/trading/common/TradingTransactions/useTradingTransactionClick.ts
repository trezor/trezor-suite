import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import {
    type TradingTransaction,
    type TradingTransactionBuy,
    type TradingTransactionExchange,
    type TradingTransactionSell,
    tradingActions,
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { exhaustive } from '@trezor/type-utils';

export const useTradingTransactionClick = () => {
    const dispatch = useDispatch();

    const openBuy = (trade: TradingTransactionBuy) => {
        dispatch(tradingBuyActions.saveTransactionId(trade.key));
        dispatch(gotoThunk({ routeName: 'wallet-trading-buy-detail' }));
    };

    const openSell = (trade: TradingTransactionSell) => {
        const { status, amountInCrypto, fiatCurrency, cryptoCurrency } = trade.data;
        const canResume =
            (status === 'SUBMITTED' || status === 'SEND_CRYPTO') && cryptoCurrency !== undefined;

        dispatch(tradingSellActions.saveTransactionId(trade.key));

        if (!canResume) {
            dispatch(gotoThunk({ routeName: 'wallet-trading-sell-detail' }));

            return;
        }

        dispatch(
            tradingSellActions.saveQuoteRequest({
                amountInCrypto: amountInCrypto ?? false,
                fiatCurrency: fiatCurrency ?? '',
                cryptoCurrency,
            }),
        );
        dispatch(tradingSellActions.setIsFromRedirect(true));
        dispatch(
            tradingActions.saveComposedTransactionInfo({
                selectedFee: 'normal',
                composed: { feePerByte: '', fee: '' },
            }),
        );
        dispatch(gotoThunk({ routeName: 'wallet-trading-sell-confirm' }));
    };

    const openExchange = (trade: TradingTransactionExchange) => {
        dispatch(tradingExchangeActions.saveTransactionId(trade.key));
        dispatch(gotoThunk({ routeName: 'wallet-trading-exchange-detail' }));
    };

    return (trade: TradingTransaction) => {
        switch (trade.tradeType) {
            case 'buy':
                return openBuy(trade);
            case 'sell':
                return openSell(trade);
            case 'exchange':
                return openExchange(trade);
            default:
                return exhaustive(trade);
        }
    };
};
