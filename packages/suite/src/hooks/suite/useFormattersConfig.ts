import { FormatterProviderConfig } from '@suite-common/formatters';
import { selectBaseCurrency, selectBitcoinAmountUnit } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite/useSelector';
import { selectHasExperimentalFeature, selectLanguage } from 'src/selectors/suite/suiteSelectors';

export const useFormattersConfig = (): FormatterProviderConfig => {
    const locale = useSelector(selectLanguage);
    const bitcoinAmountUnit = useSelector(selectBitcoinAmountUnit);
    const baseCurrency = useSelector(selectBaseCurrency);
    const useShortFiatFormat = useSelector(selectHasExperimentalFeature('short-fiat-format'));

    return {
        locale,
        baseCurrency,
        bitcoinAmountUnit,
        is24HourFormat: true,
        useShortFiatFormat,
    };
};
