import { v4 as uuidv4 } from 'uuid';
import { Account } from '@wallet-types';
import { AmountLimits } from '@wallet-types/coinmarketBuyForm';
import { BuyTrade, BuyTradeQuoteRequest, BuyTradeFormResponse } from 'invity-api';
import { Trade } from '@wallet-reducers/coinmarketReducer';
import { symbolToInvityApiSymbol } from '@wallet-utils/coinmarket/coinmarketUtils';
import { isDesktop } from '@suite-utils/env';

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
        q.paymentId = uuidv4();
    });
    const quotes = allQuotes.filter(q => !q.tags || !q.tags.includes('alternativeCurrency'));
    const alternativeQuotes = allQuotes.filter(
        q => q.tags && q.tags.includes('alternativeCurrency') && !q.error,
    );

    return [quotes, alternativeQuotes];
}

export const getAccountInfo = (account: Account) => {
    switch (account.networkType) {
        case 'bitcoin': {
            const firstUnused = account.addresses?.unused[0];
            if (firstUnused) {
                return { address: firstUnused.address, path: firstUnused.path };
            }

            return { address: undefined, path: undefined };
        }
        case 'ripple':
        case 'ethereum': {
            return {
                address: account.descriptor,
                path: account.path,
            };
        }
        // no default
    }
};

export function createQuoteLink(request: BuyTradeQuoteRequest, account: Account): string {
    const assetPrefix = process.env.assetPrefix || '';
    let hash: string;

    if (request.wantCrypto) {
        hash = `qc/${request.country}/${request.fiatCurrency}/${request.cryptoStringAmount}/${request.receiveCurrency}`;
    } else {
        hash = `qf/${request.country}/${request.fiatCurrency}/${request.fiatStringAmount}/${request.receiveCurrency}`;
    }

    const params = `offers/${account.symbol}/${account.accountType}/${account.index}/${hash}`;

    if (isDesktop()) {
        // TEMP: for desktop. but this solution is temporary, local http server will be used later to accept callback
        return `https://wallet.trezor.io/buy_receiver.html#/coinmarket-redirect/${params}`;
    }

    return `${window.location.origin}${assetPrefix}/coinmarket-redirect#${params}`;
}

export function createTxLink(trade: BuyTrade, account: Account): string {
    const assetPrefix = process.env.assetPrefix || '';
    const params = `detail/${account.symbol}/${account.accountType}/${account.index}/${trade.paymentId}`;
    if (isDesktop()) {
        // TEMP: for desktop. but this solution is temporary, local http server will be used later to accept callback
        return `https://wallet.trezor.io/buy_receiver.html#/coinmarket-redirect/${params}`;
    }

    return `${window.location.origin}${assetPrefix}/coinmarket-redirect#${params}`;
}

function addHiddenFieldToForm(form: any, fieldName: string, fieldValue: any) {
    const hiddenField = document.createElement('input');
    hiddenField.type = 'hidden';
    hiddenField.name = fieldName;
    hiddenField.value = fieldValue;
    form.appendChild(hiddenField);
}

export function submitRequestForm(tradeForm: BuyTradeFormResponse): void {
    const invityWindowName = 'invity-buy-partner-window';
    if (!tradeForm || !tradeForm.form) return;
    // for IFRAME there is nothing to submit
    if (tradeForm.form.formMethod === 'IFRAME') return;
    const windowType = isDesktop() ? invityWindowName : '_self';
    const form = document.createElement('form');
    if (tradeForm.form.formMethod === 'GET' && tradeForm.form.formAction) {
        window.open(tradeForm.form.formAction, windowType);
        return;
    }

    form.method = tradeForm.form.formMethod;
    form.action = tradeForm.form.formAction;
    const { fields } = tradeForm.form;
    Object.keys(fields).forEach(k => {
        addHiddenFieldToForm(form, k, fields[k]);
    });

    if (isDesktop()) {
        const formWindow = window.open('', invityWindowName);
        if (formWindow) {
            formWindow.document.body.appendChild(form);
            form.submit();
        }
    } else {
        if (!document.body) return;
        document.body.appendChild(form);
        form.submit();
    }
}

export const getStatusMessage = (status: Trade['data']['status']) => {
    switch (status) {
        case 'LOGIN_REQUEST':
        case 'APPROVAL_PENDING':
            return 'TR_BUY_STATUS_PENDING';
        case 'SUBMITTED':
            return 'TR_BUY_STATUS_PENDING_GO_TO_GATEWAY';
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
) => {
    const supportedTokens = ['usdt', 'dai', 'gusd'];
    const uppercaseSymbol = symbol.toUpperCase();
    const options: { value: string; label: string }[] = [
        { value: uppercaseSymbol, label: uppercaseSymbol },
    ];

    if (networkType === 'ethereum') {
        supportedTokens.forEach(token => {
            options.push({
                label: token.toUpperCase(),
                value: symbolToInvityApiSymbol(token).toUpperCase(),
            });
        });
    }

    return options;
};

export const getCountryLabelParts = (label: string) => {
    try {
        const parts = label.split(' ');
        if (parts.length === 1) {
            return {
                flag: '',
                text: label,
            };
        }
        const flag = parts[0];
        parts.shift();
        const text = parts.join(' ');
        return { flag, text };
    } catch (err) {
        return null;
    }
};
