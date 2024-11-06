import { FormatterProviderConfig } from '@suite-common/formatters';

import { useSelector } from 'src/hooks/suite/useSelector';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';

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
