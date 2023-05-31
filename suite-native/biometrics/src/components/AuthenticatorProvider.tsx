import React, { ReactNode, useEffect } from 'react';

import { BiometricOverlay } from './BiometricOverlay';
import { useIsBiometricsEnabled } from '../biometricsAtoms';
import { useBiometrics } from '../useBiometrics';

type AuthenticatorProviderProps = {
    children: ReactNode;
};

export const AuthenticatorProvider = ({ children }: AuthenticatorProviderProps) => {
    const { handleAuthenticate, isUserAuthenticated } = useBiometrics();
    const { isBiometricsOptionEnabled } = useIsBiometricsEnabled();

    useEffect(() => {
        if (isBiometricsOptionEnabled) {
            const authenticate = async () => {
                console.log('call from provider');
                await handleAuthenticate();
            };
            authenticate();
        }
    }, [handleAuthenticate, isBiometricsOptionEnabled]);

    useEffect(() => {
        console.log(isUserAuthenticated, 'is authed');
    }, [isUserAuthenticated]);

    return (
        <>
            {children}
            {isBiometricsOptionEnabled && !isUserAuthenticated && <BiometricOverlay />}
        </>
    );
};
