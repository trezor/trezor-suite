import React from 'react';
import { View, Text, Button } from 'react-native';
import { useTheme } from '@trezor/components';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import styles from '@native/support/suite/styles';

const SwitchDevice = () => {
    const theme = useTheme();
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <View style={styles(theme).container}>
            <Text style={styles(theme).h1}>SwitchDevice</Text>
            <View style={{ margin: 20 }}>
                <Text>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam
                </Text>
            </View>
            <View style={{ margin: 20 }}>
                <Button onPress={() => goto('suite-index')} title="Back to dashboard" />
            </View>
        </View>
    );
};

export default SwitchDevice;
