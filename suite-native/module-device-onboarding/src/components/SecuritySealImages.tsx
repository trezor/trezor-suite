import { useSelector } from 'react-redux';

import { selectDeviceModel } from '@suite-common/device';
import { Box, HStack, Image, InlineAlertBox, VStack } from '@suite-native/atoms';
import { type SetupSupportingDeviceModel } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { DeviceModelInternal } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const securitySealImagesMap = {
    [DeviceModelInternal.T2T1]: [require('../assets/t2t1-seal.webp')],
    [DeviceModelInternal.T2B1]: [
        require('../assets/t3b1-seal-v1.webp'),
        require('../assets/t3b1-seal-v2.webp'),
    ],
    [DeviceModelInternal.T3B1]: [
        require('../assets/t3b1-seal-v1.webp'),
        require('../assets/t3b1-seal-v2.webp'),
    ],
    [DeviceModelInternal.T3T1]: [require('../assets/t3t1-seal.webp')],
    [DeviceModelInternal.T3W1]: [require('../assets/t3w1-seal.webp')],
} as const satisfies Record<SetupSupportingDeviceModel, string[]>;

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
    const deviceModel = useSelector(selectDeviceModel) as SetupSupportingDeviceModel;

    const images = securitySealImagesMap[deviceModel];

    if (images.length < 2) {
        return (
            <Box alignItems="center">
                <Image
                    source={images[0]}
                    contentFit="contain"
                    style={applyStyle(singleImageStyle)}
                />
            </Box>
        );
    }

    return (
        <VStack spacing="sp24" alignItems="center">
            <HStack justifyContent="space-between" flex={1}>
                <Image source={images[0]} contentFit="contain" style={applyStyle(duoImageStyle)} />
                <Image source={images[1]} contentFit="contain" style={applyStyle(duoImageStyle)} />
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
