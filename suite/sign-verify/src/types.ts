import { type TranslationKey } from '@suite/intl';

export type SignVerifyPage = 'sign' | 'verify';

export type SignVerifyOutcome = 'idle' | 'signed' | 'verified' | 'failed';

/** An address the user can sign with, grouped in the picker under its category. */
export type SignAddress = {
    path: string;
    address: string;
    category?: TranslationKey;
};
