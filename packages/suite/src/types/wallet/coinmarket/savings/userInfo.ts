import type { WithSelectedAccountLoadedProps } from '@wallet-components';
import type { TypedValidationRules } from '@wallet-types/form';
import type { UseFormMethods } from 'react-hook-form';

export type UseSavingsUserInfoProps = WithSelectedAccountLoadedProps;

export interface SavingsUserInfoFormState {
    givenName: string;
    familyName: string;
    phoneNumber: string;
}

export type SavingsUserInfoContextValues = Omit<
    UseFormMethods<SavingsUserInfoFormState>,
    'register'
> & {
    register: (rules?: TypedValidationRules) => (ref: any) => void; // TODO: ReturnType of UseFormMethods['register'] union
    onSubmit: () => void;
};
