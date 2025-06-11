import { ExchangeTrade } from 'invity-api';

import { Account } from '@suite-common/wallet-types';
import type { UseFormReturn } from '@suite-native/forms';

import { BaseFormValues, ReceiveAccount, TradeableAsset } from './general';

export type ExchangeFormValues = BaseFormValues<'sendValue' | 'receiveValue', ExchangeTrade> & {
    sendAccount: Account | undefined;
    sendCryptoAmount: string;
    receiveAsset: TradeableAsset | undefined;
    receiveAccount: ReceiveAccount | undefined;
    receiveCryptoAmount: string;
};

export type ExchangeFormType = UseFormReturn<ExchangeFormValues>;
