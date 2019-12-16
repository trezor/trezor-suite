import React from 'react';
import { connect } from 'react-redux';
import { Text, Button, ScrollView, View } from 'react-native';
import { bindActionCreators } from 'redux';

import * as routerActions from '@suite-actions/routerActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
// import AcquireDevice from '@suite-components/AcquireDevice';
import { getRoute } from '@suite-utils/router';
import { AppState, Dispatch } from '@suite-types';

import Logo from './trezor_logo_horizontal.svg';

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
    devices: state.devices,
    accounts: state.wallet.accounts,
    discovery: state.wallet.discovery,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
    getDiscoveryForDevice: () => dispatch(discoveryActions.getDiscoveryForDevice()),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Index = (props: Props) => {
    const {
        suite,
        // router,
    } = props;
    // connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
    if (!suite.transport) {
        return (
            <View>
                <Text>Loading transport...</Text>
            </View>
        );
    }

    // onboarding maybe does not belong to router? so maaybee here.
    // if (router.app === 'onboarding') {
    //     return <View>{props.children}</View>;
    // }

    // no available transport - but this should not happen
    if (!suite.transport.type) {
        return (
            <View>
                <Text>No transport</Text>
            </View>
        );
    }

    // no available device
    if (!suite.device) {
        // TODO: render "connect device" view
        return (
            <View>
                <Text>Connect Trezor to continue</Text>
                <Text>Transport: {suite.transport.type}</Text>
            </View>
        );
    }

    // connected device is in unexpected mode
    if (suite.device.type !== 'acquired') {
        // TODO: render "acquire device" or "unreadable device" page
        return (
            <View>
                <Text>unacquired</Text>
                {/* <AcquireDevice /> */}
            </View>
        );
    }

    if (suite.device.mode !== 'normal') {
        // TODO: render "unexpected mode" page (bootloader, seedless, not initialized)
        // not-initialized should redirect to onboarding
        return (
            <View>
                <Text>Device is in unexpected mode: {suite.device.mode}</Text>
                <Text>Transport: {suite.transport.type}</Text>
            </View>
        );
    }

    const discovery = props.getDiscoveryForDevice();
    let percent = 0;
    if (discovery) {
        if (discovery.loaded && discovery.total) {
            percent = Math.round((discovery.loaded / discovery.total) * 100);
        }
    }

    const accounts = props.accounts.map(a => (
        <View
            key={a.descriptor}
            style={{ borderBottomWidth: 1, borderBottomColor: 'grey', padding: 20 }}
        >
            <Text>{a.path}</Text>
            <Text>
                {a.balance} {a.symbol}
            </Text>
        </View>
    ));

    return (
        <ScrollView>
            <Logo width="200" height="200" />
            <Text>Device {suite.device.label} connected</Text>
            <Button
                title="wallet"
                onPress={() => {
                    props.goto(getRoute('wallet-index'));
                }}
            />
            <Button
                title="device settings"
                onPress={() => {
                    props.goto(getRoute('settings-index'));
                }}
            />
            <View
                style={{
                    width: `${percent}%`,
                    height: 5,
                    backgroundColor: 'red',
                }}
            />
            {accounts}
        </ScrollView>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Index);
