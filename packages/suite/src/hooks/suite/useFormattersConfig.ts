import { useSelector } from 'src/hooks/suite/useSelector';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

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
