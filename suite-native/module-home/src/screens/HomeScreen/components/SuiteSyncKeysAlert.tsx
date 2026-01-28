import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useNativeServices } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { exhaustive } from '@trezor/type-utils';

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

export const SuiteSyncKeysAlert = () => {
    const { applyStyle } = useNativeStyles();
    const { suiteSync } = useNativeServices();
    const { showToast } = useToast();
    const selectedDevice = useSelector(selectSelectedDevice);
    const shouldDisplaySuiteSyncAlert = useSelector(selectShouldDisplaySuiteSyncAlert);

    if (!shouldDisplaySuiteSyncAlert) return null;

    const turnOnSuiteSync = async () => {
        const result = await suiteSync.turnOnSuiteSync({
            deviceStaticSessionId: selectedDevice?.state?.staticSessionId,
        });

        if (!result.success) {
            const { type } = result.error;
            switch (type) {
                case 'SuiteSyncUnavailableOnDeviceError':
                case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
                case 'DeviceCancelled':
                case 'DeviceError':
                    showToast({ variant: 'error', icon: 'warning', message: type });

                    return;
                default:
                    return exhaustive(type);
            }
        }
    };

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
                <Button size="small" colorScheme="blueBold" onPress={turnOnSuiteSync}>
                    <Translation id="moduleHome.suiteSyncAlert.button" />
                </Button>
            </VStack>
        </Animated.View>
    );
};
