import { BuyTrade, FiatCurrencyCode } from 'invity-api';

import { Formatters } from '@suite-common/formatters';
import { TradingAmountLimitProps } from '@suite-common/trading';
import type { UseFormReturn } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { Country, ReceiveAccount, TradeableAsset } from './general';
import { useConvertFormValueToBaseUnit } from '../hooks/general/useConvertFormValueToBaseUnit';

export type BuyFormValues = {
    quote: BuyTrade | undefined;
    asset: TradeableAsset | undefined;
    receiveAccount: ReceiveAccount | undefined;
    fiatCurrency: FiatCurrencyCode;
    fiatValue: string | undefined;
    cryptoValue: string | undefined;
    amountInCrypto: boolean;
    focusedValue: 'fiatValue' | 'cryptoValue' | undefined;
    country: Country;
    generalAlert: string | undefined;
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
