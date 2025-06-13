import { isRejected } from '@reduxjs/toolkit';
import {
    CryptoId,
    ExchangeProviderInfo,
    ExchangeTradeSigned,
    SellFiatTradeSigned,
    SellProviderInfo,
} from 'invity-api';

import { getNetwork } from '@suite-common/wallet-config';
import { amountToSmallestUnit } from '@suite-common/wallet-utils';
import TrezorConnect, { PROTO } from '@trezor/connect';

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
    macPurchase: string;
    nonce: string;
    receiveSlip44: number;
};

export const tradingExchangeCreatePaymentRequest = ({
    trade,
    provider,
    macPurchase,
    macRefund,
    nonce,
    receiveSlip44,
}: TradingExchangeCreatePaymentRequestProps): PROTO.TxAckPaymentRequest | undefined => {
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
    const receiveNetworkData = cryptoIdToNetworkAndContractAddress(trade.receive);
    const sendAmount = amountToSmallestUnit(
        trade.sendStringAmount,
        sendNetworkData.network?.decimals ?? getNetwork('btc').decimals,
    );
    const receiveAmount = amountToSmallestUnit(
        trade.receiveStringAmount,
        receiveNetworkData?.network?.decimals ?? getNetwork('btc').decimals,
    );

    const memos: PROTO.PaymentRequestMemo[] = [
        {
            coin_purchase_memo: {
                address: trade.receiveAddress,
                amount: receiveAmount,
                coin_type: receiveSlip44,
                mac: macPurchase,
            },
        },
        {
            refund_memo: {
                address: trade.refundAddress,
                mac: macRefund,
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
    nonce: string;
    memoText: string;
};

export const tradingSellCreatePaymentRequest = ({
    trade,
    provider,
    macRefund,
    nonce,
    memoText,
}: TradingSellCreatePaymentRequestProps): PROTO.TxAckPaymentRequest | undefined => {
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
    const sendAmount = amountToSmallestUnit(
        trade.cryptoStringAmount,
        sendNetworkData.network?.decimals ?? getNetwork('btc').decimals,
    );

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
