import { type ObjectSchema } from 'yup';

import { type Result, err, ok } from '@trezor/type-utils';

import { parseJsonLine } from './parseJsonLine';
import { type ParseJsonlError } from './parseJsonlTypes';
import { validateJsonlRecord } from './validateJsonlRecord';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

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

        const validatedResult = validateJsonlRecord(parsedLineResult.payload, schema, lineNumber);

        if (!validatedResult.success) {
            return validatedResult;
        }

        parsedData.push(validatedResult.payload);
    }

    return ok(parsedData);
};
