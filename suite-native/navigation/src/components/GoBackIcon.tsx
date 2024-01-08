import { useNavigation } from '@react-navigation/native';

import { IconButton } from '@suite-native/atoms';

export const GoBackIcon = () => {
    const navigation = useNavigation();

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <IconButton
            iconName="chevronLeft"
            size="medium"
            colorScheme="tertiaryElevation0"
            onPress={handleGoBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
        />
    );
};
