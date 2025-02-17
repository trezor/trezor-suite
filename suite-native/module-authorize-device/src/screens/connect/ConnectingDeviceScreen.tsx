import { ActivityIndicator } from 'react-native';

import { Box, Text, VStack, resetLetterSpacingOnAndroidStyle } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useHandleHardwareBackNavigation } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ConnectDeviceScreenView } from '../../components/connect/ConnectDeviceScreenView';
import { useOnDeviceReadyNavigation } from '../../hooks/useOnDeviceReadyNavigation';

const screenStyle = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 150,
}));

export const ConnectingDeviceScreen = () => {
    useOnDeviceReadyNavigation();
    useHandleHardwareBackNavigation();

    const { applyStyle } = useNativeStyles();

    return (
        <ConnectDeviceScreenView style={applyStyle(screenStyle)} shouldDisplayCancelButton={false}>
            <VStack spacing="sp16" alignItems="center">
                <ActivityIndicator size="large" />
                <Box flexDirection="row" alignItems="center">
                    <Text
                        variant="titleMedium"
                        style={applyStyle(resetLetterSpacingOnAndroidStyle)}
                    >
                        <Translation id="moduleConnectDevice.connectingDeviceScreen.title" />
                    </Text>
                    <Box paddingBottom="sp8" paddingLeft="sp8">
                        <Icon name="trezorLogo" size="extraLarge" />
                    </Box>
                </Box>
                <Text variant="highlight" color="textSubdued">
                    <Translation id="moduleConnectDevice.connectingDeviceScreen.hodlOn" />
                </Text>
            </VStack>
        </ConnectDeviceScreenView>
    );
};
