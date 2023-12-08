import { useNavigation } from '@react-navigation/native';

import { IconButton } from '@suite-native/atoms';

type GoBackIconProps = {
    customGoBackFunction?: () => void;
};

export const GoBackIcon = ({ customGoBackFunction }: GoBackIconProps) => {
    const navigation = useNavigation();

    const handleGoBack = () => {
        if (customGoBackFunction) {
            customGoBackFunction();
            return;
        }
        navigation.goBack();
    };

    return (
        <IconButton
            iconName="chevronLeft"
            size="medium"
            colorScheme="tertiaryElevation0"
            onPress={handleGoBack}
        />
    );
};
