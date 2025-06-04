import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Box, Button, CardWithIconLayout, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings
>;

export const WipeDeviceCard = () => {
    const navigation = useNavigation<NavigationProp>();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const handleRedirect = () => {
        navigation.navigate(DeviceSettingsStackRoutes.WipeDeviceStack);
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
                    <Button
                        size="small"
                        colorScheme="redBold"
                        onPress={handleRedirect}
                        isDisabled={isDiscoveryRunning}
                        isLoading={isDiscoveryRunning}
                    >
                        <Translation id="moduleDeviceSettings.wipeDevice.buttonTitle" />
                    </Button>
                </Box>
            </VStack>
        </CardWithIconLayout>
    );
};
