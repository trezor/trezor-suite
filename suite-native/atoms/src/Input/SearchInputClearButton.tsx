import { TouchableOpacity } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { Icon } from '@suite-native/icons';

import { AnimatedBox } from '../Box';

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
            <TouchableOpacity onPress={onPress}>
                <Icon name="xCircle" size="large" color="iconSubdued" />
            </TouchableOpacity>
        </AnimatedBox>
    );
};
