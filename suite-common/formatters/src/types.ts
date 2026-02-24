import { IntlShape } from 'react-intl';

import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { PROTO } from '@trezor/connect';

export type FormatterProviderConfig = {
    locale: string;
    bitcoinAmountUnit: PROTO.AmountUnit;
    baseCurrency: BaseCurrencyCode;
    is24HourFormat: boolean;
    /** When true, fiat amounts >= 1000 are shown as 21.35K, 1.50M, etc. (desktop/web only) */
    useShortFiatFormat?: boolean;
};

export interface FormatterConfig extends FormatterProviderConfig {
    intl: IntlShape;
}
