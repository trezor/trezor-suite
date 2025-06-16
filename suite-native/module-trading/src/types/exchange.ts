import { ExchangeTrade } from 'invity-api';

import { Account } from '@suite-common/wallet-types';
import type { UseFormReturn } from '@suite-native/forms';

import { BaseFormValues, ReceiveAccount, TradeableAsset } from './general';

export type ExchangeFormValues = BaseFormValues<
    'sendCryptoAmount' | 'receiveCryptoAmount',
    ExchangeTrade
> & {
    sendAsset: TradeableAsset | undefined;
    sendAccount: Account | undefined;
    receiveAsset: TradeableAsset | undefined;
    receiveAccount: ReceiveAccount | undefined;
};

export type ExchangeFormType = UseFormReturn<ExchangeFormValues>;
