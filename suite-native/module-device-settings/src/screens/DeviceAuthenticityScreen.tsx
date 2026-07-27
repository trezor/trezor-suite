import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, IconListTextItem, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type DeviceAuthenticityStackParamList,
    type DeviceAuthenticityStackRoutes,
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    DynamicScreenHeader,
    Screen,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList
>;

export const DeviceAuthenticityScreen = () => {
    const navigation = useNavigation<NavigationProp>();

    const navigateToDeviceAuthenticityStack = useCallback(() => {
        navigation.navigate(DeviceSettingsStackRoutes.DeviceAuthenticityStack);
    }, [navigation]);

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleDeviceSettings.authenticity.title" />}
                    subtitle={<Translation id="moduleDeviceSettings.authenticity.subtitle" />}
                />
            }
        >
            <VStack justifyContent="space-between" flex={1}>
                <VStack spacing="sp24">
                    <IconListTextItem icon="cpu" iconSize="large" textVariant="body-md-strong">
                        <Translation id="moduleDeviceSettings.authenticity.info.item1" />
                    </IconListTextItem>
                    <IconListTextItem icon="check" iconSize="large" textVariant="body-md-strong">
                        <Translation id="moduleDeviceSettings.authenticity.info.item2" />
                    </IconListTextItem>
                </VStack>
                <Box>
                    <Button
                        onPress={navigateToDeviceAuthenticityStack}
                        testID="@device-authenticity/check-button"
                    >
                        <Translation id="moduleDeviceSettings.authenticity.info.letsDoItButton" />
                    </Button>
                </Box>
            </VStack>
        </Screen>
    );
};
