import { IntlShape } from 'react-intl';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import { PROTO } from '@trezor/connect';

export type FormatterProviderConfig = {
    locale: string;
    bitcoinAmountUnit: PROTO.AmountUnit;
    fiatCurrency: FiatCurrencyCode;
    is24HourFormat: boolean;
};

export interface FormatterConfig extends FormatterProviderConfig {
    intl: IntlShape;
}
