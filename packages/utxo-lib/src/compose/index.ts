import { validateAndParseRequest } from './request';
import { getErrorResult, getResult } from './result';
import { coinselect } from '../coinselect';
import {
    type ComposeChangeAddress,
    type ComposeInput,
    type ComposeOutput,
    type ComposeRequest,
    type ComposeResult,
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

    try {
        const result = coinselect(coinselectRequest);

        return getResult(request, coinselectRequest, result);
    } catch (error) {
        return getErrorResult(error);
    }
}
