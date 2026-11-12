import { z } from 'zod';

import { type Result, err, ok } from '@trezor/type-utils';

import { type ParseJsonlError } from './parseJsonlTypes';

const formatIssue = ({ message, path }: z.core.$ZodIssue): string => {
    const issuePath = path.length > 0 ? `Path: "${z.core.toDotPath(path)}"` : undefined;

    return [message.replace(/\.$/, ''), issuePath].filter(Boolean).join('. ');
};

export const validateJsonlRecord = <T extends Record<string, unknown>>(
    record: Record<string, unknown>,
    schema: z.ZodType<T>,
    lineNumber: number,
): Result<T, Extract<ParseJsonlError, { type: 'JsonlRecordDoesNotMatchSchema' }>> => {
    const validated = schema.safeParse(record);

    if (validated.success) {
        return ok(validated.data);
    }

    const [firstIssue] = validated.error.issues;

    return err({
        type: 'JsonlRecordDoesNotMatchSchema',
        lineNumber,
        message: firstIssue ? formatIssue(firstIssue) : 'Record does not match the schema',
    });
};
