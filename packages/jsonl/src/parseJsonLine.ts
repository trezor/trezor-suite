import { type Result, err, ok } from '@trezor/type-utils';

import { type ParseJsonlError } from './parseJsonlTypes';

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
};

export const parseJsonLine = (
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
