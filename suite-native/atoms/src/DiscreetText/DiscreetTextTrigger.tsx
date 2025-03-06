import { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { useDiscreetMode } from './useDiscreetMode';

type DiscreetTextTriggerProps = { children: ReactNode; testID?: string };

export const DiscreetTextTrigger = ({ children, testID }: DiscreetTextTriggerProps) => {
    const { isDiscreetMode, setIsDiscreetMode } = useDiscreetMode();

    const handlePress = () => {
        setIsDiscreetMode(!isDiscreetMode);
    };

    return (
        <Pressable onPress={handlePress} testID={testID}>
            {children}
        </Pressable>
    );
};
