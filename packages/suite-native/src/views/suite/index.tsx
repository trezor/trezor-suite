import React from 'react';
import { connect } from 'react-redux';
import { Text, Button, View } from 'react-native';
import { bindActionCreators } from 'redux';

import * as routerActions from '@suite-actions/routerActions';
// import AcquireDevice from '@suite-components/AcquireDevice';
import { getRoute } from '@suite-utils/router';
import { AppState, Dispatch } from '@suite-types';

import Logo from './trezor_logo_horizontal.svg';

const mapStateToProps = (state: AppState) => ({
    // router: state.router,
    suite: state.suite,
    devices: state.devices,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
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
                <Text>
                    Don't have Transport info not yet. This means that transport event was not
                    emitted. For now, you need to have bridge running on testing laptop and both
                    must be on same local network.
                </Text>
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
                <Text>
                    No transport. Do you have SL testing laptop and mobile device on same network?
                    (and IP matches in node_modules/trezor-connect/lib/Device/DeviceList.js)?
                </Text>
            </View>
        );
    }

    // no available device
    if (!suite.device) {
        // TODO: render "connect device" view with webusb button
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

    // TODO: render requested view
    return (
        <View>
            {/* <Text>Just an example to see that loading svgs work</Text> */}
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
        </View>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Index);
