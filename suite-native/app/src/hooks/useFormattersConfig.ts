import { useIntl } from 'react-intl';

import { FormatterConfig } from '@suite-common/formatters';
import { PROTO } from '@trezor/connect';

export const useFormattersConfig = (): FormatterConfig => {
    const intl = useIntl();

    return {
        locale: 'en',
        bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
        intl,
    };
};
