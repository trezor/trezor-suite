import { createValidator } from '../createValidator';

/** A free-form string ABI parameter — an ENS text record key, for instance. */
export const validateText = createValidator<string, string>({
    validate: [],
    normalize: input => input,
});
