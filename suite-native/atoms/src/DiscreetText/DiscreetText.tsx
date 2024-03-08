import { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { DiscreetTextContent, DiscreetTextContentProps } from './DiscreetTextContent';
import { useDiscreetMode } from './useDiscreetMode';

type DiscreetTextProps = { children: ReactNode } & DiscreetTextContentProps;

export const DiscreetText = ({ children, ...rest }: DiscreetTextProps) => {
    const { isDiscreetMode, setIsDiscreetMode } = useDiscreetMode();

    const handlePress = () => {
        setIsDiscreetMode(!isDiscreetMode);
    };

    return (
        <Pressable onPress={handlePress}>
            <DiscreetTextContent {...rest}>{children}</DiscreetTextContent>
        </Pressable>
    );
};
