import { useNavigation } from '@react-navigation/native';

import { IconButton } from '@suite-native/atoms';

import { CloseActionType } from '../navigators';

type GoBackIconProps = {
    closeActionType?: CloseActionType;
    closeAction?: () => void;
};

export const GoBackIcon = ({ closeActionType = 'back', closeAction }: GoBackIconProps) => {
    const navigation = useNavigation();

    const handleGoBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
        if (closeAction) {
            closeAction();
        }
    };

    return (
        <IconButton
            iconName={closeActionType === 'back' ? 'chevronLeft' : 'close'}
            size="medium"
            colorScheme="tertiaryElevation0"
            onPress={handleGoBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
        />
    );
};
