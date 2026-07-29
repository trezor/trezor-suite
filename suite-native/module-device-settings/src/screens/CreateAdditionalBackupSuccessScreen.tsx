import { useNavigation } from '@react-navigation/native';

import { Box, Button, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type CreateAdditionalBackupStackParamList,
    CreateAdditionalBackupStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
    useNavigateToInitialScreen,
    useOverrideBackNavigation,
} from '@suite-native/navigation';

type NavigationProps = StackNavigationProps<
    CreateAdditionalBackupStackParamList,
    CreateAdditionalBackupStackRoutes.Success
>;

export const CreateAdditionalBackupSuccessScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const handleContinue = () => {
        navigation.navigate(CreateAdditionalBackupStackRoutes.Recap);
    };

    useOverrideBackNavigation({ onNavigateBack: navigateToInitialScreen });

    return (
        <Screen
            header={
                <ScreenHeader closeActionType="close" closeAction={navigateToInitialScreen} />
            }
        >
            <VStack flex={1} justifyContent="space-between" alignItems="center">
                <Box flex={1} justifyContent="center" alignItems="center">
                    <PictogramTitleHeader
                        titleVariant="headline-md"
                        variant="success"
                        title={
                            <Translation id="moduleCreateAdditionalBackup.successScreen.title" />
                        }
                        subtitle={
                            <Translation id="moduleCreateAdditionalBackup.successScreen.subtitle" />
                        }
                    />
                </Box>
                <Button onPress={handleContinue} isFullWidth>
                    <Translation id="generic.buttons.continue" />
                </Button>
            </VStack>
        </Screen>
    );
};
