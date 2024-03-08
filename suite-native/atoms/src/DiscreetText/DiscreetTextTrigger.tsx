import { Pressable } from 'react-native';
import { ReactNode } from 'react';

import { useDiscreetMode } from './useDiscreetMode';

type DiscreetTextProps = { children: ReactNode };

export const DiscreetTextTrigger = ({ children }: DiscreetTextProps) => {
    const { isDiscreetMode, setIsDiscreetMode } = useDiscreetMode();

    const handlePress = () => {
        setIsDiscreetMode(!isDiscreetMode);
    };

    return <Pressable onPress={handlePress}>{children}</Pressable>;
};
