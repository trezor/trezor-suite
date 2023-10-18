import { v4 as uuidv4 } from 'uuid';
import { desktopApi } from '@trezor/suite-desktop-api';
import { Account } from 'src/types/wallet';
import { AppState } from 'src/types/suite';
import { AmountLimits } from 'src/types/wallet/coinmarketCommonTypes';
import { BuyTrade, BuyTradeQuoteRequest, BuyTradeStatus } from 'invity-api';
import { invityApiSymbolToSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { isDesktop, getLocationOrigin } from '@trezor/env-utils';

// loop through quotes and if all quotes are either with error below minimum or over maximum, return the limits
export function getAmountLimits(
    request: BuyTradeQuoteRequest,
    quotes: BuyTrade[],
): AmountLimits | undefined {
    let minAmount: number | undefined;
    let maxAmount: number | undefined;
    // eslint-disable-next-line no-restricted-syntax
    for (const quote of quotes) {
        // if at least one quote succeeded do not return any message
        if (!quote.error) {
            return;
        }
        if (request.wantCrypto) {
            const amount = Number(quote.receiveStringAmount);
            if (quote.minCrypto && amount < quote.minCrypto) {
                minAmount = Math.min(minAmount || 1e28, quote.minCrypto);
            }
            if (quote.maxCrypto && amount > quote.maxCrypto) {
                maxAmount = Math.max(maxAmount || 0, quote.maxCrypto);
            }
        } else {
            const amount = Number(quote.fiatStringAmount);
            if (quote.minFiat && amount < quote.minFiat) {
                minAmount = Math.min(minAmount || 1e28, quote.minFiat);
            }
            if (quote.maxFiat && amount > quote.maxFiat) {
                maxAmount = Math.max(maxAmount || 0, quote.maxFiat);
            }
        }
    }
    if (minAmount) {
        if (!maxAmount) {
            return request.wantCrypto
                ? { currency: request.receiveCurrency, minCrypto: minAmount }
                : { currency: request.fiatCurrency, minFiat: minAmount };
        }
    } else if (maxAmount) {
        return request.wantCrypto
            ? { currency: request.receiveCurrency, maxCrypto: maxAmount }
            : { currency: request.fiatCurrency, maxFiat: maxAmount };
    }
}

// split the quotes to base and alternative and assign order and payment ids
export function processQuotes(allQuotes: BuyTrade[]): [BuyTrade[], BuyTrade[]] {
    if (!allQuotes) allQuotes = [];
    allQuotes.forEach(q => {
        q.orderId = uuidv4();
        if (!q.paymentId) {
            q.paymentId = uuidv4();
        }
    });
    const quotes = allQuotes.filter(q => !q.tags || !q.tags.includes('alternativeCurrency'));
    const alternativeQuotes = allQuotes.filter(
        q => q.tags && q.tags.includes('alternativeCurrency') && !q.error,
    );

    return [quotes, alternativeQuotes];
}

export const createQuoteLink = async (request: BuyTradeQuoteRequest, account: Account) => {
    const assetPrefix = process.env.ASSET_PREFIX || '';
    const locationOrigin = getLocationOrigin();
    let hash: string;

    if (request.wantCrypto) {
        hash = `qc/${request.country}/${request.fiatCurrency}/${request.cryptoStringAmount}/${request.receiveCurrency}`;
    } else {
        hash = `qf/${request.country}/${request.fiatCurrency}/${request.fiatStringAmount}/${request.receiveCurrency}`;
    }

    const params = `offers/${account.symbol}/${account.accountType}/${account.index}/${hash}`;

    if (isDesktop()) {
        const url = await desktopApi.getHttpReceiverAddress('/buy-redirect');
        return `${url}?p=${encodeURIComponent(`/coinmarket-redirect/${params}`)}`;
    }

    return `${locationOrigin}${assetPrefix}/coinmarket-redirect#${params}`;
};

export const createTxLink = async (trade: BuyTrade, account: Account) => {
    const locationOrigin = getLocationOrigin();
    const assetPrefix = process.env.ASSET_PREFIX || '';
    const params = `detail/${account.symbol}/${account.accountType}/${account.index}/${trade.paymentId}`;

    if (isDesktop()) {
        const url = await desktopApi.getHttpReceiverAddress('/buy-redirect');
        return `${url}?p=${encodeURIComponent(`/coinmarket-redirect/${params}`)}`;
    }

    return `${locationOrigin}${assetPrefix}/coinmarket-redirect#${params}`;
};

export const getStatusMessage = (status: BuyTradeStatus) => {
    switch (status) {
        case 'LOGIN_REQUEST':
        case 'APPROVAL_PENDING':
            return 'TR_BUY_STATUS_PENDING';
        case 'SUBMITTED':
            return 'TR_BUY_STATUS_PENDING_GO_TO_GATEWAY';
        case 'WAITING_FOR_USER':
            return 'TR_BUY_STATUS_ACTION_REQUIRED';
        case 'BLOCKED':
        case 'ERROR':
            return 'TR_BUY_STATUS_ERROR';
        case 'SUCCESS':
            return 'TR_BUY_STATUS_SUCCESS';
        default:
            return 'TR_BUY_STATUS_PENDING';
    }
};

export const getCryptoOptions = (
    symbol: Account['symbol'],
    networkType: Account['networkType'],
    supportedCoins: Set<string>,
    coinInfo: AppState['wallet']['coinmarket']['exchange']['exchangeCoinInfo'],
) => {
    const uppercaseSymbol = symbol.toUpperCase();
    const options: { value: string; label: string }[] = [
        { value: uppercaseSymbol, label: uppercaseSymbol },
    ];

    if (networkType === 'ethereum') {
        // cycle through all coins, locate ERC20 tokens and if it is in supportedCoins, add it as option
        coinInfo?.forEach(coin => {
            if (coin.category === 'Ethereum ERC20 tokens') {
                const ticker = coin.ticker.toLowerCase();
                if (ticker.toLowerCase() === 'usdt20') {
                    // temporary solution; invity-api renamed USDT20 => USDT and sends both codes (USDT and USDT20) to maintain backward compatibility with old versions of suite
                    return;
                }
                if (supportedCoins.has(ticker)) {
                    options.push({
                        label: invityApiSymbolToSymbol(ticker).toUpperCase(),
                        value: coin.ticker,
                    });
                }
            }
        });
    }

    return options;
};
