import type { BuyTrade } from 'invity-api';

import type { UseFormReturn } from '@suite-native/forms';

import type {
    BaseFormValues,
    FormWithFiatCurrencyValues,
    ReceiveAccount,
    TradeableAsset,
} from './general';

export type BuyFormValues = BaseFormValues<'fiatValue' | 'cryptoValue', BuyTrade> &
    FormWithFiatCurrencyValues & {
        asset: TradeableAsset | undefined;
        receiveAccount: ReceiveAccount | undefined;
    };

export type BuyFormType = UseFormReturn<BuyFormValues>;
