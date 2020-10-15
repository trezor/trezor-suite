import { ReactElement } from 'react';
import { ExtendedMessageDescriptor } from '@suite-types';
import { FieldError } from 'react-hook-form';

// strongly typed UseFormMethods.register
export interface TypedValidationRules {
    required?: ExtendedMessageDescriptor['id'] | JSX.Element | undefined;
    validate?: (data: string) => ExtendedMessageDescriptor['id'] | JSX.Element | undefined;
}

// react-hook-form FieldError is not properly typed, even if it accepts string | ReactElement it claims that the message is only a string
// we need to overload it with expected types which could be:
// - Translation.id (string, set from field validation methods)
// - Translation component (ReactElement, set from field validation methods)
// - ExtendedMessageDescriptor object (set from useSendFormCompose::setError)

export type TypedFieldError =
    | FieldError
    | {
          type: string;
          message?: ExtendedMessageDescriptor['id'] | ExtendedMessageDescriptor | ReactElement;
      };
