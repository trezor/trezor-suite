import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from '@suite-hooks';
import type {
    SavingsUnsupportedCountryContextValues,
    SavingsUnsupportedCountryFormState,
    UseSavingsUnsupportedCountryProps,
} from '@wallet-types/coinmarket/savings/unsupportedCountry';
import { Option } from '@wallet-types/coinmarketCommonTypes';
import { useFormDraft } from '../../useFormDraft';
import { useCoinmarketNavigation } from '../../useCoinmarketNavigation';

export const useSavingsUnsupportedCountry = ({
    selectedAccount,
}: UseSavingsUnsupportedCountryProps): SavingsUnsupportedCountryContextValues => {
    const { selectedProvider } = useSelector(state => ({
        selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
    }));

    const { navigateToSavings } = useCoinmarketNavigation(selectedAccount.account);

    const { saveDraft } = useFormDraft<SavingsUnsupportedCountryFormState>(
        'coinmarket-savings-unsupported-country',
    );

    const methods = useForm<SavingsUnsupportedCountryFormState>({
        mode: 'onChange',
    });

    const { register } = methods;

    // TODO: extract
    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    const onSubmit = ({ country }: { country: Option }) => {
        saveDraft(selectedAccount.account.descriptor, {
            country: country.value,
        });
        navigateToSavings();
    };

    return {
        ...methods,
        register: typedRegister,
        supportedCountries: selectedProvider?.supportedCountries,
        onSubmit,
    };
};
