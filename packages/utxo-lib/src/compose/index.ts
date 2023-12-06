import { validateAndParseRequest } from './request';
import { getResult, getErrorResult } from './result';
import { coinselect } from './coinselect';
import {
    ComposeRequest,
    ComposeInput,
    ComposeOutput,
    ComposeChangeAddress,
    ComposeResult,
} from '../types';

export function composeTx<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    Change extends ComposeChangeAddress,
>(request: ComposeRequest<Input, Output, Change>): ComposeResult<Input, Output, Change> {
    const coinselectRequest = validateAndParseRequest(request);
    if ('error' in coinselectRequest) {
        return coinselectRequest;
    }

    let result: ReturnType<typeof coinselect> = { success: false };
    try {
        result = coinselect(coinselectRequest);
    } catch (error) {
        return getErrorResult(error);
    }

    if (!result.success) {
        return { type: 'error', error: 'NOT-ENOUGH-FUNDS' };
    }

    return getResult(request, result);
}
