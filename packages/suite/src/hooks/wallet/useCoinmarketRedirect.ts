import { Account } from 'src/types/wallet';
import { BuyTradeQuoteRequest, CryptoSymbol, SellFiatTradeQuoteRequest } from 'invity-api';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import * as coinmarketBuyActions from 'src/actions/wallet/coinmarketBuyActions';
import * as coinmarketSellActions from 'src/actions/wallet/coinmarketSellActions';
import { saveComposedTransactionInfo } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import { FeeLevel } from '@trezor/connect';

export interface OfferRedirectParams {
    symbol: Account['symbol'];
    index: Account['index'];
    accountType: Account['accountType'];
    wantCrypto: boolean;
    fiatCurrency: string;
    receiveCurrency: CryptoSymbol;
    amount: string;
    country: string;
}

export interface SellOfferRedirectParams {
    symbol: Account['symbol'];
    index: Account['index'];
    accountType: Account['accountType'];
    amountInCrypto: boolean;
    fiatCurrency: string;
    cryptoCurrency: CryptoSymbol;
    amount: string;
    country: string;
    orderId?: string;
    selectedFee?: FeeLevel['label'];
    feePerByte?: string;
    feeLimit?: string;
}

export interface DetailRedirectParams {
    symbol: Account['symbol'];
    index: Account['index'];
    accountType: Account['accountType'];
    transactionId: string;
}

export const useCoinmarketRedirect = () => {
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
        dispatch(coinmarketBuyActions.saveQuoteRequest(request));
        dispatch(coinmarketBuyActions.setIsFromRedirect(true));
        dispatch(
            goto('wallet-coinmarket-buy-offers', {
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
        dispatch(coinmarketSellActions.saveQuoteRequest(request));
        dispatch(coinmarketSellActions.setIsFromRedirect(true));
        const composed = {
            feeLimit,
            feePerByte: feePerByte || '',
            fee: '', // fee is not passed by redirect, will be recalculated
        };
        dispatch(saveComposedTransactionInfo({ selectedFee: selectedFee || 'normal', composed }));
        dispatch(coinmarketSellActions.saveTransactionId(orderId));
        dispatch(
            goto('wallet-coinmarket-sell-offers', {
                params: { symbol, accountIndex: index, accountType },
            }),
        );
    };

    const redirectToDetail = (params: DetailRedirectParams) => {
        const { transactionId } = params;

        dispatch(coinmarketBuyActions.saveTransactionDetailId(transactionId));
        dispatch(
            goto('wallet-coinmarket-buy-detail', {
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
    };
};
