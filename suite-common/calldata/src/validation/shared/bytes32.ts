import { type ValidateFn, createValidator } from '../createValidator';

export const isValidBytes32: ValidateFn<string> = input =>
    /^0x[0-9a-fA-F]{64}$/.test(input) ? null : 'INVALID_BYTES32';

export const validateBytes32 = createValidator<string, `0x${string}`>({
    validate: [isValidBytes32],
    normalize: input => input.toLowerCase() as `0x${string}`,
});
