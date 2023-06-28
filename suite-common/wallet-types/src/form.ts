import { ReactElement } from 'react';
import { FieldError, FieldErrorsImpl, FieldValues, Merge } from 'react-hook-form';

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { FormDraftPrefixKeyValues } from '@suite-common/wallet-constants';

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
