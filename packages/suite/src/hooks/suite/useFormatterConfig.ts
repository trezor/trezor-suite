import { useSelector } from '@suite-hooks/useSelector';
import { useBitcoinAmountUnit } from '@wallet-hooks/useBitcoinAmountUnit';
import { FormatterConfig } from '@suite-common/formatters';

export const useFormatterConfig = (): FormatterConfig => {
    const locale = useSelector(state => state.suite.settings.language);
    const { areSatsDisplayed } = useBitcoinAmountUnit();

    return {
        locale,
        areSatsDisplayed,
    };
};
