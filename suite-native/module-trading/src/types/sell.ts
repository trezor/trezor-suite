import { FiatCurrencyCode, SellFiatTrade } from 'invity-api';

import { Formatters } from '@suite-common/formatters';
import { TradingAmountLimitProps, TradingCountryOption } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import type { UseFormReturn } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { BaseFormValues, TradeableAsset } from './general';
import { useConvertFormValueToBaseUnit } from '../hooks/general/useConvertFormValueToBaseUnit';

export type SellFormValues = BaseFormValues<
    'cryptoStringAmount' | 'fiatStringAmount',
    SellFiatTrade
> & {
    sendAsset: TradeableAsset | undefined;
    sendAccount: Account | undefined;
    fiatCurrency: FiatCurrencyCode;
    amountInCrypto: boolean;
    country: TradingCountryOption;
};

export type SellFormContext = Partial<TradingAmountLimitProps> & {
    translate: ReturnType<typeof useTranslate>['translate'];
    balance: string | undefined;
    FiatAmountFormatter: Formatters['BaseCurrencyAmountFormatter'];
    CryptoAmountFormatter: Formatters['CryptoAmountFormatter'];
    convertNumberToBaseUnit: ReturnType<
        typeof useConvertFormValueToBaseUnit
    >['convertNumberToBaseUnit'];
    sendSymbol: string | undefined;
};

export type SellFormType = UseFormReturn<SellFormValues>;
