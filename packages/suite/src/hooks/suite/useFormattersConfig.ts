import { useSelector } from '@suite-hooks/useSelector';
import { selectLocalCurrency } from '@wallet-reducers/settingsReducer';

import { FormatterProviderConfig } from '@suite-common/formatters';

export const useFormattersConfig = (): FormatterProviderConfig => {
    const locale = useSelector(state => state.suite.settings.language);
    const bitcoinAmountUnit = useSelector(state => state.wallet.settings.bitcoinAmountUnit);
    const fiatCurrency = useSelector(selectLocalCurrency);

    return {
        locale,
        fiatCurrency,
        bitcoinAmountUnit,
        is24HourFormat: true,
    };
};
