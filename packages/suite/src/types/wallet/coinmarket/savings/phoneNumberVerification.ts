import type { UseFormMethods, FieldError } from 'react-hook-form';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';
import type { TypedValidationRules } from '@wallet-types/form';

export type UseSavingsPhoneNumberVerificationProps = WithSelectedAccountLoadedProps;

type CodeDigitIndexType = `codeDigitIndex${0 | 1 | 2 | 3 | 4 | 5}`;

export type SavingsPhoneNumberVerificationFieldValues = {
    [key in CodeDigitIndexType]: string;
};

export type SavingsPhoneNumberVerificationContextValues = Omit<
    UseFormMethods<SavingsPhoneNumberVerificationFieldValues>,
    'register'
> & {
    register: (rules?: TypedValidationRules) => (ref: any) => void; // TODO: ReturnType of UseFormMethods['register'] union
    onSubmit: (fieldValues: SavingsPhoneNumberVerificationFieldValues) => void;
    phoneNumber?: string;
    error?: FieldError | undefined;
    handlePhoneNumberChange: () => void;
};
