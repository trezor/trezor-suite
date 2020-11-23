import { Account } from '@wallet-types';
import { BuyTradeQuoteRequest } from 'invity-api';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';

export const useCoinmarketBuyRedirect = () => {
    const { saveQuoteRequest, setIsFromRedirect, saveTransactionDetailId, goto } = useActions({
        saveQuoteRequest: coinmarketBuyActions.saveQuoteRequest,
        setIsFromRedirect: coinmarketBuyActions.setIsFromRedirect,
        saveTransactionDetailId: coinmarketBuyActions.saveTransactionDetailId,
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

    const redirectToOffers = async (params: OfferRedirectParams) => {
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
        await saveQuoteRequest(request);
        await setIsFromRedirect(true);
        goto('wallet-coinmarket-buy-offers', { symbol, accountIndex: index, accountType });
    };

    interface DetailRedirectParams {
        symbol: Account['symbol'];
        index: Account['index'];
        accountType: Account['accountType'];
        transactionId: string;
    }

    const redirectToDetail = async (params: DetailRedirectParams) => {
        const { transactionId } = params;

        await saveTransactionDetailId(transactionId);
        goto('wallet-coinmarket-buy-detail', {
            symbol: params.symbol,
            accountIndex: params.index,
            accountType: params.accountType,
        });
    };

    return {
        redirectToOffers,
        redirectToDetail,
    };
};
