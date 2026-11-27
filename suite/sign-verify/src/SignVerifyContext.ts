import { createContext } from 'react';

export type SignVerifyPage = 'sign' | 'verify';

export type SignVerifyOutcome = 'idle' | 'signed' | 'verified' | 'failed';

type SignVerifyContextValue = {
    page: SignVerifyPage;
    changePage: (page: SignVerifyPage) => void;
    outcome: SignVerifyOutcome;
    setOutcome: (page: SignVerifyPage, outcome: SignVerifyOutcome) => void;
};

export const SignVerifyContext = createContext<SignVerifyContextValue | null>(null);
