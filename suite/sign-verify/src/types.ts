import { type ExtendedMessageDescriptor } from '@suite/intl';

export type SignVerifyPage = 'sign' | 'verify';

export type SignVerifyOutcome = 'idle' | 'signed' | 'verified' | 'failed';

/**
 * What a verification attempt settled on.
 *
 * Rejecting the prompt on the device is not a verdict on the signature — the check never ran — so
 * it is reported apart from a signature that genuinely did not verify.
 */
export type VerifyMessageResult = 'verified' | 'failed' | 'cancelled';

export type SignAddress = {
    path: string;
    address: string;
    category: ExtendedMessageDescriptor['id'] | '';
};

/** The addresses a network offers for signing, keyed by derivation path. */
export type SignAddresses = Record<string, SignAddress>;
