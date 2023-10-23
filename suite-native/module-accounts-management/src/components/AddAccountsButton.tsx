import { useNavigation } from '@react-navigation/native';

import {
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { IconButton } from '@suite-native/atoms';

export const AddAccountButton = () => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountsImport>>();

    const navigateToImportScreen = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    return (
        <IconButton
            iconName="plus"
            onPress={navigateToImportScreen}
            colorScheme="tertiaryElevation0"
            size="medium"
        />
    );
};
