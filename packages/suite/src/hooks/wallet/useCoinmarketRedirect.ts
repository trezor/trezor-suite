import { Account } from '@wallet-types';
import { BuyTradeQuoteRequest, SellFiatTradeQuoteRequest } from 'invity-api';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import * as coinmarketSellActions from '@wallet-actions/coinmarketSellActions';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import { FeeLevel } from 'trezor-connect';

export const useCoinmarketRedirect = () => {
    const {
        saveBuyQuoteRequest,
        setBuyIsFromRedirect,
        saveBuyTransactionDetailId,
        saveSellQuoteRequest,
        setSellIsFromRedirect,
        saveComposedTransactionInfo,
        goto,
    } = useActions({
        saveBuyQuoteRequest: coinmarketBuyActions.saveQuoteRequest,
        setBuyIsFromRedirect: coinmarketBuyActions.setIsFromRedirect,
        saveBuyTransactionDetailId: coinmarketBuyActions.saveTransactionDetailId,
        saveSellQuoteRequest: coinmarketSellActions.saveQuoteRequest,
        setSellIsFromRedirect: coinmarketSellActions.setIsFromRedirect,
        saveComposedTransactionInfo: coinmarketCommonActions.saveComposedTransactionInfo,
        goto: routerActions.goto,
    });

    interface OfferRedirectParams {
        symbol: Account['symbol'];
        index: Account['index'];
        accountType: Account['accountType'];
        wantCrypto: boolean;
        fiatCurrency: string;
        receiveCurrency: string;
        amount: string;
        country: string;
    }

    interface SellOfferRedirectParams {
        symbol: Account['symbol'];
        index: Account['index'];
        accountType: Account['accountType'];
        amountInCrypto: boolean;
        fiatCurrency: string;
        cryptoCurrency: string;
        amount: string;
        country: string;
        selectedFee?: FeeLevel['label'];
        feePerByte?: string;
        feeLimit?: string;
    }

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
        saveBuyQuoteRequest(request);
        setBuyIsFromRedirect(true);
        goto('wallet-coinmarket-buy-offers', { symbol, accountIndex: index, accountType });
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
        saveSellQuoteRequest(request);
        setSellIsFromRedirect(true);
        const composed = {
            feeLimit,
            feePerByte: feePerByte || '',
            fee: '', // fee is not passed by redirect, will be recalculated
        };
        saveComposedTransactionInfo({ selectedFee: selectedFee || 'normal', composed });
        goto('wallet-coinmarket-sell-offers', { symbol, accountIndex: index, accountType });
    };

    interface DetailRedirectParams {
        symbol: Account['symbol'];
        index: Account['index'];
        accountType: Account['accountType'];
        transactionId: string;
    }

    const redirectToDetail = (params: DetailRedirectParams) => {
        const { transactionId } = params;

        saveBuyTransactionDetailId(transactionId);
        goto('wallet-coinmarket-buy-detail', {
            symbol: params.symbol,
            accountIndex: params.index,
            accountType: params.accountType,
        });
    };

    return {
        redirectToOffers,
        redirectToDetail,
        redirectToSellOffers,
    };
};
