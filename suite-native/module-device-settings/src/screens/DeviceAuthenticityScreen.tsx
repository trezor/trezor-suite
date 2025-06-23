import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, IconListTextItem, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    Screen,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
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
        <Screen header={<ScreenHeader />}>
            <VStack justifyContent="space-between" flex={1}>
                <VStack spacing="sp32" marginTop="sp16">
                    <VStack>
                        <Text variant="titleMedium">
                            <Translation id="moduleDeviceSettings.authenticity.title" />
                        </Text>
                        <Text color="textSubdued">
                            <Translation id="moduleDeviceSettings.authenticity.subtitle" />
                        </Text>
                    </VStack>

                    <VStack spacing="sp24">
                        <IconListTextItem icon="cpu" iconSize="large" textVariant="highlight">
                            <Translation id="moduleDeviceSettings.authenticity.info.item1" />
                        </IconListTextItem>
                        <IconListTextItem icon="check" iconSize="large" textVariant="highlight">
                            <Translation id="moduleDeviceSettings.authenticity.info.item2" />
                        </IconListTextItem>
                    </VStack>
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
