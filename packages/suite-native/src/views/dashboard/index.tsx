import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { View, Button } from 'react-native';
import { P as Text, useTheme } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import styles from '@native/support/suite/styles';
import Layout from '@native-components/suite/Layout';
import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const Dashboard = (props: Props) => {
    const theme = useTheme();

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
                    onPress={() => props.goto('settings-coins')}
                    title="Go to wallet settings and add some coins"
                />
            </View>
            <View style={{ margin: 20 }}>
                <Button
                    onPress={() =>
                        props.goto('wallet-receive', {
                            accountType: 'normal',
                            accountIndex: 1,
                            symbol: 'btc',
                        })
                    }
                    title="Go to account details"
                />
            </View>
            <View style={{ margin: 20 }}>
                <Button onPress={() => props.goto('onboarding-index')} title="Go to onboarding" />
            </View>
        </Layout>
    );
};

export default connect(null, mapDispatchToProps)(Dashboard);
