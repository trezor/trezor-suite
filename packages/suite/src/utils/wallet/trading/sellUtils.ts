import { type SellFiatTradeQuoteRequest } from 'invity-api';

import { type DesktopApiDep } from '@suite/desktop-app-api';
import { type TradingComposedTransactionInfo } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { getLocationOrigin, isDesktop } from '@trezor/env-utils';

import { getRedirectFeeHash } from '#src/utils/wallet/trading/tradingUtils';

export const createQuoteLink = async (
    { desktopApi }: DesktopApiDep<'getHttpReceiverAddress'>,
    request: SellFiatTradeQuoteRequest,
    account: Account,
    composedInfo: TradingComposedTransactionInfo,
    orderId?: string,
): Promise<string> => {
    const assetPrefix = process.env.ASSET_PREFIX || '';
    const locationOrigin = getLocationOrigin();
    let hash: string;

    if (request.amountInCrypto) {
        hash = `qc/${request.country}/${request.fiatCurrency}/${request.cryptoStringAmount}/${request.cryptoCurrency}/${request.paymentMethod}`;
    } else {
        hash = `qf/${request.country}/${request.fiatCurrency}/${request.fiatStringAmount}/${request.cryptoCurrency}/${request.paymentMethod}`;
    }
    if (orderId) {
        hash = `p-${hash}/${orderId}`;
    }

    hash += getRedirectFeeHash(account.networkType, composedInfo);

    const params = `sell-offers/${account.symbol}/${account.accountType}/${account.index}/${hash}`;

    if (isDesktop()) {
        const url = await desktopApi.getHttpReceiverAddress('/sell-redirect');

        return `${url}?p=${encodeURIComponent(`/coinmarket-redirect/${params}`)}`;
    }

    return `${locationOrigin}${assetPrefix}/coinmarket-redirect#${params}`;
};
