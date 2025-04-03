import { CryptoId, ExchangeTradeQuoteRequest, ExchangeTradeStatus } from 'invity-api';

import { getLocationOrigin, isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import {
    FORM_DEFAULT_CRYPTO_CURRENCY,
    FORM_DEFAULT_CRYPTO_SECONDARY_CURRENCY,
} from 'src/constants/wallet/trading/form';
import { ComposedTransactionInfo } from 'src/reducers/wallet/tradingReducer';
import { Account } from 'src/types/wallet';

export const createQuoteLink = async (
    request: ExchangeTradeQuoteRequest,
    account: Account,
    composedInfo: ComposedTransactionInfo,
    orderId: string,
) => {
    const assetPrefix = process.env.ASSET_PREFIX || '';
    const locationOrigin = getLocationOrigin();
    let hash = `${request.send}/${request.receive}/${request.sendStringAmount}/${orderId}`;

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

    const params = `exchange-offers/${account.symbol}/${account.accountType}/${account.index}/${hash}`;

    if (isDesktop()) {
        const url = await desktopApi.getHttpReceiverAddress('/exchange-redirect');

        return `${url}?p=${encodeURIComponent(`/coinmarket-redirect/${params}`)}`;
    }

    return `${locationOrigin}${assetPrefix}/coinmarket-redirect#${params}`;
};

export const getStatusMessage = (status: ExchangeTradeStatus) => {
    switch (status) {
        case 'ERROR':
            return 'TR_EXCHANGE_STATUS_ERROR';
        case 'SUCCESS':
            return 'TR_EXCHANGE_STATUS_SUCCESS';
        case 'KYC':
            return 'TR_EXCHANGE_STATUS_KYC';
        case 'CONVERTING':
            return 'TR_EXCHANGE_STATUS_CONVERTING';
        default:
            return 'TR_EXCHANGE_STATUS_CONFIRMING';
    }
};

export const tradingGetExchangeReceiveCryptoId = (
    sendCryptoId: CryptoId | undefined,
    receiveCryptoId?: CryptoId | undefined,
): CryptoId => {
    const getReceivedDefaultCryptoId = (cryptoId: CryptoId | undefined) => {
        if (cryptoId === FORM_DEFAULT_CRYPTO_CURRENCY)
            return FORM_DEFAULT_CRYPTO_SECONDARY_CURRENCY as CryptoId;

        return FORM_DEFAULT_CRYPTO_CURRENCY as CryptoId;
    };

    if (sendCryptoId === receiveCryptoId) return getReceivedDefaultCryptoId(receiveCryptoId);
    if (receiveCryptoId) return receiveCryptoId;

    return getReceivedDefaultCryptoId(sendCryptoId);
};
