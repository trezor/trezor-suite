import { useNavigation } from '@react-navigation/native';

import { Box, Button, CardWithIconLayout, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceStackRoutes,
    StackToStackCompositeNavigationProps,
    WipeDeviceStackParamList,
    WipeDeviceStackRoutes,
} from '@suite-native/navigation';

type NavigationProp = StackToStackCompositeNavigationProps<
    WipeDeviceStackParamList,
    WipeDeviceStackRoutes,
    DeviceSettingsStackParamList
>;

export const WipeDeviceCard = () => {
    const navigation = useNavigation<NavigationProp>();

    const handleRedirect = () => {
        navigation.navigate(DeviceStackRoutes.WipeDeviceStack);
    };

    return (
        <CardWithIconLayout
            title={<Translation id="moduleDeviceSettings.wipeDevice.title" />}
            icon="arrowsClockwise"
        >
            <VStack marginTop="sp2" spacing="sp16">
                <Text variant="body" color="textSubdued">
                    <Translation id="moduleDeviceSettings.wipeDevice.content" />
                </Text>
                <Box flex={1}>
                    <Button size="small" colorScheme="redBold" onPress={handleRedirect}>
                        <Translation id="moduleDeviceSettings.wipeDevice.buttonTitle" />
                    </Button>
                </Box>
            </VStack>
        </CardWithIconLayout>
    );
};
