import { type BuyTrade, type BuyTradeQuoteRequest } from 'invity-api';

import { type DesktopApiDep } from '@suite/desktop-app-api';
import { getLocationOrigin, isDesktop } from '@trezor/env-utils';

import { type Account } from 'src/types/wallet';

export const createQuoteLink = async (
    { desktopApi }: DesktopApiDep<'getHttpReceiverAddress'>,
    request: BuyTradeQuoteRequest,
    account: Account,
): Promise<string> => {
    const assetPrefix = process.env.ASSET_PREFIX || '';
    const locationOrigin = getLocationOrigin();
    let hash: string;

    if (request.wantCrypto) {
        hash = `qc/${request.country}/${request.fiatCurrency}/${request.cryptoStringAmount}/${request.receiveCurrency}/${request.paymentMethod}`;
    } else {
        hash = `qf/${request.country}/${request.fiatCurrency}/${request.fiatStringAmount}/${request.receiveCurrency}/${request.paymentMethod}`;
    }

    const params = `offers/${account.symbol}/${account.accountType}/${account.index}/${hash}`;

    if (isDesktop()) {
        const url = await desktopApi.getHttpReceiverAddress('/buy-redirect');

        return `${url}?p=${encodeURIComponent(`/coinmarket-redirect/${params}`)}`;
    }

    return `${locationOrigin}${assetPrefix}/coinmarket-redirect#${params}`;
};

export const createTxLink = async (
    { desktopApi }: DesktopApiDep<'getHttpReceiverAddress'>,
    trade: BuyTrade,
    account: Account,
): Promise<string> => {
    const locationOrigin = getLocationOrigin();
    const assetPrefix = process.env.ASSET_PREFIX || '';
    const params = `detail/${account.symbol}/${account.accountType}/${account.index}/${trade.paymentId}`;

    if (isDesktop()) {
        const url = await desktopApi.getHttpReceiverAddress('/buy-redirect');

        return `${url}?p=${encodeURIComponent(`/coinmarket-redirect/${params}`)}`;
    }

    return `${locationOrigin}${assetPrefix}/coinmarket-redirect#${params}`;
};
