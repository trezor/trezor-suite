import { useSelector } from 'react-redux';

import { selectDeviceModel } from '@suite-common/wallet-core';
import { AlertBox, Box, HStack, Image, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DeviceModelInternal } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const T3T1ImageStyle = prepareNativeStyle(() => ({
    height: 240,
    width: 240,
}));

const T3B1ImageStyle = prepareNativeStyle(() => ({
    height: 170,
    width: 170,
}));

export const SecuritySealImages = () => {
    const { applyStyle } = useNativeStyles();
    const deviceModel = useSelector(selectDeviceModel);

    if (deviceModel === DeviceModelInternal.T3T1) {
        return (
            <Box alignItems="center">
                <Image
                    source={require('../assets/t3t1Seal.png')}
                    contentFit="contain"
                    style={applyStyle(T3T1ImageStyle)}
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
                    style={applyStyle(T3B1ImageStyle)}
                />
                <Image
                    source={require('../assets/t3b1Seal2.png')}
                    contentFit="contain"
                    style={applyStyle(T3B1ImageStyle)}
                />
            </HStack>
            <AlertBox
                variant="info"
                textVariant="hint"
                contentColor="textDefault"
                title={
                    <Translation id="moduleDeviceOnboarding.securityCheckScreen.step2.modal.alertBox" />
                }
            />
        </VStack>
    );
};
