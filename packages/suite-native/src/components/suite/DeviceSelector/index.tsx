import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@trezor/components';
// import * as suiteActions from '@suite-actions/suiteActions';
import { useDevice } from '@suite-hooks';
import { SuiteThemeColors, TrezorDevice } from '@suite-types';
import * as deviceUtils from '@suite-utils/device';
import DeviceImage from '@native-components/suite/DeviceImage';
import WalletLabelling from '@suite-components/Labeling/components/Wallet/';

type Status = 'connected' | 'disconnected' | 'warning';

const getStatusColor = (status: Status, theme: SuiteThemeColors) => {
    const statusColors = {
        connected: theme.TYPE_GREEN,
        disconnected: theme.TYPE_RED,
        warning: theme.TYPE_ORANGE,
    };

    return statusColors[status];
};

const getStatusForDevice = (device: TrezorDevice | undefined) => {
    if (!device) return 'disconnected';
    const deviceStatus = deviceUtils.getStatus(device);
    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);

    if (!device.connected) {
        return 'disconnected';
    }
    if (needsAttention) {
        return 'warning';
    }
    return 'connected';
};

const styles = (theme: SuiteThemeColors) =>
    StyleSheet.create({
        deviceSelector: {
            padding: 8,
            marginBottom: 8,
            backgroundColor: theme.BG_LIGHT_GREY,
            flexDirection: 'row',
            alignItems: 'center',
        },
        deviceImageWrapper: {
            marginRight: 16,
        },
        deviceInfoWrapper: {
            flex: 1,
            marginVertical: 4,
        },
        deviceLabel: {
            fontWeight: 'bold',
            color: theme.TYPE_DARK_GREY,
        },
        activeWallet: {
            color: theme.TYPE_LIGHT_GREY,
        },
    });

const statusStyles = (theme: SuiteThemeColors, status: Status) =>
    StyleSheet.create({
        deviceStatus: {
            flexDirection: 'row',
            alignSelf: 'flex-start',
        },
        outerCircle: {
            justifyContent: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: status === 'connected' ? theme.BG_LIGHT_GREEN : theme.BG_LIGHT_RED,
        },
        innerCircle: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: getStatusColor(status, theme),
        },
    });

const DeviceSelector = () => {
    const { device } = useDevice();
    const theme = useTheme();
    const status = getStatusForDevice(device);
    // const { acquireDevice } = useActions({
    //     acquireDevice: suiteActions.acquireDevice,
    // });
    return (
        <View style={styles(theme).deviceSelector}>
            {device && (
                <>
                    <View style={styles(theme).deviceImageWrapper}>
                        <DeviceImage
                            height={42}
                            trezorModel={device?.features?.major_version === 1 ? 1 : 2}
                        />
                    </View>
                    <View style={styles(theme).deviceInfoWrapper}>
                        <Text style={styles(theme).deviceLabel}>{device?.label}</Text>
                        <Text style={styles(theme).activeWallet}>
                            {device.metadata.status === 'enabled' && device.metadata.walletLabel ? (
                                device.metadata.walletLabel
                            ) : (
                                <WalletLabelling device={device} />
                            )}
                        </Text>
                    </View>
                    <View style={statusStyles(theme, status).deviceStatus}>
                        <View style={statusStyles(theme, status).outerCircle}>
                            <View style={statusStyles(theme, status).innerCircle} />
                        </View>
                    </View>
                </>
            )}
        </View>
    );
};

export default DeviceSelector;
