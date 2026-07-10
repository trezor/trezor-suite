import { yup } from '@suite-common/validators';

import { type ValidateError, stripFieldFromMessage } from './messageSystemValidation';

type ParseAndValidateJsonFormArgs<TValidated> = {
    formData: string;
    // Throws yup.ValidationError when the parsed value does not match the schema.
    validate: (parsed: unknown) => TValidated;
    getDuplicateIdError: (validated: TValidated) => ValidateError | null;
    formatFieldError?: (message: string) => string;
};

type ParseAndValidateJsonFormResult<TParsed> = {
    parsedData: TParsed | null;
    validationErrors: ValidateError[];
};

export const parseAndValidateJsonForm = <TParsed, TValidated>({
    formData,
    validate,
    getDuplicateIdError,
    formatFieldError,
}: ParseAndValidateJsonFormArgs<TValidated>): ParseAndValidateJsonFormResult<TParsed> => {
    let parsedData: TParsed | null = null;

    try {
        parsedData = JSON.parse(formData);

        const validatedData = validate(parsedData);

        const duplicateIdError = getDuplicateIdError(validatedData);

        return { parsedData, validationErrors: duplicateIdError ? [duplicateIdError] : [] };
    } catch (error) {
        if (error instanceof SyntaxError) {
            const { message } = error;

            return { parsedData: null, validationErrors: [{ field: 'JSON', message }] };
        }

        if (error instanceof yup.ValidationError) {
            const errors = (error.inner?.length ? error.inner : [error]).map(e => ({
                field: e.path ?? 'value',
                message: formatFieldError ? formatFieldError(e.message) : e.message,
            }));

            return { parsedData, validationErrors: stripFieldFromMessage(errors) };
        }

        return {
            parsedData: null,
            validationErrors: [{ field: 'JSON', message: 'Unknown error occurred' }],
        };
    }
};
