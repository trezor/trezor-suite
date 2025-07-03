import { IntlShape } from 'react-intl';

import { BaseCurrencyCode } from '@suite-common/suite-config';
import { PROTO } from '@trezor/connect';

export type FormatterProviderConfig = {
    locale: string;
    bitcoinAmountUnit: PROTO.AmountUnit;
    fiatCurrency: BaseCurrencyCode;
    is24HourFormat: boolean;
};

export interface FormatterConfig extends FormatterProviderConfig {
    intl: IntlShape;
}
