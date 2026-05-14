import { type ObjectSchema, ValidationError } from 'yup';

import { type Result, err, ok } from '@trezor/type-utils';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
};

export type ParseJsonlError =
    | {
          type: 'JsonlInvalidJson';
          lineNumber: number;
          message: string;
      }
    | {
          type: 'JsonlRecordIsNotObject';
          lineNumber: number;
      }
    | {
          type: 'JsonlRecordDoesNotMatchSchema';
          lineNumber: number;
          message: string;
      };

const normalizeYupMessage = (error: ValidationError): string => {
    const message = error.message.replace(/\.$/, '');
    const path = error.path ? `Path: "${error.path}"` : undefined;

    return [message, path].filter(Boolean).join('. ');
};

const parseJsonLine = (
    line: string,
    lineNumber: number,
): Result<unknown, Extract<ParseJsonlError, { type: 'JsonlInvalidJson' }>> => {
    try {
        return ok(JSON.parse(line) as unknown);
    } catch (error) {
        return err({
            type: 'JsonlInvalidJson',
            lineNumber,
            message: getErrorMessage(error),
        });
    }
};

export const parseJsonl = <T extends Record<string, unknown>>(
    content: string,
    schema: ObjectSchema<T>,
): Result<T[], ParseJsonlError> => {
    const parsedData: T[] = [];

    const lines = content
        .split(/\r?\n/)
        .map((line, index) => ({
            line: line.trim(),
            lineNumber: index + 1,
        }))
        .filter(({ line }) => line.length > 0);

    for (const { line, lineNumber } of lines) {
        const parsedLineResult = parseJsonLine(line, lineNumber);

        if (!parsedLineResult.success) {
            return parsedLineResult;
        }

        if (!isRecord(parsedLineResult.payload)) {
            return err({
                type: 'JsonlRecordIsNotObject',
                lineNumber,
            });
        }

        try {
            const validatedRecord = schema.validateSync(parsedLineResult.payload, {
                strict: true,
                abortEarly: true,
            }) as T;

            parsedData.push(validatedRecord);
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
    }

    return ok(parsedData);
};
