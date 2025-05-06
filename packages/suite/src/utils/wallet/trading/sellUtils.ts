import { SellFiatTradeQuoteRequest } from 'invity-api';

import { TradingComposedTransactionInfo } from '@suite-common/trading';
import { getLocationOrigin, isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { Account } from 'src/types/wallet';

export const createQuoteLink = async (
    request: SellFiatTradeQuoteRequest,
    account: Account,
    composedInfo: TradingComposedTransactionInfo,
    orderId?: string,
) => {
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
    if (composedInfo.selectedFee && composedInfo.selectedFee !== 'normal') {
        hash += `/${composedInfo.selectedFee}`;
        if (composedInfo.selectedFee === 'custom') {
            hash += `/${composedInfo.composed?.feePerByte}`;
            hash += `/${composedInfo.composed?.maxFeePerGas}`;
            hash += `/${composedInfo.composed?.maxPriorityFeePerGas}`;
            if (composedInfo.composed?.feeLimit) {
                hash += `/${composedInfo.composed?.feeLimit}`;
            }
        }
    }

    const params = `sell-offers/${account.symbol}/${account.accountType}/${account.index}/${hash}`;

    if (isDesktop()) {
        const url = await desktopApi.getHttpReceiverAddress('/sell-redirect');

        return `${url}?p=${encodeURIComponent(`/coinmarket-redirect/${params}`)}`;
    }

    return `${locationOrigin}${assetPrefix}/coinmarket-redirect#${params}`;
};
