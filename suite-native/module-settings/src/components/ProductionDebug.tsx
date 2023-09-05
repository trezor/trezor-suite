import { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { useSetAtom } from 'jotai';

import { isDevelopOrDebugEnv } from '@suite-native/config';
import { atomWithUnecryptedStorage } from '@suite-native/storage';

type ProductionDebugProps = {
    children: ReactNode;
};

let tapsCount = 0;
export const isDevButtonVisibleAtom = atomWithUnecryptedStorage<boolean>(
    'isDevUtilsScreenVisible',
    isDevelopOrDebugEnv(),
);

export const ProductionDebug = ({ children }: ProductionDebugProps) => {
    const setIsDevButtonVisible = useSetAtom(isDevButtonVisibleAtom);

    const handleTapsCount = () => {
        if (tapsCount < 7) {
            tapsCount++;
        }
        if (tapsCount === 7) {
            setIsDevButtonVisible(true);
        }
    };

    return <Pressable onPress={handleTapsCount}>{children}</Pressable>;
};
