import type { ExchangeTrade } from 'invity-api';

import type { UseFormReturn } from '@suite-native/forms';

import type {
    BaseFormValues,
    FormWithSendAccountValues,
    ReceiveAccount,
    TradeableAsset,
} from './general';

export type ExchangeFormValues = BaseFormValues<
    'sendCryptoAmount' | 'receiveCryptoAmount',
    ExchangeTrade
> &
    FormWithSendAccountValues & {
        receiveAsset: TradeableAsset | undefined;
        receiveAccount: ReceiveAccount | undefined;
    };

export type ExchangeFormType = UseFormReturn<ExchangeFormValues>;
