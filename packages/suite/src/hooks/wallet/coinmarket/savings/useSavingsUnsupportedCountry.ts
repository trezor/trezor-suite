import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useActions } from '@suite-hooks';
import type {
    SavingsUnsupportedCountryContextValues,
    SavingsUnsupportedCountryFormState,
    UseSavingsUnsupportedCountryProps,
} from '@wallet-types/coinmarket/savings/unsupportedCountry';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { Option } from '@suite/types/wallet/coinmarketCommonTypes';
import { useFormDraft } from '../../useFormDraft';

export const useSavingsUnsupportedCountry = ({
    selectedAccount,
}: UseSavingsUnsupportedCountryProps): SavingsUnsupportedCountryContextValues => {
    const { selectedProvider } = useSelector(state => ({
        selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
    }));

    const { setUserCountryEffective } = useActions({
        setUserCountryEffective: coinmarketSavingsActions.setUserCountryEffective,
    });

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
        setUserCountryEffective(country.value);
        saveDraft(selectedAccount.account.descriptor, {
            country: country.value,
        });
    };

    return {
        ...methods,
        register: typedRegister,
        supportedCountries: selectedProvider?.supportedCountries,
        onSubmit,
    };
};
