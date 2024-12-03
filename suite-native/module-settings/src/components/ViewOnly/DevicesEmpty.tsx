import { LottieAnimation, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { About, AboutProps } from './About';
import connectTrezorLottie from '../../assets/connect-trezor-lottie.json';

export const DevicesEmpty = ({ onPressAbout }: AboutProps) => {
    return (
        <VStack flex={1} alignItems="center" justifyContent="center" spacing="sp24">
            <LottieAnimation source={connectTrezorLottie} />
            <VStack marginHorizontal="sp24">
                <Text variant="titleSmall" textAlign="center">
                    <Translation id="moduleSettings.viewOnly.emptyTitle" />
                </Text>
                <About onPressAbout={onPressAbout} />
            </VStack>
        </VStack>
    );
};
