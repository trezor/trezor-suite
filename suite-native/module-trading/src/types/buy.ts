import { BuyTrade, FiatCurrencyCode } from 'invity-api';

import { Formatters } from '@suite-common/formatters';
import { TradingAmountLimitProps } from '@suite-common/trading';
import type { UseFormReturn } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { BaseFormValues, Country, ReceiveAccount, TradeableAsset } from './general';
import { useConvertFormValueToBaseUnit } from '../hooks/general/useConvertFormValueToBaseUnit';

export type BuyFormValues = BaseFormValues<'fiatValue' | 'cryptoValue', BuyTrade> & {
    asset: TradeableAsset | undefined;
    receiveAccount: ReceiveAccount | undefined;
    fiatCurrency: FiatCurrencyCode;
    amountInCrypto: boolean;
    country: Country;
};

export type BuyFormContext = Partial<TradingAmountLimitProps> & {
    translate: ReturnType<typeof useTranslate>['translate'];
    FiatAmountFormatter: Formatters['FiatAmountFormatter'];
    CryptoAmountFormatter: Formatters['CryptoAmountFormatter'];
    convertNumberToBaseUnit: ReturnType<
        typeof useConvertFormValueToBaseUnit
    >['convertNumberToBaseUnit'];
};

export type BuyFormType = UseFormReturn<BuyFormValues>;
