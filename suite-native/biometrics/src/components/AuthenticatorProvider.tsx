import React, { ReactNode } from 'react';

import { useBiometrics } from '../useBiometrics';

type AuthenticatorProviderProps = {
    children: ReactNode;
};

export const AuthenticatorProvider = ({ children }: AuthenticatorProviderProps) => {
    useBiometrics();

    return <>{children}</>;
};
