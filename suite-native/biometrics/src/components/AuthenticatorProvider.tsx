import React, { ReactNode } from 'react';

import { BiometricOverlay } from './BiometricOverlay';
import { useBiometrics } from '../useBiometrics';

type AuthenticatorProviderProps = {
    children: ReactNode;
};

export const AuthenticatorProvider = ({ children }: AuthenticatorProviderProps) => {
    const { shouldShowBiometricOverlay } = useBiometrics();

    return (
        <>
            {children}
            {shouldShowBiometricOverlay && <BiometricOverlay />}
        </>
    );
};
