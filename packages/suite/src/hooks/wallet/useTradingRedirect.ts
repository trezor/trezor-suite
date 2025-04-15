import {
    BuyCryptoPaymentMethod,
    BuyTradeQuoteRequest,
    CryptoId,
    ExchangeTradeQuoteRequest,
    SellCryptoPaymentMethod,
    SellFiatTradeQuoteRequest,
} from 'invity-api';

import { tradingActions, tradingBuyActions, tradingExchangeActions } from '@suite-common/trading';
import { FeeLevel } from '@trezor/connect';

import { goto } from 'src/actions/suite/routerActions';
import { saveComposedTransactionInfo } from 'src/actions/wallet/trading/tradingCommonActions';
import * as tradingSellActions from 'src/actions/wallet/tradingSellActions';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';

interface BuyOfferRedirectParams {
    symbol: Account['symbol'];
    index: Account['index'];
    accountType: Account['accountType'];
    wantCrypto: boolean;
    fiatCurrency: string;
    receiveCurrency: CryptoId;
    amount: string;
    country: string;
    paymentMethod: BuyCryptoPaymentMethod;
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
    paymentMethod: SellCryptoPaymentMethod;
    orderId?: string;
    selectedFee?: FeeLevel['label'];
    feePerByte?: string;
    feeLimit?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
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
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
}

interface DetailRedirectParams {
    symbol: Account['symbol'];
    index: Account['index'];
    accountType: Account['accountType'];
    transactionId: string;
}

export const useTradingRedirect = () => {
    const dispatch = useDispatch();

    const redirectToBuyOffers = (params: BuyOfferRedirectParams) => {
        const {
            symbol,
            index,
            accountType,
            wantCrypto,
            fiatCurrency,
            receiveCurrency,
            amount,
            country,
            paymentMethod,
        } = params;
        let request: BuyTradeQuoteRequest;
        const commonParams = { fiatCurrency, receiveCurrency, country, paymentMethod };

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
            goto('wallet-trading-buy-offers', {
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
            paymentMethod,
            orderId,
            feeLimit,
            feePerByte,
            selectedFee,
            maxFeePerGas,
            maxPriorityFeePerGas,
        } = params;
        let request: SellFiatTradeQuoteRequest;
        const commonParams = { fiatCurrency, cryptoCurrency, country, paymentMethod };

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
            maxFeePerGas,
            maxPriorityFeePerGas,
        };
        dispatch(saveComposedTransactionInfo({ selectedFee: selectedFee || 'normal', composed }));
        dispatch(tradingSellActions.saveTransactionId(orderId));
        dispatch(
            goto(orderId ? 'wallet-trading-sell-confirm' : 'wallet-trading-sell-offers', {
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
            maxFeePerGas,
            maxPriorityFeePerGas,
            selectedFee,
        } = params;
        const request: ExchangeTradeQuoteRequest = {
            send,
            receive,
            sendStringAmount: amount,
        };
        const composed = {
            feeLimit,
            feePerByte: feePerByte || '',
            fee: '', // fee is not passed by redirect, will be recalculated
            maxFeePerGas,
            maxPriorityFeePerGas,
        };

        dispatch(tradingExchangeActions.saveQuoteRequest(request));
        dispatch(tradingExchangeActions.setIsFromRedirect(true));
        dispatch(
            tradingActions.saveComposedTransactionInfo({
                selectedFee: selectedFee || 'normal',
                composed,
            }),
        );
        dispatch(tradingExchangeActions.saveTransactionId(orderId));
        dispatch(
            goto('wallet-trading-exchange-confirm', {
                params: { symbol, accountIndex: index, accountType },
            }),
        );
    };

    const redirectToBuyDetail = (params: DetailRedirectParams) => {
        const { transactionId } = params;

        dispatch(tradingBuyActions.saveTransactionId(transactionId));
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
        redirectToBuyOffers,
        redirectToBuyDetail,
        redirectToSellOffers,
        redirectToExchangeOffers,
    };
};
