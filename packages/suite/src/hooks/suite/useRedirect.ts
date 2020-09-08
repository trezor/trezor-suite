import { Account } from '@wallet-types';
import { BuyTradeQuoteRequest } from 'invity-api';
import { useActions } from '@suite/hooks/suite';
import * as routerActions from '@suite-actions/routerActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';

export const useRedirect = () => {
    const { goto } = useActions({ goto: routerActions.goto });
    const { saveQuoteRequest, saveCachedAccountInfo, saveTransactionDetailId } = useActions({
        saveQuoteRequest: coinmarketBuyActions.saveQuoteRequest,
        saveCachedAccountInfo: coinmarketBuyActions.saveCachedAccountInfo,
        saveTransactionDetailId: coinmarketBuyActions.saveTransactionDetailId,
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

    const redirectWithQuotes = async (params: OfferRedirectParams) => {
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
        await saveCachedAccountInfo(symbol, index, accountType, true);
        goto('wallet-coinmarket-buy', { symbol, accountIndex: index, accountType });
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
        redirectWithQuotes,
        redirectToDetail,
    };
};
