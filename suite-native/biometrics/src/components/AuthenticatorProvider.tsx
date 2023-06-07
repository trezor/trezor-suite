import React, { ReactNode } from 'react';

import { useAtomValue } from 'jotai';

import { useBiometrics } from '../useBiometrics';
import { isBiometricsOverlayVisibleAtom } from '../biometricsAtoms';
import { BiometricOverlay } from './BiometricOverlay';

type AuthenticatorProviderProps = {
    children: ReactNode;
};

export const AuthenticatorProvider = ({ children }: AuthenticatorProviderProps) => {
    useBiometrics();
    const isBiometricsOverlayVisible = useAtomValue(isBiometricsOverlayVisibleAtom);

    return (
        <>
            {children}
            {isBiometricsOverlayVisible && <BiometricOverlay />}
        </>
    );
};
