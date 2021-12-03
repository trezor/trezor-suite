import React from 'react';
import { View, Text, Button } from 'react-native';
import { useTheme } from '@trezor/components';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import styles from '@native/support/suite/styles';

const Backup = () => {
    const theme = useTheme();
    const actions = useActions({
        goto: routerActions.goto,
        back: routerActions.back,
    });

    return (
        <View style={styles(theme).container}>
            <Text style={styles(theme).h1}>Backup</Text>
            <View style={{ margin: 20 }}>
                <Text>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam
                </Text>
            </View>
            <View style={{ margin: 20 }}>
                <Button onPress={actions.back} title="Back to previous screen" />
            </View>
            <Button onPress={() => actions.goto('wallet-send')} title="Go to wallet send page" />
        </View>
    );
};

export default Backup;
