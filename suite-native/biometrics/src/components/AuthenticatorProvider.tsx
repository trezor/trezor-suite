import { ReactNode } from 'react';

import { useBiometrics } from '../useBiometrics';
import { useIsBiometricsOverlayVisible } from '../biometricsAtoms';
import { BiometricsOverlay } from './BiometricsOverlay';

type AuthenticatorProviderProps = {
    children: ReactNode;
};

export const AuthenticatorProvider = ({ children }: AuthenticatorProviderProps) => {
    useBiometrics();
    const { isBiometricsOverlayVisible } = useIsBiometricsOverlayVisible();

    return (
        <>
            {children}
            <BiometricsOverlay isDisplayed={isBiometricsOverlayVisible} />
        </>
    );
};
