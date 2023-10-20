import { atom, useAtom, useAtomValue } from 'jotai';

import { atomWithUnecryptedStorage } from '@suite-native/storage';

const isBiometricsOptionEnabledAtom = atomWithUnecryptedStorage<boolean>(
    'isBiometricsOptionEnabled',
    false,
);

const isBiometricsInitialSetupFinishedAtom = atomWithUnecryptedStorage<boolean>(
    'isBiometricsInitialSetupFinished',
    false,
);

const isUserAuthenticatedAtom = atom(false);
const isBiometricsOverlayVisibleAtom = atom(true);

export const useIsUserAuthenticated = () => {
    const [isUserAuthenticated, setIsUserAuthenticated] = useAtom(isUserAuthenticatedAtom);

    return { isUserAuthenticated, setIsUserAuthenticated };
};

export const useIsBiometricsEnabled = () => {
    const [isBiometricsOptionEnabled, setIsBiometricsOptionEnabled] = useAtom(
        isBiometricsOptionEnabledAtom,
    );

    return {
        isBiometricsOptionEnabled,
        setIsBiometricsOptionEnabled,
    };
};

export const useIsBiometricsInitialSetupFinished = () => {
    const [isBiometricsInitialSetupFinished, setIsBiometricsInitialSetupFinished] = useAtom(
        isBiometricsInitialSetupFinishedAtom,
    );

    return { isBiometricsInitialSetupFinished, setIsBiometricsInitialSetupFinished };
};

export const useIsBiometricsOverlayVisible = () => {
    const isBiometricsOptionEnabled = useAtomValue(isBiometricsOptionEnabledAtom);
    const [isBiometricsOverlayVisibleAtomValue, setBiometricsOverlayVisibleAtomValue] = useAtom(
        isBiometricsOverlayVisibleAtom,
    );

    // If biometrics option is disabled, always return false.
    const isBiometricsOverlayVisible =
        isBiometricsOptionEnabled && isBiometricsOverlayVisibleAtomValue;

    const setIsBiometricsOverlayVisible = (value: boolean) => {
        // Change value only if biometrics options is turned on to prevent showing overlay without enabled biometrics.
        setBiometricsOverlayVisibleAtomValue(isBiometricsOptionEnabled ? value : false);
    };

    return {
        isBiometricsOverlayVisible,
        setIsBiometricsOverlayVisible,
    };
};
