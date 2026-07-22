import { TranslationKey } from '@suite/intl';

export type TradeStatusPhase = {
    status: string;
    translationKey: TranslationKey;
    // Extra ICU values the translation needs; the provider name is injected by the caller.
    translationValues?: (provider: string) => Record<string, string | number>;
};

// Swap transaction detail progresses CONFIRMING → CONVERTING → SUCCESS once the (blocked)
// send is broadcast. Only CONVERTING renders the provider name.
export const swapStatusFlow: readonly TradeStatusPhase[] = [
    { status: 'CONFIRMING', translationKey: 'TR_EXCHANGE_DETAIL_SENDING_TRANSACTION' },
    {
        status: 'CONVERTING',
        translationKey: 'TR_TRADING_DETAIL_PROCESSING',
        translationValues: provider => ({ providerName: provider, type: 'swap' }),
    },
    { status: 'SUCCESS', translationKey: 'TR_EXCHANGE_DETAIL_SUCCESS_TITLE' },
];
