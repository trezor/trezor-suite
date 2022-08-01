import type { WithSelectedAccountLoadedProps } from '@wallet-components';
import type { TypedValidationRules } from '@wallet-types/form';
import type { UseFormMethods } from 'react-hook-form';
import type { Option } from './coinmarketCommonTypes';
import type { SavingsContextValues } from './coinmarketSavings';

export type UseSavingsBankAccountProps = WithSelectedAccountLoadedProps;

export interface SavingsBankAccountFormState {
    typeOption: Option;
    name: string;
    routingNumber: string;
    accountNumber: string;
    bankAccountOwner: string;
}
export type SavingsBankAccountContextValues = SavingsContextValues &
    Omit<UseFormMethods<SavingsBankAccountFormState>, 'register'> & {
        register: (rules?: TypedValidationRules) => (ref: any) => void; // TODO: ReturnType of UseFormMethods['register'] union
        onSubmit: (data: SavingsBankAccountFormState) => void;
    };
