import { type ValidateFn, createValidator } from '../createValidator';

// ABI `bytes` is dynamic, so unlike `bytes32` there is no width to check — only that the blob is
// hex and whole. An empty `0x` is legitimate: it is how a resolver reports an unanswered profile.
export const findBytesIssue: ValidateFn<string> = input =>
    /^0x([0-9a-fA-F]{2})*$/.test(input) ? null : 'INVALID_BYTES';

export const validateBytes = createValidator<string, `0x${string}`>({
    validate: [findBytesIssue],
    normalize: input => input.toLowerCase() as `0x${string}`,
});
