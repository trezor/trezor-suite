import React, { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { useAtom } from 'jotai';

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
    const [_, setIsDevButtonVisible] = useAtom(isDevButtonVisibleAtom);

    const handleTapsCount = async () => {
        if (tapsCount < 7) {
            tapsCount++;
        }
        if (tapsCount === 7) {
            await setIsDevButtonVisible(true);
        }
    };

    return <Pressable onPress={handleTapsCount}>{children}</Pressable>;
};
