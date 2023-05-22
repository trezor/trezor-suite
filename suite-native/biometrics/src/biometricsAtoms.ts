import { atom, useAtom } from 'jotai';

import { atomWithUnecryptedStorage } from '@suite-native/storage';

const isBiometricsOptionEnabledAtom = atomWithUnecryptedStorage<boolean>(
    'isBiometricsOptionEnabled',
    false,
);

export const useIsBiometricsEnabled = () => {
    const [isBiometricsOptionEnabled, setIsBiometricsOptionEnabled] = useAtom(
        isBiometricsOptionEnabledAtom,
    );

    return {
        isBiometricsOptionEnabled,
        setIsBiometricsOptionEnabled,
    };
};

const isUserAuthenticatedAtom = atom(false);
export const useIsUserAuthenticated = () => {
    const [isUserAuthenticated, setIsUserAuthenticated] = useAtom(isUserAuthenticatedAtom);

    return { isUserAuthenticated, setIsUserAuthenticated };
};
