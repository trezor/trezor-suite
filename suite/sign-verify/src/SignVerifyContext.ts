import { createContext } from 'react';

import { type TranslationKey } from '@suite/intl';

export type SignVerifyPage = 'sign' | 'verify';

export type SignVerifyOutcome = 'idle' | 'signed' | 'verified' | 'failed';

export type SignVerifyValues = {
    path: string;
    address: string;
    message: string;
    hex: boolean;
    signature: string;
    pubKey: string;
};

export type SignVerifyErrors = Partial<Record<keyof SignVerifyValues, TranslationKey>>;

type SignVerifyContextValue = {
    page: SignVerifyPage;
    changePage: (page: SignVerifyPage) => void;
    outcome: SignVerifyOutcome;
    setOutcome: (outcome: SignVerifyOutcome) => void;
};

type SignVerifyFormContextValue = {
    values: SignVerifyValues;
    errors: SignVerifyErrors;
    update: (changes: Partial<SignVerifyValues>) => void;
};

export const SignVerifyContext = createContext<SignVerifyContextValue | null>(null);

export const SignVerifyFormContext = createContext<SignVerifyFormContextValue | null>(null);

export const EMPTY_VALUES: SignVerifyValues = {
    path: '',
    address: '',
    message: '',
    hex: false,
    signature: '',
    pubKey: '',
};
