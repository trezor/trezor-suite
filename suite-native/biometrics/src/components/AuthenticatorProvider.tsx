import React, { ReactNode } from 'react';

import { BiometricOverlay } from './BiometricOverlay';
import { useIsBiometricsEnabled } from '../biometricsAtoms';
import { useBiometrics } from '../useBiometrics';

type AuthenticatorProviderProps = {
    children: ReactNode;
};

export const AuthenticatorProvider = ({ children }: AuthenticatorProviderProps) => {
    const { isUserAuthenticated } = useBiometrics();
    const { isBiometricsOptionEnabled } = useIsBiometricsEnabled();

    return (
        <>
            {children}
            {isBiometricsOptionEnabled && !isUserAuthenticated && <BiometricOverlay />}
        </>
    );
};
