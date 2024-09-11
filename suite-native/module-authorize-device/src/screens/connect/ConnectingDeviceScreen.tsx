import { ActivityIndicator } from 'react-native';

import { Text, VStack, Box } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons-deprecated';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
import { Translation } from '@suite-native/intl';

import { ConnectDeviceScreenView } from '../../components/connect/ConnectDeviceScreenView';
import { useOnDeviceReadyNavigation } from '../../hooks/useOnDeviceReadyNavigation';

const screenStyle = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 150,
}));

export const ConnectingDeviceScreen = () => {
    useOnDeviceReadyNavigation();
    const { applyStyle } = useNativeStyles();

    return (
        <ConnectDeviceScreenView style={applyStyle(screenStyle)} shouldDisplayCancelButton={false}>
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
        </ConnectDeviceScreenView>
    );
};
