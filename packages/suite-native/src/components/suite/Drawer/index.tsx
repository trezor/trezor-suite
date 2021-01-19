import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@trezor/components/lib/components/buttons/Button';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { useDevice, useActions, useTheme } from '@suite-hooks';
import DeviceSelector from '@suite-components/DeviceSelector';
import { DrawerContentComponentProps } from 'react-navigation-drawer';
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
    const { theme, themeVariant, setTheme } = useTheme();
    const { goto, acquireDevice } = useActions({
        acquireDevice: suiteActions.acquireDevice,
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
                        setTheme(themeVariant === 'dark' ? 'light' : 'dark');
                    }}
                >
                    Change theme
                </Button>
                {/* <Button onClick={() => goto('/device-select')}>My Trezor (device)</Button> */}
            </View>
            <Text>Application Menu</Text>
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
