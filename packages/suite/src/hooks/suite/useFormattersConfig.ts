import { FormatterProviderConfig } from '@suite-common/formatters';
import { selectBaseCurrency, selectBitcoinAmountUnit } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite/useSelector';
import { selectLanguage } from 'src/selectors/suite/suiteSelectors';
import { getOs24HourFormat } from 'src/utils/suite/l10n';

// Computed once at module level since the system time format doesn't change during app runtime.
const is24HourFormat = getOs24HourFormat();

export const useFormattersConfig = (): FormatterProviderConfig => {
    const locale = useSelector(selectLanguage);
    const bitcoinAmountUnit = useSelector(selectBitcoinAmountUnit);
    const baseCurrency = useSelector(selectBaseCurrency);

    return {
        locale,
        baseCurrency,
        bitcoinAmountUnit,
        is24HourFormat,
    };
};
