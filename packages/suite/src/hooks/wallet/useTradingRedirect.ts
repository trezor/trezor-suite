import {
    BuyCryptoPaymentMethod,
    BuyTradeQuoteRequest,
    CryptoId,
    ExchangeTradeQuoteRequest,
    SellCryptoPaymentMethod,
    SellFiatTradeQuoteRequest,
} from 'invity-api';

import {
    parseCryptoId,
    tradingActions,
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { FeeLevel, TokenInfo } from '@trezor/connect';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
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

const getTokenInfo = (cryptoId: CryptoId): TokenInfo | undefined => {
    const { contractAddress } = parseCryptoId(cryptoId);

    if (!contractAddress) return;

    return {
        contract: contractAddress,
    } as TokenInfo;
};

const findAccountKey = (
    accounts: Account[],
    params: Pick<Account, 'symbol' | 'index' | 'accountType'>,
) =>
    accounts.find(
        a =>
            a.symbol === params.symbol &&
            a.index === params.index &&
            a.accountType === params.accountType,
    )?.key;

export const useTradingRedirect = () => {
    const dispatch = useDispatch();
    const accounts = useSelector(selectAccounts);

    const prefilledAccountFromRedirect = (
        params: Pick<Account, 'symbol' | 'index' | 'accountType'>,
    ) => {
        const key = findAccountKey(accounts, params);
        if (key) {
            dispatch(tradingActions.setTradingFromPrefilledAccount({ key, cryptoId: undefined }));
        }
    };

    const redirectToBuyOffers = (params: BuyOfferRedirectParams) => {
        const { wantCrypto, fiatCurrency, receiveCurrency, amount, country, paymentMethod } =
            params;
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
        prefilledAccountFromRedirect(params);
        dispatch(tradingBuyActions.saveQuoteRequest(request));
        dispatch(tradingBuyActions.setIsFromRedirect(true));
        dispatch(goto('wallet-trading-buy-offers'));
    };

    const redirectToSellOffers = (params: SellOfferRedirectParams) => {
        const {
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
        const token = getTokenInfo(cryptoCurrency);

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
        prefilledAccountFromRedirect(params);
        dispatch(tradingSellActions.saveQuoteRequest(request));
        dispatch(tradingSellActions.setIsFromRedirect(true));
        const composed = {
            feeLimit,
            feePerByte: feePerByte || '',
            fee: '', // fee is not passed by redirect, will be recalculated
            maxFeePerGas,
            maxPriorityFeePerGas,
            token,
        };
        dispatch(
            tradingActions.saveComposedTransactionInfo({
                selectedFee: selectedFee || 'normal',
                composed,
            }),
        );
        dispatch(tradingSellActions.saveTransactionId(orderId));
        dispatch(goto(orderId ? 'wallet-trading-sell-confirm' : 'wallet-trading-sell-offers'));
    };

    const redirectToExchangeOffers = (params: ExchangeOfferRedirectParams) => {
        const {
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
        const token = getTokenInfo(send);

        const composed = {
            feeLimit,
            feePerByte: feePerByte || '',
            fee: '', // fee is not passed by redirect, will be recalculated
            maxFeePerGas,
            maxPriorityFeePerGas,
            token,
        };

        prefilledAccountFromRedirect(params);
        dispatch(tradingExchangeActions.saveQuoteRequest(request));
        dispatch(tradingExchangeActions.setIsFromRedirect(true));
        dispatch(
            tradingActions.saveComposedTransactionInfo({
                selectedFee: selectedFee || 'normal',
                composed,
            }),
        );
        dispatch(tradingExchangeActions.saveTransactionId(orderId));
        dispatch(goto('wallet-trading-exchange-confirm'));
    };

    const redirectToBuyDetail = (params: DetailRedirectParams) => {
        const { transactionId } = params;

        prefilledAccountFromRedirect(params);
        dispatch(tradingBuyActions.saveTransactionId(transactionId));
        dispatch(goto('wallet-trading-buy-detail'));
    };

    return {
        redirectToBuyOffers,
        redirectToBuyDetail,
        redirectToSellOffers,
        redirectToExchangeOffers,
    };
};
