import { createContext } from 'react';

import { type TxKeyPath } from '@suite-native/intl';

export type SignVerifyPage = 'sign' | 'verify';

export type SignVerifyOutcome = 'idle' | 'signed' | 'verified' | 'failed';

export type SignVerifyValues = {
    path: string;
    address: string;
    message: string;
    hex: boolean;
    signature: string;
};

export type SignVerifyErrors = Partial<Record<keyof SignVerifyValues, TxKeyPath>>;

type SignVerifyContextValue = {
    page: SignVerifyPage;
    changePage: (page: SignVerifyPage) => void;
    outcome: SignVerifyOutcome;
    setOutcome: (page: SignVerifyPage, outcome: SignVerifyOutcome) => void;
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
};
