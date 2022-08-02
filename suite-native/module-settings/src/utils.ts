import { SelectItemType } from '@suite-native/atoms';
import { Currency } from '@suite-common/suite-config';

export const transformFiatCurrencyToSelectItem = (fiatCurrency: Currency): SelectItemType => ({
    label: fiatCurrency.value,
    value: fiatCurrency.label,
});
