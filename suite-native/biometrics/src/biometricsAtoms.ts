import { atom, useAtom } from 'jotai';

import { atomWithUnecryptedStorage } from '@suite-native/storage';

const isBiometricsOptionEnabledAtom = atomWithUnecryptedStorage<boolean>(
    'isBiometricsOptionEnabled',
    false,
);

const isUserAuthenticatedAtom = atom(false);

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
