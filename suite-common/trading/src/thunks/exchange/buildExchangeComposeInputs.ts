import { type ExchangeTrade } from 'invity-api';

import { type NetworkType } from '@suite-common/wallet-config';

import { normalizeDexTransactionData } from '../../utils/exchange/normalizeDexTransactionData';
import {
    type RecomposeInputs,
    buildRecomposeInputsFromTrade,
} from '../common/buildRecomposeInputsFromTrade';

export type ExchangeComposeInputs = {
    trade: ExchangeTrade;
    recomposeInputs: RecomposeInputs;
};

type BuildCexComposeInputsParams = {
    trade: ExchangeTrade;
    decimals: number;
    shouldSendInSats: boolean | undefined;
};

const buildCexComposeInputs = ({
    trade,
    decimals,
    shouldSendInSats,
}: BuildCexComposeInputsParams): ExchangeComposeInputs | undefined => {
    // sendAddress may be set by useTradingWatchTrade hook to the trade object
    const { sendAddress, sendStringAmount } = trade;

    if (!sendAddress || !sendStringAmount) {
        return undefined;
    }

    return {
        trade,
        recomposeInputs: buildRecomposeInputsFromTrade({
            sendAddress,
            sendStringAmount,
            partnerPaymentExtraId: trade.partnerPaymentExtraId,
            shouldSendInSats,
            decimals,
        }),
    };
};

type BuildDexComposeInputsParams = {
    quote: ExchangeTrade;
    networkType: NetworkType;
};

const buildDexComposeInputs = ({
    quote,
    networkType,
}: BuildDexComposeInputsParams): ExchangeComposeInputs | undefined => {
    const { dexTx } = quote;

    if (!dexTx) {
        return undefined;
    }

    let serializedTx: string;
    try {
        serializedTx = normalizeDexTransactionData({ data: dexTx.data, networkType });
    } catch {
        return undefined;
    }

    return {
        trade: quote,
        recomposeInputs: buildRecomposeInputsFromTrade({
            dexTx,
            partnerPaymentExtraId: quote.partnerPaymentExtraId,
            serializedTx,
        }),
    };
};

export type BuildExchangeComposeInputsParams = {
    selectedQuote: ExchangeTrade | undefined;
    selectedTrade: ExchangeTrade;
    networkType: NetworkType;
    decimals: number;
    shouldSendInSats: boolean | undefined;
};

export const buildExchangeComposeInputs = ({
    selectedQuote,
    selectedTrade,
    networkType,
    decimals,
    shouldSendInSats,
}: BuildExchangeComposeInputsParams): ExchangeComposeInputs | undefined =>
    selectedQuote?.isDex
        ? buildDexComposeInputs({ quote: selectedQuote, networkType })
        : buildCexComposeInputs({ trade: selectedTrade, decimals, shouldSendInSats });
