import type { FiatCurrencyCode } from 'invity-api';

import type { FlagProps } from '@trezor/components';

export type Option = { value: string; label: string };
export type CountryOption = { value: FlagProps['country']; label: string };
export type DefaultCountryOption = { value: string; label: string };
export type FiatCurrencyOption = {
    value: FiatCurrencyCode;
    label: string;
};
