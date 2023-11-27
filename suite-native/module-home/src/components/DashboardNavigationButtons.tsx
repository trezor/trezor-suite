import { useNavigation } from '@react-navigation/native';

import { Box, Button, Divider, VStack } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

export const DashboardNavigationButtons = () => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, {});
    };

    return (
        <VStack spacing="large">
            <Divider />
            <Box marginHorizontal="medium">
                <Button
                    data-testID="@home/portolio/recieve-button"
                    size="large"
                    onPress={handleReceive}
                    iconLeft="receive"
                >
                    Receive
                </Button>
            </Box>
        </VStack>
    );
};
