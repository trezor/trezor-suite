import { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { useDiscreetMode } from './useDiscreetMode';

type DiscreetTextTriggerProps = { children: ReactNode };

export const DiscreetTextTrigger = ({ children }: DiscreetTextTriggerProps) => {
    const { isDiscreetMode, setIsDiscreetMode } = useDiscreetMode();

    const handlePress = () => {
        setIsDiscreetMode(!isDiscreetMode);
    };

    return <Pressable onPress={handlePress}>{children}</Pressable>;
};
