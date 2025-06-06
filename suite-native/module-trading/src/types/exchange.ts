import { ExchangeTrade } from 'invity-api';

import { Account } from '@suite-common/wallet-types';
import type { UseFormReturn } from '@suite-native/forms';

import { BaseFormValues, ReceiveAccount } from './general';

export type ExchangeFormValues = BaseFormValues<'sendValue' | 'receiveValue', ExchangeTrade> & {
    sendAccount: Account | undefined;
    receiveAccount: ReceiveAccount | undefined;
};

export type ExchangeFormType = UseFormReturn<ExchangeFormValues>;
