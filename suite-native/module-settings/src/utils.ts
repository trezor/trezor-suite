import { SelectItemType } from '@suite-native/atoms';

export const transformFiatCurrencyToSelectItem = (fiatCurrency): SelectItemType => ({
    label: fiatCurrency.value,
    value: fiatCurrency.label,
});
