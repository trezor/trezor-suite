import { type TronAddress } from '../../types/tron';
import { type ContextWith } from '../../types/validation';
import { type InspectFn, type ValidateFn, createValidator } from '../createValidator';

const BASE58_REGEX = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{34}$/;

export const isValidTronAddress: ValidateFn<string> = input =>
    BASE58_REGEX.test(input) && input.startsWith('T') ? null : 'INVALID_ADDRESS';

type SenderContext = ContextWith<{ sender?: TronAddress }>;

export const isSameAsSender: InspectFn<TronAddress, SenderContext> = (value, context) =>
    context?.sender && value === context.sender ? 'SELF_ADDRESS' : null;

export const validateTronAddress = createValidator<string, TronAddress, SenderContext>({
    validate: [isValidTronAddress],
    normalize: input => input as TronAddress,
    inspect: [isSameAsSender],
});
