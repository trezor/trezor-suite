import type { WithSelectedAccountLoadedProps } from '@wallet-components';
import type { TypedValidationRules } from '@wallet-types/form';
import type { UseFormMethods } from 'react-hook-form';

export type UseSavingsPhoneNumberVerificationProps = WithSelectedAccountLoadedProps;

export interface SavingsPhoneNumberVerificationFormState {
    code: string;
}

export type SavingsPhoneNumberVerificationContextValues = Omit<
    UseFormMethods<SavingsPhoneNumberVerificationFormState>,
    'register'
> & {
    register: (rules?: TypedValidationRules) => (ref: any) => void; // TODO: ReturnType of UseFormMethods['register'] union
    onSubmit: () => void;
};
