import { type ExchangeTradeQuoteRequest } from 'invity-api';

import { type DesktopApiDep } from '@suite/desktop-app-api';
import { type TradingComposedTransactionInfo } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { getLocationOrigin, isDesktop } from '@trezor/env-utils';

import { getRedirectFeeHash } from '#src/utils/wallet/trading/tradingUtils';

export const createQuoteLink = async (
    { desktopApi }: DesktopApiDep<'getHttpReceiverAddress'>,
    request: ExchangeTradeQuoteRequest,
    account: Account,
    composedInfo: TradingComposedTransactionInfo,
    orderId: string,
): Promise<string> => {
    const assetPrefix = process.env.ASSET_PREFIX || '';
    const locationOrigin = getLocationOrigin();
    let hash = `${request.send}/${request.receive}/${request.sendStringAmount}/${orderId}`;

    hash += getRedirectFeeHash(account.networkType, composedInfo);

    const params = `exchange-offers/${account.symbol}/${account.accountType}/${account.index}/${hash}`;

    if (isDesktop()) {
        const url = await desktopApi.getHttpReceiverAddress('/exchange-redirect');

        return `${url}?p=${encodeURIComponent(`/coinmarket-redirect/${params}`)}`;
    }

    return `${locationOrigin}${assetPrefix}/coinmarket-redirect#${params}`;
};
