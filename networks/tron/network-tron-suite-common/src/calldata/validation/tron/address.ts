import {
    type ContextWith,
    type InspectFn,
    type ValidateFn,
    createValidator,
} from '@trezor/calldata';
import * as tronUtils from '@trezor/network-tron/utils';

import { type TronAddress } from '../../types/tron';

export const findTronAddressIssue: ValidateFn<string> = input =>
    tronUtils.tronAddressToBytes(input) !== null ? null : 'INVALID_ADDRESS';

type SenderContext = ContextWith<{ sender?: TronAddress }>;

export const findSelfAddressIssue: InspectFn<TronAddress, SenderContext> = (value, context) =>
    context?.sender && value === context.sender ? 'SELF_ADDRESS' : null;

export const validateTronAddress = createValidator<string, TronAddress, SenderContext>({
    validate: [findTronAddressIssue],
    normalize: input => input as TronAddress,
    inspect: [findSelfAddressIssue],
});
