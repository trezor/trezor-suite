import { createContext } from 'react';

export type SignVerifyPage = 'sign' | 'verify';

export type SignVerifyOutcome = 'idle' | 'signed' | 'verified' | 'failed';

export type SignVerifyValues = {
    path: string;
    address: string;
    message: string;
    hex: boolean;
    signature: string;
    pubKey: string;
    format: string;
};

type SignVerifyContextValue = {
    page: SignVerifyPage;
    changePage: (page: SignVerifyPage) => void;
    outcome: SignVerifyOutcome;
    setOutcome: (page: SignVerifyPage, outcome: SignVerifyOutcome) => void;
};

export const SignVerifyContext = createContext<SignVerifyContextValue | null>(null);

export const EMPTY_VALUES: SignVerifyValues = {
    path: '',
    address: '',
    message: '',
    hex: false,
    signature: '',
    pubKey: '',
    format: '',
};
