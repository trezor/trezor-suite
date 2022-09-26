import { useSelector } from '@suite-hooks/useSelector';
import { FormatterProviderConfig } from '@suite-common/formatters';

export const useFormattersConfig = (): FormatterProviderConfig => {
    const locale = useSelector(state => state.suite.settings.language);
    const bitcoinAmountUnit = useSelector(state => state.wallet.settings.bitcoinAmountUnit);

    return {
        locale,
        bitcoinAmountUnit,
    };
};
