import { TranslationKey } from '@suite/intl';

export type TradeStatusPhase = {
    status: string;
    translationKey: TranslationKey;
    // ICU values for the translation.
    translationValues?: (provider: string) => Record<string, string | number>;
};

// Only CONVERTING renders the provider name, hence the lone translationValues.
export const swapStatusFlow: readonly TradeStatusPhase[] = [
    { status: 'CONFIRMING', translationKey: 'TR_EXCHANGE_DETAIL_SENDING_TRANSACTION' },
    {
        status: 'CONVERTING',
        translationKey: 'TR_TRADING_DETAIL_PROCESSING',
        translationValues: provider => ({ providerName: provider, type: 'swap' }),
    },
    { status: 'SUCCESS', translationKey: 'TR_EXCHANGE_DETAIL_SUCCESS_TITLE' },
];
