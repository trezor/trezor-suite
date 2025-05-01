import { useSelector } from 'react-redux';

import { selectDeviceModel } from '@suite-common/wallet-core';
import { Box, HStack, Image, InlineAlertBox, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DeviceModelInternal } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const singleImageStyle = prepareNativeStyle(() => ({
    height: 240,
    width: 240,
}));

const duoImageStyle = prepareNativeStyle(() => ({
    height: 170,
    width: 170,
}));

export const SecuritySealImages = () => {
    const { applyStyle } = useNativeStyles();
    const deviceModel = useSelector(selectDeviceModel);

    if (deviceModel === DeviceModelInternal.T3T1 || deviceModel === DeviceModelInternal.T2T1) {
        return (
            <Box alignItems="center">
                <Image
                    source={
                        deviceModel === DeviceModelInternal.T3T1
                            ? require('../assets/t3t1Seal.png')
                            : require('../assets/t2t1Seal.png')
                    }
                    contentFit="contain"
                    style={applyStyle(singleImageStyle)}
                />
            </Box>
        );
    }

    return (
        <VStack spacing="sp24" alignItems="center">
            <HStack justifyContent="space-between" flex={1}>
                <Image
                    source={require('../assets/t3b1Seal1.png')}
                    contentFit="contain"
                    style={applyStyle(duoImageStyle)}
                />
                <Image
                    source={require('../assets/t3b1Seal2.png')}
                    contentFit="contain"
                    style={applyStyle(duoImageStyle)}
                />
            </HStack>
            <InlineAlertBox
                variant="info"
                title={
                    <Translation id="moduleDeviceOnboarding.securityCheckScreen.step2.modal.alertBox" />
                }
            />
        </VStack>
    );
};
