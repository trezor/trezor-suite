import React from 'react';
import { View, Text, Button } from 'react-native';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as routerActions from '@suite-actions/routerActions';
import { AppState, Dispatch } from '@suite-types';
import { DrawerContentComponentProps } from 'react-navigation-drawer';

// TODO: remove
const StyledButton = (props: any) => {
    return (
        <View style={{ margin: 5 }}>
            <Button {...props} />
        </View>
    );
};

const mapStateToProps = (state: AppState) => ({
    devices: state.devices,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    DrawerContentComponentProps;

const AccountsMenu = (props: Props) => {
    return (
        <View>
            {/* <View style={{ margin: 5, marginBottom: 20 }}>
                <Button onPress={() => props.goto('/device-select')} title="My Trezor (device)" />
            </View> */}
            <Text>Application Menu</Text>
            <StyledButton onPress={() => props.goto('suite-index')} title="Dashboard" />
            <StyledButton onPress={() => props.goto('wallet-index')} title="Wallet" />
            <StyledButton onPress={() => props.goto('passwords-index')} title="Passwords" />
            <StyledButton onPress={() => props.goto('settings-index')} title="Settings" />

            <Button onPress={() => props.goto('onboarding-index')} title="Onboarding" />
            <Button onPress={() => props.goto('firmware-index')} title="Firmware update" />
            <Button onPress={() => props.goto('settings-device')} title="Backup" />
            <Button onPress={() => props.goto('suite-switch-device')} title="Switch device" />
        </View>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(AccountsMenu);
