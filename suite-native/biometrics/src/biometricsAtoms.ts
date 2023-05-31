import { useAtom } from 'jotai';

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
