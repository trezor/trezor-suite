import { type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { useAtom } from 'jotai';

import { isDevUtilsEnabledAtom } from '@suite-native/storage';
import { useToast } from '@suite-native/toasts';

type ProductionDebugProps = {
    children: ReactNode;
};

let tapsCount = 0;

export const ProductionDebug = ({ children }: ProductionDebugProps) => {
    const [isDevUtilsEnabled, setIsDevUtilsEnabled] = useAtom(isDevUtilsEnabledAtom);
    const { showToast } = useToast();

    const handleTapsCount = () => {
        if (tapsCount < 7) {
            tapsCount++;
        }
        if (tapsCount === 7) {
            tapsCount = 0;
            showToast({
                intent: 'neutral',
                message: `Dev utils ${isDevUtilsEnabled ? 'disabled' : 'enabled'}.`,
                icon: 'check',
            });
            setIsDevUtilsEnabled(!isDevUtilsEnabled);
        }
    };

    return <Pressable onPress={handleTapsCount}>{children}</Pressable>;
};
