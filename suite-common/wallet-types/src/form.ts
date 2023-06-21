import { ReactElement } from 'react';
import {
    FieldError,
    FieldErrorsImpl,
    FieldPath,
    FieldValues,
    Merge,
    Path,
    PathValue,
    RegisterOptions,
    UseFormRegisterReturn,
    UseFormReturn,
} from 'react-hook-form';

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { FormDraftPrefixKeyValues } from '@suite-common/wallet-constants';

type ValidationReturn = ExtendedMessageDescriptor['id'] | JSX.Element | undefined;

// strongly typed UseFormMethods.register
export interface TypedValidationRules<
    TFieldValues = FieldValues,
    TFieldName extends Path<TFieldValues> = any,
> {
    required?: ValidationReturn;
    validate?: (value: PathValue<TFieldValues, TFieldName>) => ValidationReturn;
}

export type SuiteUseFormRegister<TFieldValues extends FieldValues> = <
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
    name: TFieldName,
    options?: Omit<RegisterOptions<TFieldValues, TFieldName>, 'require' | 'validate'> &
        TypedValidationRules<TFieldValues, TFieldName>,
) => UseFormRegisterReturn<TFieldName>;

// UseFormReturn with strongly typed return for validation functions - returns translation id or an element, not just any string.
export interface SuiteUseFormReturn<TFieldValues extends FieldValues>
    extends Omit<UseFormReturn<TFieldValues>, 'register'> {
    register: SuiteUseFormRegister<TFieldValues>;
}

// react-hook-form FieldError is not properly typed, even if it accepts string | ReactElement it claims that the message is only a string
// we need to overload it with expected types which could be:
// - Translation.id (string, set from field validation methods)
// - Translation component (ReactElement, set from field validation methods)
// - ExtendedMessageDescriptor object (set from useSendFormCompose::setError)

export type TypedFieldError =
    | FieldError
    | Merge<FieldError, FieldErrorsImpl<FieldValues>>
    | {
          type: string;
          message?: ExtendedMessageDescriptor['id'] | ExtendedMessageDescriptor | ReactElement;
      };

export type FormDraftKeyPrefix = (typeof FormDraftPrefixKeyValues)[number];
export type FormDraft = Record<string, any>;
