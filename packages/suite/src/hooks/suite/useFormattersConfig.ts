import { useSelector } from '@suite-hooks/useSelector';
import { FormatterConfig } from '@suite-common/formatters';
import { useIntl } from 'react-intl';

export const useFormattersConfig = (): FormatterConfig => {
    const intl = useIntl();
    const locale = useSelector(state => state.suite.settings.language);
    const bitcoinAmountUnit = useSelector(state => state.wallet.settings.bitcoinAmountUnit);

    return {
        locale,
        bitcoinAmountUnit,
        intl,
    };
};
