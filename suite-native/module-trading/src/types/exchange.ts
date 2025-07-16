import { ExchangeTrade } from 'invity-api';

import { Formatters } from '@suite-common/formatters';
import { TradingExchangeAmountLimitProps } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import type { UseFormReturn } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { BaseFormValues, ReceiveAccount, TradeableAsset } from './general';
import { useConvertFormValueToBaseUnit } from '../hooks/general/useConvertFormValueToBaseUnit';

export type ExchangeFormValues = BaseFormValues<
    'sendCryptoAmount' | 'receiveCryptoAmount',
    ExchangeTrade
> & {
    sendAsset: TradeableAsset | undefined;
    sendAccount: Account | undefined;
    receiveAsset: TradeableAsset | undefined;
    receiveAccount: ReceiveAccount | undefined;
};

export type ExchangeFormContext = Partial<TradingExchangeAmountLimitProps> & {
    translate: ReturnType<typeof useTranslate>['translate'];
    balance: string | undefined;
    CryptoAmountFormatter: Formatters['CryptoAmountFormatter'];
    convertNumberToBaseUnit: ReturnType<
        typeof useConvertFormValueToBaseUnit
    >['convertNumberToBaseUnit'];
    currency: string | undefined;
};

export type ExchangeFormType = UseFormReturn<ExchangeFormValues>;
