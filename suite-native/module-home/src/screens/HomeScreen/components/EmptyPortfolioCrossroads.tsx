import { Platform, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { EventType, analytics } from '@suite-native/analytics';
import { Button, Card, CenteredTitleHeader, Text, VStack } from '@suite-native/atoms';
import { isBluetoothEnabled } from '@suite-native/bluetooth';
import { DeviceImage } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    AccountsImportStackRoutes,
    AuthorizeDeviceStackRoutes,
    HomeStackParamList,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { DeviceModelInternal } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ConnectTrezorSvg } from '../../../assets/ConnectTrezorSvg';

const cardStyle = prepareNativeStyle<{ flex: 1 | 2 }>((utils, { flex }) => ({
    flex,
    justifyContent: 'center',
    paddingTop: utils.spacings.sp24,
    paddingBottom: utils.spacings.sp16,
    paddingHorizontal: utils.spacings.sp16,
}));

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

type NavigationProps = StackToStackCompositeNavigationProps<
    HomeStackParamList,
    HomeStackRoutes.Home,
    RootStackParamList
>;

export const EmptyPortfolioCrossroads = () => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProps>();

    const handleConnectDevice = () => {
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen:
                isBluetoothEnabled && Platform.OS === 'ios'
                    ? AuthorizeDeviceStackRoutes.ConnectBluetoothDevice
                    : AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
        });
        analytics.report({
            type: EventType.EmptyDashboardClick,
            payload: { action: 'connectDevice' },
        });
    };

    const handleSyncMyCoins = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
        analytics.report({ type: EventType.EmptyDashboardClick, payload: { action: 'syncCoins' } });
    };

    return (
        <VStack spacing="sp16" flex={1}>
            <Card style={applyStyle(cardStyle, { flex: 2 })}>
                {isBluetoothEnabled && Platform.OS === 'ios' ? (
                    <VStack marginTop="sp16" spacing="sp24" alignItems="center">
                        <DeviceImage deviceModel={DeviceModelInternal.T3W1} />
                        <CenteredTitleHeader
                            title={
                                <Translation id="moduleHome.emptyState.connectTrezor.bluetooth.title" />
                            }
                            subtitle={
                                <Translation id="moduleHome.emptyState.connectTrezor.description" />
                            }
                        />
                        <View style={applyStyle(buttonWrapperStyle)}>
                            <Button viewLeft="bluetooth" onPress={handleConnectDevice}>
                                <Translation id="moduleHome.emptyState.connectTrezor.bluetooth.connectButton" />
                            </Button>
                        </View>
                    </VStack>
                ) : (
                    <VStack spacing="sp24" justifyContent="center" alignItems="center">
                        <ConnectTrezorSvg />
                        <CenteredTitleHeader
                            title={<Translation id="moduleHome.emptyState.connectTrezor.title" />}
                            subtitle={
                                <Translation id="moduleHome.emptyState.connectTrezor.description" />
                            }
                        />
                        <View style={applyStyle(buttonWrapperStyle)}>
                            <Button onPress={handleConnectDevice}>
                                <Translation id="moduleHome.emptyState.connectTrezor.connectButton" />
                            </Button>
                        </View>
                    </VStack>
                )}
            </Card>
            <Card style={applyStyle(cardStyle, { flex: 1 })}>
                <VStack spacing="sp24" justifyContent="center" alignItems="center">
                    <VStack alignItems="center">
                        <Text variant="titleSmall" textAlign="center">
                            <Translation id="moduleHome.emptyState.syncCoins.title" />
                        </Text>
                        <Text color="textSubdued" textAlign="center">
                            <Translation id="moduleHome.emptyState.syncCoins.description" />
                        </Text>
                    </VStack>
                    <View style={applyStyle(buttonWrapperStyle)}>
                        <Button
                            onPress={handleSyncMyCoins}
                            colorScheme="tertiaryElevation1"
                            testID="@home/portfolio/sync-coins-button"
                        >
                            <Translation id="moduleHome.emptyState.syncCoins.syncButton" />
                        </Button>
                    </View>
                </VStack>
            </Card>
        </VStack>
    );
};
