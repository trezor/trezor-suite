import type { UseFormMethods } from 'react-hook-form';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';
import type { TypedValidationRules } from '@wallet-types/form';
import type { Option } from '@suite/types/wallet/coinmarketCommonTypes';

export type UseSavingsUnsupportedCountryProps = WithSelectedAccountLoadedProps;

export interface SavingsUnsupportedCountryFormState {
    country: string;
}

export type SavingsUnsupportedCountryContextValues = Omit<
    UseFormMethods<SavingsUnsupportedCountryFormState>,
    'register'
> & {
    register: (rules?: TypedValidationRules) => (ref: any) => void; // TODO: ReturnType of UseFormMethods['register'] union
    supportedCountries?: string[];
    onSubmit: ({ country }: { country: Option }) => void;
};
