import type { IntlShape } from 'react-intl';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import type { PROTO } from '@trezor/connect';

export type FormatterProviderConfig = {
    locale: string;
    bitcoinAmountUnit: PROTO.AmountUnit;
    baseCurrency: BaseCurrencyCode;
    is24HourFormat: boolean;
    networkDisplaySymbols?: Partial<Record<NetworkSymbol, string>>;
};

export interface FormatterConfig extends FormatterProviderConfig {
    intl: IntlShape;
}
