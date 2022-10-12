import { IntlShape } from 'react-intl';

import { PROTO } from '@trezor/connect';
import { FiatCurrencyCode } from '@suite-common/suite-config';

export type FormatterProviderConfig = {
    locale: string;
    bitcoinAmountUnit: PROTO.AmountUnit;
    fiatCurrency?: FiatCurrencyCode;
};

export interface FormatterConfig extends FormatterProviderConfig {
    intl: IntlShape;
}
