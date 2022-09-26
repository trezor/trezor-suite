import { IntlShape } from 'react-intl';

import { PROTO } from '@trezor/connect';

export type FormatterProviderConfig = {
    locale: string;
    bitcoinAmountUnit: PROTO.AmountUnit;
};

export interface FormatterConfig extends FormatterProviderConfig {
    intl: IntlShape;
}
