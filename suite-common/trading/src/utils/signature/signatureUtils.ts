import { isRejected } from '@reduxjs/toolkit';
import {
    CryptoId,
    ExchangeProviderInfo,
    ExchangeTradeSigned,
    SellFiatTradeSigned,
    SellProviderInfo,
} from 'invity-api';

import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import TrezorConnect, { PROTO } from '@trezor/connect';
import { validatePath } from '@trezor/connect/src/utils/pathUtils';
import { BigNumber } from '@trezor/utils';

import { cryptoIdToNetwork, cryptoIdToNetworkAndContractAddress } from '../../utils';

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
}: TradingExchangeCreatePaymentRequestProps): PROTO.PaymentRequest | undefined => {
    if (
        !provider?.companyName ||
        !trade.send ||
        !trade.sendStringAmount ||
        !trade.receive ||
        !trade.receiveStringAmount ||
        !trade.receiveAddress ||
        !trade.refundAddress
    ) {
        return undefined;
    }

    const sendNetworkData = cryptoIdToNetworkAndContractAddress(trade.send);
    const sendNetworkSymbol = sendNetworkData.network?.symbol ?? 'btc';
    const sendAmount = unitsToSubunits(
        asAmountUnit(new BigNumber(trade.sendStringAmount), sendNetworkSymbol),
        sendNetworkSymbol,
    ).toString();

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
};

export const tradingSellCreatePaymentRequest = ({
    trade,
    provider,
    macRefund,
    pathRefund,
    nonce,
    memoText,
}: TradingSellCreatePaymentRequestProps): PROTO.PaymentRequest | undefined => {
    if (
        !provider?.companyName ||
        !trade.refundAddress ||
        !trade.tradeSignature ||
        !trade.cryptoStringAmount ||
        !trade.cryptoCurrency
    ) {
        return undefined;
    }

    const sendNetworkData = cryptoIdToNetworkAndContractAddress(trade.cryptoCurrency);

    const sendNetworkSymbol = sendNetworkData.network?.symbol ?? 'btc';
    const sendAmount = unitsToSubunits(
        asAmountUnit(new BigNumber(trade.cryptoStringAmount), sendNetworkSymbol),
        sendNetworkSymbol,
    ).toString();

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
