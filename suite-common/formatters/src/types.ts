import { IntlShape } from 'react-intl';

import { PROTO } from '@trezor/connect';

export type FormatterConfig = {
    locale: string;
    bitcoinAmountUnit: PROTO.AmountUnit;
    intl: IntlShape;
};
