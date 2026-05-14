import {
    type ExchangeProviderInfo,
    type ExchangeTradeSigned,
    type SellFiatTradeSigned,
    type SellProviderInfo,
} from 'invity-api';

import type { Network } from '@suite-common/wallet-config';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import { type PROTO } from '@trezor/connect';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- TODO: extract pathUtils to a shared location and remove this exception (see #27376 deferred work)
import { validatePath } from '@trezor/connect/src/utils/pathUtils';
import { BigNumber, formatBigUintToLE } from '@trezor/utils';

import { cryptoIdToNetworkAndContractAddress } from '../../utils';

export const formatSlip24SendAmountByNetwork = ({
    value,
    network,
}: {
    value: string | number;
    network: Network;
}): string => {
    // SLIP-24: 8 bytes for Bitcoin-like coins and 32 bytes for EVM assets
    const bytesLength = network.networkType === 'ethereum' ? 32 : 8;

    return formatBigUintToLE({
        value: new BigNumber(value),
        bytesLength,
    });
};

type TradingExchangeCreatePaymentRequestProps = {
    trade: ExchangeTradeSigned;
    provider: ExchangeProviderInfo;
    macRefund: string;
    pathRefund: string;
    macPurchase: string;
    pathPurchase: string;
    nonce: string;
    receiveSlip44: number;
    receiveDisplaySymbol: string;
    sendStringAmount: string;
    sendTokenDecimals?: number;
};

export const tradingExchangeCreatePaymentRequest = ({
    trade,
    provider,
    macPurchase,
    pathPurchase,
    macRefund,
    pathRefund,
    nonce,
    receiveSlip44,
    receiveDisplaySymbol,
    sendStringAmount,
    sendTokenDecimals,
}: TradingExchangeCreatePaymentRequestProps): PROTO.PaymentRequest | undefined => {
    if (
        !provider?.companyName ||
        !trade.send ||
        !trade.receive ||
        !trade.receiveStringAmount ||
        !trade.receiveAddress ||
        !trade.refundAddress ||
        !sendStringAmount
    ) {
        return undefined;
    }

    const sendNetworkData = cryptoIdToNetworkAndContractAddress(trade.send);
    const sendNetworkSymbol = sendNetworkData.network?.symbol ?? 'btc';
    if (!sendNetworkData.network) {
        return undefined;
    }

    // Decimal subunits (satoshis, wei, ...). `@trezor/connect` encodes to SLIP-24 bytes.
    const sendAmount = unitsToSubunits({
        value: asAmountUnit(new BigNumber(sendStringAmount)),
        symbol: sendNetworkSymbol,
        ...(sendTokenDecimals !== undefined ? { decimals: sendTokenDecimals } : undefined),
    }).toString();

    const receiveAmount = `${trade.receiveStringAmount} ${receiveDisplaySymbol}`;

    const memos: PROTO.PaymentRequestMemo[] = [
        {
            coin_purchase_memo: {
                address: trade.receiveAddress,
                amount: receiveAmount,
                coin_type: receiveSlip44,
                mac: macPurchase,
                address_n: validatePath(pathPurchase),
            },
        },
        {
            refund_memo: {
                address: trade.refundAddress,
                mac: macRefund,
                address_n: validatePath(pathRefund),
            },
        },
    ];

    return {
        recipient_name: provider.companyName,
        nonce,
        amount: sendAmount,
        memos,
        signature: trade.tradeSignature,
    };
};

type TradingSellCreatePaymentRequestProps = {
    trade: SellFiatTradeSigned;
    provider: SellProviderInfo;
    macRefund: string;
    pathRefund: string;
    nonce: string;
    memoText: string;
    sendStringAmount: string;
    sendTokenDecimals?: number;
};

export const tradingSellCreatePaymentRequest = ({
    trade,
    provider,
    macRefund,
    pathRefund,
    nonce,
    memoText,
    sendStringAmount,
    sendTokenDecimals,
}: TradingSellCreatePaymentRequestProps): PROTO.PaymentRequest | undefined => {
    if (
        !provider?.companyName ||
        !trade.refundAddress ||
        !trade.tradeSignature ||
        !trade.cryptoStringAmount ||
        !trade.cryptoCurrency ||
        !sendStringAmount
    ) {
        return undefined;
    }

    const sendNetworkData = cryptoIdToNetworkAndContractAddress(trade.cryptoCurrency);
    const sendNetworkSymbol = sendNetworkData.network?.symbol ?? 'btc';
    if (!sendNetworkData.network) {
        return undefined;
    }

    // Decimal subunits (satoshis, wei, ...). `@trezor/connect` encodes to SLIP-24 bytes.
    const sendAmount = unitsToSubunits({
        value: asAmountUnit(new BigNumber(sendStringAmount)),
        symbol: sendNetworkSymbol,
        ...(sendTokenDecimals !== undefined ? { decimals: sendTokenDecimals } : undefined),
    }).toString();

    const memos: PROTO.PaymentRequestMemo[] = [
        {
            text_memo: {
                text: memoText,
            },
        },
        {
            refund_memo: {
                address: trade.refundAddress,
                mac: macRefund,
                address_n: validatePath(pathRefund),
            },
        },
    ];

    return {
        recipient_name: provider.companyName,
        nonce,
        amount: sendAmount,
        memos,
        signature: trade.tradeSignature,
    };
};
