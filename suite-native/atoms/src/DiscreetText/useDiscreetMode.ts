import { useAtom } from 'jotai';

import { atomWithUnecryptedStorage } from '@suite-native/storage';

const isDiscreetModeOn = atomWithUnecryptedStorage<boolean>('isDiscreetModeOn', false);
export const useDiscreetMode = () => {
    const [isDiscreetMode, setIsDiscreetMode] = useAtom(isDiscreetModeOn);

    const handleSetIsDiscreetMode = (value: boolean) => {
        setIsDiscreetMode(value);
    };

    return {
        isDiscreetMode,
        setIsDiscreetMode: handleSetIsDiscreetMode,
    };
};
