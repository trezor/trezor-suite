import { useContext } from 'react';
import { useController } from 'react-hook-form';

import { G } from '@mobily/ts-belt';

import { type TxKeyPath, useTranslate } from '@suite-native/intl';

import { FormContext } from '../Form';
import { type FieldName } from '../types';

interface UseFieldArgs {
    name: FieldName;
    defaultValue?: unknown;
    valueTransformer?: (value: string) => string;
}

// Yup validators are defined in @suite-common/validators, outside of the intl context, so they
// return translation tags instead of translated messages. Translation happens here, at the form
// layer, where the intl context is available. See #11004.
const validationTagToTranslationKey = {
    TR_REQUIRED_FIELD: 'generic.formValidation.required',
    TR_EXCEEDS_MAX: 'generic.formValidation.exceedsMax',
    TR_ASCII_ONLY: 'generic.formValidation.asciiOnly',
    DATA_NOT_VALID_HEX: 'generic.formValidation.notValidHex',
} as const satisfies Record<string, TxKeyPath>;

type ValidationTag = keyof typeof validationTagToTranslationKey;

const isValidationTag = (message: string): message is ValidationTag =>
    Object.hasOwn(validationTagToTranslationKey, message);

export const useField = ({
    name,
    defaultValue,
    valueTransformer = value => value,
}: UseFieldArgs) => {
    // TODO: once react-hook-form is updated to 7+ we can use the `errors` from `fieldState` on useController
    const { control } = useContext(FormContext);
    const { translate } = useTranslate();

    if (!control) {
        throw new Error('Field must be used within Form component');
    }

    const {
        field: { onBlur, onChange, value },
        fieldState: { error, isDirty, isTouched },
    } = useController({
        name,
        control,
        defaultValue,
    });

    // Inspired by https://react-hook-form.com/advanced-usage#TransformandParse.
    // Allows to parse/transform the value before it's set to the input.
    const transformedValue = G.isString(value) ? valueTransformer(value) : '';

    const errorMessage = error?.message;
    const translatedErrorMessage =
        errorMessage && isValidationTag(errorMessage)
            ? translate(validationTagToTranslationKey[errorMessage])
            : errorMessage;
    const errorType = error?.type;
    const hasError = !!error;

    return {
        errorMessage: translatedErrorMessage,
        errorType,
        hasError,
        isDirty,
        isTouched,
        value: transformedValue,
        onBlur,
        onChange,
    };
};
