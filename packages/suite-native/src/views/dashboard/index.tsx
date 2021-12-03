import React from 'react';
import { View, Button } from 'react-native';
import { P as Text, useTheme } from '@trezor/components';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import styles from '@native/support/suite/styles';
import Layout from '@native-components/suite/Layout';

const Dashboard = () => {
    const theme = useTheme();
    const actions = useActions({
        goto: routerActions.goto,
    });

    return (
        <Layout title="Dashboard">
            <Text style={styles(theme).h1}>Dashboard (Suite home)</Text>
            <View style={{ margin: 20 }}>
                <Text>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam
                </Text>
            </View>
            <View style={{ margin: 20 }}>
                <Button
                    onPress={() => actions.goto('settings-coins')}
                    title="Go to wallet settings and add some coins"
                />
            </View>
            <View style={{ margin: 20 }}>
                <Button
                    onPress={() =>
                        actions.goto('wallet-receive', {
                            accountType: 'normal',
                            accountIndex: 1,
                            symbol: 'btc',
                        })
                    }
                    title="Go to account details"
                />
            </View>
            <View style={{ margin: 20 }}>
                <Button onPress={() => actions.goto('onboarding-index')} title="Go to onboarding" />
            </View>
        </Layout>
    );
};

export default Dashboard;
