import { FormatterProviderConfig } from '@suite-common/formatters';
import { selectBaseCurrency } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite/useSelector';
import { selectLanguage } from 'src/selectors/suite/suiteSelectors';

export const useFormattersConfig = (): FormatterProviderConfig => {
    const locale = useSelector(selectLanguage);
    const bitcoinAmountUnit = useSelector(state => state.wallet.settings.bitcoinAmountUnit);
    const baseCurrency = useSelector(selectBaseCurrency);

    return {
        locale,
        baseCurrency,
        bitcoinAmountUnit,
        is24HourFormat: true,
    };
};
