import { Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
import {
    useAuthorizeDevice,
    useDetectDeviceError,
    useReportDeviceConnectToAnalytics,
} from '@suite-native/device';
import { useTranslate } from '@suite-native/intl';

import { ConnectDeviceBackground } from '../components/ConnectDeviceBackground';

const screenStyle = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
}));

export const ConnectingDeviceScreen = () => {
    useDetectDeviceError();
    useAuthorizeDevice();
    useReportDeviceConnectToAnalytics();
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    return (
        <ConnectDeviceBackground style={applyStyle(screenStyle)} shouldShowDeviceManager>
            <VStack spacing="medium" alignItems="center">
                <VStack spacing="extraLarge" alignItems="center">
                    <Icon name="trezor" size="extraLarge" />
                    <Text variant="titleMedium">
                        {translate('moduleConnectDevice.connectingDeviceScreen.title')}
                    </Text>
                </VStack>
                <Text variant="highlight" color="textSubdued">
                    {translate('moduleConnectDevice.connectingDeviceScreen.hodlOn')}
                </Text>
            </VStack>
        </ConnectDeviceBackground>
    );
};
