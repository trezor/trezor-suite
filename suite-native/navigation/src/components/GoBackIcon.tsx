import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { IconButton } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { type CloseActionType } from '../navigators';

type GoBackIconProps = {
    closeActionType?: CloseActionType;
    closeAction?: () => void;
    testID?: string;
};

export const GoBackIcon = ({ closeActionType = 'back', closeAction, testID }: GoBackIconProps) => {
    const navigation = useNavigation();
    const { translate } = useTranslate();

    const handleGoBack = useCallback(() => {
        if (closeAction) {
            closeAction();
        } else if (navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [closeAction, navigation]);

    return (
        <IconButton
            testID={testID}
            iconName={closeActionType === 'back' ? 'caretLeft' : 'x'}
            intent="neutral"
            priority="secondary"
            size="medium"
            onPress={handleGoBack}
            accessibilityRole="button"
            accessibilityLabel={translate('generic.buttons.goBack')}
        />
    );
};
