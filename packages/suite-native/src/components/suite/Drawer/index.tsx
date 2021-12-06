import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, useTheme } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { useDevice, useActions } from '@suite-hooks';
import DeviceSelector from '@native-components/suite/DeviceSelector';
import { DrawerContentComponentProps } from 'react-navigation-drawer';
import { Translation } from '@native-components/suite/Translation';
import { SuiteThemeColors } from '@suite-types';

const styles = (theme: SuiteThemeColors) =>
    StyleSheet.create({
        drawer: {
            backgroundColor: theme.BG_WHITE,
            flex: 1,
        },
    });

const Drawer = (_props: DrawerContentComponentProps) => {
    const { device } = useDevice();
    const theme = useTheme();
    const { goto, setTheme, acquireDevice } = useActions({
        acquireDevice: suiteActions.acquireDevice,
        setTheme: suiteActions.setTheme,
        goto: routerActions.goto,
    });

    return (
        <View style={styles(theme).drawer}>
            <View style={{ margin: 5, marginBottom: 20 }}>
                <DeviceSelector />
                <Button
                    onClick={() => {
                        acquireDevice(device);
                    }}
                >
                    Acquire device
                </Button>
                <Button
                    onClick={() => {
                        setTheme(theme.THEME === 'dark' ? 'light' : 'dark');
                    }}
                >
                    Change theme
                </Button>
                {/* <Button onClick={() => goto('/device-select')}>My Trezor (device)</Button> */}
            </View>
            <Text>
                aa
                <Translation id="TR_ADD_HIDDEN_WALLET" />
            </Text>
            <Button onClick={() => goto('suite-index')}>Dashboard</Button>
            <Button onClick={() => goto('wallet-index')}>Wallet</Button>
            <Button onClick={() => goto('passwords-index')}>Passwords</Button>
            <Button onClick={() => goto('settings-index')}>Settings</Button>

            <Button onClick={() => goto('onboarding-index')}>Onboarding</Button>
            <Button onClick={() => goto('firmware-index')}>Firmware update</Button>
            <Button onClick={() => goto('settings-device')}>Backup</Button>
            <Button onClick={() => goto('suite-switch-device')}>Switch device</Button>
        </View>
    );
};

export default Drawer;
