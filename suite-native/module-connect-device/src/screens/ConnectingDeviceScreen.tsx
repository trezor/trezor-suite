import { ActivityIndicator } from 'react-native';

import { Text, VStack, Box } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
import {
    useAuthorizeDevice,
    useDetectDeviceError,
    useReportDeviceConnectToAnalytics,
} from '@suite-native/device';
import { Translation } from '@suite-native/intl';

import { ConnectDeviceSreenView } from '../components/ConnectDeviceSreenView';

const screenStyle = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 150,
}));

export const ConnectingDeviceScreen = () => {
    useDetectDeviceError();
    useAuthorizeDevice();
    useReportDeviceConnectToAnalytics();
    const { applyStyle } = useNativeStyles();

    return (
        <ConnectDeviceSreenView style={applyStyle(screenStyle)}>
            <VStack spacing="medium" alignItems="center">
                <ActivityIndicator size="large" />
                <Box flexDirection="row" alignItems="center">
                    <Text variant="titleMedium">
                        <Translation id="moduleConnectDevice.connectingDeviceScreen.title" />
                    </Text>
                    <Box paddingBottom="small" paddingLeft="small">
                        <Icon name="trezor" size="extraLarge" />
                    </Box>
                </Box>
                <Text variant="highlight" color="textSubdued">
                    <Translation id="moduleConnectDevice.connectingDeviceScreen.hodlOn" />
                </Text>
            </VStack>
        </ConnectDeviceSreenView>
    );
};
