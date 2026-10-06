import { TranslationKey } from '@suite/intl';

export type TradeStatusPhase = {
    status: string;
    translationKey: TranslationKey;
    // ICU values for the translation.
    translationValues?: (provider: string) => Record<string, string | number>;
};

export const swapStatusFlow: readonly TradeStatusPhase[] = [
    { status: 'CONFIRMING', translationKey: 'TR_TRADING_DETAIL_SENDING_TRANSACTION' },
    {
        status: 'CONVERTING',
        translationKey: 'TR_TRADING_DETAIL_PROCESSING',
        translationValues: provider => ({ providerName: provider, type: 'swap' }),
    },
    { status: 'SUCCESS', translationKey: 'TR_EXCHANGE_DETAIL_COMPLETE_TITLE' },
];

// A DEX swap broadcasts the swap itself, so there is no CONFIRMING deposit phase,
// and the provider step is titled after the swap instead of the generic processing copy.
export const dexSwapStatusFlow: readonly TradeStatusPhase[] = [
    {
        status: 'CONVERTING',
        translationKey: 'TR_TRADING_DETAIL_SWAPPING_ON_PROVIDER',
        translationValues: provider => ({ providerName: provider }),
    },
    { status: 'SUCCESS', translationKey: 'TR_EXCHANGE_DETAIL_COMPLETE_TITLE' },
];

// A sell has no status for a transaction that is broadcast but not yet received, so the sending
// step is active while the trade still sits in SEND_CRYPTO and PENDING already means the provider
// has the funds.
export const sellStatusFlow: readonly TradeStatusPhase[] = [
    {
        status: 'PENDING',
        translationKey: 'TR_TRADING_DETAIL_PROCESSING',
        translationValues: provider => ({ providerName: provider, type: 'sell' }),
    },
    { status: 'SUCCESS', translationKey: 'TR_SELL_DETAIL_COMPLETE_TITLE' },
];
