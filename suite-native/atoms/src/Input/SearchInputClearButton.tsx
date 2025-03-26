import { TouchableOpacity } from 'react-native';

import { Icon } from '@suite-native/icons';

export type SearchInputClearButtonProps = {
    onPress: () => void;
    isVisible: boolean;
};

export const SearchInputClearButton = ({ onPress, isVisible }: SearchInputClearButtonProps) => {
    if (!isVisible) {
        return null;
    }

    return (
        <TouchableOpacity onPress={onPress}>
            <Icon name="xCircle" size="large" color="iconSubdued" />
        </TouchableOpacity>
    );
};
