import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { type Action, type Category } from '@suite-common/suite-types';
import { yup } from '@suite-common/validators';

import { selectMessageSystemConfig } from './messageSystemSelectors';
import { getDefaultActionByCategory } from './messageSystemUtils';
import {
    type ValidateError,
    stripFieldFromMessage,
    validateMessageForm,
} from './messageSystemValidation';

type UseMessageSystemMessageFormArgs = {
    // Maps a raw yup error message (e.g. the 'TR_REQUIRED_FIELD' key) to a display string.
    formatFieldError?: (message: string) => string;
};

type MessageSystemMessageFormValidationResult = {
    parsedData: Action | null;
    validationErrors: ValidateError[];
};

type ParseAndValidateMessageFormArgs = {
    formData: string;
    messageIds: Set<string>;
    formatFieldError?: (message: string) => string;
};

const parseAndValidateMessageForm = ({
    formData,
    messageIds,
    formatFieldError,
}: ParseAndValidateMessageFormArgs): MessageSystemMessageFormValidationResult => {
    let parsedData: Action | null = null;

    try {
        parsedData = JSON.parse(formData);

        const validatedData = validateMessageForm(parsedData);

        if (messageIds.has(validatedData.message.id)) {
            return {
                parsedData,
                validationErrors: [
                    {
                        field: 'message.id',
                        message: `must be unique. “${validatedData.message.id}” is already in use.`,
                    },
                ],
            };
        }

        return { parsedData, validationErrors: [] };
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

export const useMessageSystemMessageForm = ({
    formatFieldError,
}: UseMessageSystemMessageFormArgs = {}) => {
    const config = useSelector(selectMessageSystemConfig);
    const [formData, setFormData] = useState<string>(() =>
        JSON.stringify(getDefaultActionByCategory('banner'), null, 2),
    );
    const messageIds = useMemo(
        () => new Set(config?.actions.map(action => action.message.id)),
        [config],
    );

    const { parsedData, validationErrors } = useMemo(
        () => parseAndValidateMessageForm({ formData, messageIds, formatFieldError }),
        [formData, formatFieldError, messageIds],
    );

    const formatJSON = useCallback(() => {
        setFormData(JSON.stringify(parsedData, null, 2));
    }, [parsedData]);

    const applyPreset = useCallback((category: Category) => {
        setFormData(JSON.stringify(getDefaultActionByCategory(category), null, 2));
    }, []);

    const resetForm = useCallback(() => {
        setFormData(JSON.stringify(getDefaultActionByCategory('banner'), null, 2));
    }, []);

    return {
        formData,
        setFormData,
        parsedData,
        validationErrors,
        isValid: validationErrors.length === 0,
        canFormat: parsedData !== null,
        formatJSON,
        applyPreset,
        resetForm,
    };
};
