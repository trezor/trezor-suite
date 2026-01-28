import { useCallback } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceStaticSessionId, selectIsDeviceConnected } from '@suite-common/wallet-core';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useNativeServices } from '@suite-native/services';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { selectShouldDisplaySuiteSyncAlert } from '../homescreenSelectors';

const containerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: utils.borders.radii.r12,
    borderWidth: 1,
    borderColor: utils.colors.backgroundAlertBlueSubtleOnElevationNegative,
    backgroundColor: utils.colors.backgroundAlertBlueSubtleOnElevation1,
    padding: utils.spacings.sp16,
    gap: utils.spacings.sp12,
    marginHorizontal: utils.spacings.sp16,
}));

const flex1Style = {
    flex: 1,
};

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const SuiteSyncKeysAlert = () => {
    const { applyStyle } = useNativeStyles();
    const { suiteSync } = useNativeServices();

    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const shouldDisplaySuiteSyncAlert = useSelector(selectShouldDisplaySuiteSyncAlert);
    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);

    const navigation = useNavigation<NavigationProp>();

    const allowSuiteSyncForWallet = useCallback(async () => {
        if (!deviceStaticSessionId) return;

        if (!isDeviceConnected) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
            });
        } else {
            await suiteSync.ensureWalletSuiteSyncOn({
                deviceStaticSessionId,
            });
        }
    }, [deviceStaticSessionId, isDeviceConnected, navigation, suiteSync]);

    if (!shouldDisplaySuiteSyncAlert) return null;

    return (
        <Animated.View style={applyStyle(containerStyle)} entering={FadeIn} exiting={FadeOut}>
            <Icon name="info" size="large" />
            <VStack spacing="sp12" style={flex1Style}>
                <Box>
                    <Text variant="highlight">
                        <Translation id="moduleHome.suiteSyncAlert.title" />
                    </Text>
                    <Text>
                        <Translation id="moduleHome.suiteSyncAlert.description" />
                    </Text>
                </Box>
                <Button size="small" colorScheme="blueBold" onPress={allowSuiteSyncForWallet}>
                    <Translation id="moduleHome.suiteSyncAlert.button" />
                </Button>
            </VStack>
        </Animated.View>
    );
};
