import { type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { useSetAtom } from 'jotai';

import { isDevUtilsEnabledAtom } from '@suite-native/storage';
import { useToast } from '@suite-native/toasts';

type ProductionDebugProps = {
    children: ReactNode;
};

let tapsCount = 0;

export const ProductionDebug = ({ children }: ProductionDebugProps) => {
    const setIsDevUtilsEnabled = useSetAtom(isDevUtilsEnabledAtom);
    const { showToast } = useToast();

    const handleTapsCount = () => {
        if (tapsCount < 7) {
            tapsCount++;
        }
        if (tapsCount === 7) {
            setIsDevUtilsEnabled(true);
            showToast({
                intent: 'neutral',
                message: 'Dev utils enabled.',
                icon: 'check',
            });
        }
    };

    return <Pressable onPress={handleTapsCount}>{children}</Pressable>;
};
