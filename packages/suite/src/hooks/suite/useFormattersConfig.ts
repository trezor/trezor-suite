import { FormatterProviderConfig } from '@suite-common/formatters';

import { useSelector } from 'src/hooks/suite/useSelector';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

export const useFormattersConfig = (): FormatterProviderConfig => {
    const locale = useSelector(selectLanguage);
    const bitcoinAmountUnit = useSelector(state => state.wallet.settings.bitcoinAmountUnit);
    const fiatCurrency = useSelector(selectLocalCurrency);

    return {
        locale,
        fiatCurrency,
        bitcoinAmountUnit,
        is24HourFormat: true,
    };
};
