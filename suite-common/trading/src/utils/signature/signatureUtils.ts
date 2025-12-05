import { isRejected } from '@reduxjs/toolkit';
import {
    CryptoId,
    ExchangeProviderInfo,
    ExchangeTradeSigned,
    SellFiatTradeSigned,
    SellProviderInfo,
} from 'invity-api';

import type { Network } from '@suite-common/wallet-config';
import { asAmountUnit, formatBigNumberToLE, unitsToSubunits } from '@suite-common/wallet-utils';
import TrezorConnect, { PROTO } from '@trezor/connect';
import { validatePath } from '@trezor/connect/src/utils/pathUtils';
import { BigNumber } from '@trezor/utils';

import { cryptoIdToNetwork, cryptoIdToNetworkAndContractAddress } from '../../utils';

export const formatSlip24SendAmountByNetwork = ({
    value,
    network,
}: {
    value: string | number;
    network: Network;
}): string => {
    const bytesLength = network.networkType === 'ethereum' ? 32 : 8;

    return formatBigNumberToLE({
        value: new BigNumber(value),
        bytesLength,
    });
};

export const tradingGetCoinSlip44 = async (cryptoId: CryptoId | undefined) => {
    if (!cryptoId) return;

    const network = cryptoIdToNetwork(cryptoId);

    if (!network) return;

    const coinInfo = await TrezorConnect.getCoinInfo({
        coin: network.symbol,
    });

    if (isRejected(coinInfo) || 'error' in coinInfo.payload) return;

    return coinInfo.payload.slip44;
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

    const sendAmount = formatSlip24SendAmountByNetwork({
        value: unitsToSubunits({
            value: asAmountUnit(new BigNumber(sendStringAmount)),
            symbol: sendNetworkSymbol,
            ...(sendTokenDecimals !== undefined ? { decimals: sendTokenDecimals } : undefined),
        }).toString(),
        network: sendNetworkData.network,
    });

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

    const sendAmount = formatSlip24SendAmountByNetwork({
        value: unitsToSubunits({
            value: asAmountUnit(new BigNumber(sendStringAmount)),
            symbol: sendNetworkSymbol,
            ...(sendTokenDecimals !== undefined ? { decimals: sendTokenDecimals } : undefined),
        }).toString(),
        network: sendNetworkData.network,
    });

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
