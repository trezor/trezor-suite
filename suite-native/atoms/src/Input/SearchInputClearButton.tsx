import { FadeIn, FadeOut } from 'react-native-reanimated';

import { Icon } from '@suite-native/icons';

import { AnimatedBox } from '../AnimatedBox';
import { PressableOpacity } from '../Pressable';

export type SearchInputClearButtonProps = {
    onPress: () => void;
    isVisible: boolean;
};

export const SearchInputClearButton = ({ onPress, isVisible }: SearchInputClearButtonProps) => {
    if (!isVisible) {
        return null;
    }

    return (
        <AnimatedBox entering={FadeIn} exiting={FadeOut}>
            <PressableOpacity onPress={onPress}>
                <Icon name="xCircle" size="large" color="contentSecondary" />
            </PressableOpacity>
        </AnimatedBox>
    );
};
