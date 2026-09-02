const DELEGATED_IDENTITY_KEY_PATTERN = /^[0-9a-f]{64}$/i;

export const isDelegatedIdentityKey = (value: string): boolean =>
    DELEGATED_IDENTITY_KEY_PATTERN.test(value);
