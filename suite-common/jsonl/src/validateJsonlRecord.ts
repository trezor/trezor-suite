import { type ObjectSchema, ValidationError } from 'yup';

import { type Result, err, ok } from '@trezor/type-utils';

import { type ParseJsonlError } from './parseJsonlTypes';

const normalizeYupMessage = (error: ValidationError): string => {
    const message = error.message.replace(/\.$/, '');
    const path = error.path ? `Path: "${error.path}"` : undefined;

    return [message, path].filter(Boolean).join('. ');
};

export const validateJsonlRecord = <T extends Record<string, unknown>>(
    record: Record<string, unknown>,
    schema: ObjectSchema<T>,
    lineNumber: number,
): Result<T, Extract<ParseJsonlError, { type: 'JsonlRecordDoesNotMatchSchema' }>> => {
    try {
        const validated = schema.validateSync(record, {
            strict: true,
            abortEarly: true,
        }) as T;

        return ok(validated);
    } catch (error) {
        if (error instanceof ValidationError) {
            return err({
                type: 'JsonlRecordDoesNotMatchSchema',
                lineNumber,
                message: normalizeYupMessage(error),
            });
        }

        throw error;
    }
};
