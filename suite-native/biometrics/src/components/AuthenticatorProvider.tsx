import React, { ReactNode } from 'react';

type AuthenticatorProviderProps = {
    children: ReactNode;
};

export const AuthenticatorProvider = ({ children }: AuthenticatorProviderProps) => (
    <>
        {children}
        {/* {shouldShowBiometricOverlay && isBiometricsOptionEnabled && <BiometricOverlay />} */}
    </>
);
