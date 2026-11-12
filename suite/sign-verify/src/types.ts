import { type TranslationKey } from '@suite/intl';

export type SignVerifyPage = 'sign' | 'verify';

export type SignVerifyOutcome = 'idle' | 'signed' | 'verified' | 'failed';

/** What the device returned for a signed message. */
export type SignedMessage = {
    signature: string;
    pubKey?: string;
};

/** An address the user can sign with, grouped in the picker under its category. */
export type SignAddress = {
    path: string;
    address: string;
    category?: TranslationKey;
};
