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
}: BuildExchangeComposeInputsParams): ExchangeComposeInputs | undefined => {
    // DEX trades are signed from the quote before any trade is saved;
    // CEX trades need the saved trade, where sendAddress is filled in.
    const trade = selectedQuote?.isDex ? selectedQuote : selectedTrade;
    const { dexTx } = trade;

    if (dexTx) {
        let serializedTx: string | undefined;
        if (dexTx.data) {
            try {
                serializedTx = normalizeDexTransactionData({ data: dexTx.data, networkType });
            } catch {
                return undefined;
            }
        }

        return {
            trade,
            recomposeInputs: buildRecomposeInputsFromTrade({
                dexTx,
                partnerPaymentExtraId: trade.partnerPaymentExtraId,
                serializedTx,
                networkType,
            }),
        };
    }

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
