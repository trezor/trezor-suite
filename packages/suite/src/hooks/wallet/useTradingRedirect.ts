import {
    BuyTradeQuoteRequest,
    CryptoId,
    ExchangeTradeQuoteRequest,
    SellFiatTradeQuoteRequest,
} from 'invity-api';

import { FeeLevel } from '@trezor/connect';

import { Account } from 'src/types/wallet';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import * as tradingBuyActions from 'src/actions/wallet/tradingBuyActions';
import * as tradingSellActions from 'src/actions/wallet/tradingSellActions';
import * as tradingExchangeActions from 'src/actions/wallet/tradingExchangeActions';
import { saveComposedTransactionInfo } from 'src/actions/wallet/trading/tradingCommonActions';

interface OfferRedirectParams {
    symbol: Account['symbol'];
    index: Account['index'];
    accountType: Account['accountType'];
    wantCrypto: boolean;
    fiatCurrency: string;
    receiveCurrency: CryptoId;
    amount: string;
    country: string;
}

interface SellOfferRedirectParams {
    symbol: Account['symbol'];
    index: Account['index'];
    accountType: Account['accountType'];
    amountInCrypto: boolean;
    fiatCurrency: string;
    cryptoCurrency: CryptoId;
    amount: string;
    country: string;
    orderId?: string;
    selectedFee?: FeeLevel['label'];
    feePerByte?: string;
    feeLimit?: string;
}

interface ExchangeOfferRedirectParams {
    symbol: Account['symbol'];
    index: Account['index'];
    accountType: Account['accountType'];
    send: CryptoId;
    receive: CryptoId;
    amount: string;
    orderId: string;
    selectedFee?: FeeLevel['label'];
    feePerByte?: string;
    feeLimit?: string;
}

interface DetailRedirectParams {
    symbol: Account['symbol'];
    index: Account['index'];
    accountType: Account['accountType'];
    transactionId: string;
}

export const useTradingRedirect = () => {
    const dispatch = useDispatch();

    const redirectToOffers = (params: OfferRedirectParams) => {
        const {
            symbol,
            index,
            accountType,
            wantCrypto,
            fiatCurrency,
            receiveCurrency,
            amount,
            country,
        } = params;
        let request: BuyTradeQuoteRequest;
        const commonParams = { fiatCurrency, receiveCurrency, country };

        if (wantCrypto) {
            request = {
                ...commonParams,
                wantCrypto,
                cryptoStringAmount: amount,
            };
        } else {
            request = {
                ...commonParams,
                wantCrypto,
                fiatStringAmount: amount,
            };
        }
        dispatch(tradingBuyActions.saveQuoteRequest(request));
        dispatch(tradingBuyActions.setIsFromRedirect(true));
        dispatch(
            goto('wallet-trading-buy-confirm', {
                params: { symbol, accountIndex: index, accountType },
            }),
        );
    };

    const redirectToSellOffers = (params: SellOfferRedirectParams) => {
        const {
            symbol,
            index,
            accountType,
            amountInCrypto,
            fiatCurrency,
            cryptoCurrency,
            amount,
            country,
            orderId,
            feeLimit,
            feePerByte,
            selectedFee,
        } = params;
        let request: SellFiatTradeQuoteRequest;
        const commonParams = { fiatCurrency, cryptoCurrency, country };

        if (amountInCrypto) {
            request = {
                ...commonParams,
                amountInCrypto,
                cryptoStringAmount: amount,
            };
        } else {
            request = {
                ...commonParams,
                amountInCrypto,
                fiatStringAmount: amount,
            };
        }
        dispatch(tradingSellActions.saveQuoteRequest(request));
        dispatch(tradingSellActions.setIsFromRedirect(true));
        const composed = {
            feeLimit,
            feePerByte: feePerByte || '',
            fee: '', // fee is not passed by redirect, will be recalculated
        };
        dispatch(saveComposedTransactionInfo({ selectedFee: selectedFee || 'normal', composed }));
        dispatch(tradingSellActions.saveTransactionId(orderId));
        dispatch(
            goto('wallet-trading-sell-confirm', {
                params: { symbol, accountIndex: index, accountType },
            }),
        );
    };

    const redirectToExchangeOffers = (params: ExchangeOfferRedirectParams) => {
        const {
            symbol,
            index,
            accountType,
            send,
            receive,
            amount,
            orderId,
            feeLimit,
            feePerByte,
            selectedFee,
        } = params;
        const request: ExchangeTradeQuoteRequest = {
            send,
            receive,
            sendStringAmount: amount,
        };

        dispatch(tradingExchangeActions.saveQuoteRequest(request));
        dispatch(tradingExchangeActions.setIsFromRedirect(true));
        const composed = {
            feeLimit,
            feePerByte: feePerByte || '',
            fee: '', // fee is not passed by redirect, will be recalculated
        };
        dispatch(saveComposedTransactionInfo({ selectedFee: selectedFee || 'normal', composed }));
        dispatch(tradingExchangeActions.saveTransactionId(orderId));
        dispatch(
            goto('wallet-trading-exchange-confirm', {
                params: { symbol, accountIndex: index, accountType },
            }),
        );
    };

    const redirectToDetail = (params: DetailRedirectParams) => {
        const { transactionId } = params;

        dispatch(tradingBuyActions.saveTransactionDetailId(transactionId));
        dispatch(
            goto('wallet-trading-buy-detail', {
                params: {
                    symbol: params.symbol,
                    accountIndex: params.index,
                    accountType: params.accountType,
                },
            }),
        );
    };

    return {
        redirectToOffers,
        redirectToDetail,
        redirectToSellOffers,
        redirectToExchangeOffers,
    };
};
