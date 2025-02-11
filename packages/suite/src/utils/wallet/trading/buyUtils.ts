import { BuyTrade, BuyTradeQuoteRequest, BuyTradeStatus } from 'invity-api';

import { getLocationOrigin, isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { Account } from 'src/types/wallet';

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
