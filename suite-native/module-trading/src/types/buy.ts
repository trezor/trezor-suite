import { BuyTrade, FiatCurrencyCode } from 'invity-api';

import type { UseFormReturn } from '@suite-native/forms';

import { Country, FocusableFormValues, ReceiveAccount, TradeableAsset } from './general';

export type BuyFormValues = {
    quote: BuyTrade | undefined;
    asset: TradeableAsset | undefined;
    receiveAccount: ReceiveAccount | undefined;
    fiatCurrency: FiatCurrencyCode;
    amountInCrypto: boolean;
    country: Country;
    generalAlert: string | undefined;
} & FocusableFormValues<'fiatValue' | 'cryptoValue'>;

export type BuyForm = UseFormReturn<BuyFormValues>;
