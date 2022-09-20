import { formatCoinBalance } from '@suite-common/wallet-utils';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';

export const prepareCoinBalanceFormatter = (config: FormatterConfig) =>
    makeFormatter<string, string>(value => {
        const { locale } = config;
        return formatCoinBalance(value, locale);
    });
