import { IntlShape } from 'react-intl';

import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { PROTO } from '@trezor/connect';

export type FormatterProviderConfig = {
    locale: string;
    bitcoinAmountUnit: PROTO.AmountUnit;
    baseCurrency: BaseCurrencyCode;
    is24HourFormat: boolean;
};

export interface FormatterConfig extends FormatterProviderConfig {
    intl: IntlShape;
}
