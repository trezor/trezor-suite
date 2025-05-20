import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Button, CardWithIconLayout, IconListTextItem, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList
>;

export const DeviceAuthenticityCard = () => {
    const navigation = useNavigation<NavigationProp>();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { showAlert } = useAlert();

    const navigateToDeviceAuthenticityStack = useCallback(() => {
        navigation.navigate(DeviceSettingsStackRoutes.DeviceAuthenticityStack);
    }, [navigation]);

    const showInfoAlert = useCallback(() => {
        showAlert({
            title: <Translation id="moduleDeviceSettings.authenticity.info.title" />,
            textAlign: 'left',
            appendix: (
                <VStack spacing="sp24">
                    <IconListTextItem icon="shieldCheck">
                        <Translation id="moduleDeviceSettings.authenticity.info.item1" />
                    </IconListTextItem>
                    <IconListTextItem icon="cpu">
                        <Translation id="moduleDeviceSettings.authenticity.info.item2" />
                    </IconListTextItem>
                    <IconListTextItem icon="check">
                        <Translation id="moduleDeviceSettings.authenticity.info.item3" />
                    </IconListTextItem>
                </VStack>
            ),
            primaryButtonTitle: (
                <Translation id="moduleDeviceSettings.authenticity.info.letsDoItButton" />
            ),
            onPressPrimaryButton: navigateToDeviceAuthenticityStack,
        });
    }, [showAlert, navigateToDeviceAuthenticityStack]);

    return (
        <CardWithIconLayout
            icon="shieldCheck"
            title={<Translation id="moduleDeviceSettings.authenticity.title" />}
        >
            <VStack marginTop="sp2" spacing="sp16">
                <Text variant="body" color="textSubdued">
                    <Translation id="moduleDeviceSettings.authenticity.content" />
                </Text>
                <Button
                    size="small"
                    colorScheme="tertiaryElevation0"
                    onPress={showInfoAlert}
                    testID="@device-authenticity/check-button"
                    disabled={isDiscoveryRunning}
                    isLoading={isDiscoveryRunning}
                >
                    <Translation id="moduleDeviceSettings.authenticity.checkButton" />
                </Button>
            </VStack>
        </CardWithIconLayout>
    );
};
