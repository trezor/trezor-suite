import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { getRoute } from '@suite-utils/router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as suiteActions from '@suite-actions/suiteActions';
import { goto } from '@suite-actions/routerActions';
import { Switch, Icon, colors, variables } from '@trezor/components';
import DeviceIcon from '@suite-components/images/DeviceIcon';
import { setHideBalance } from '@wallet-actions/settingsActions';

import l10nCommonMessages from '@suite-views/index.messages';
import l10nMessages from './index.messages';
import DeviceInstances from '../DeviceInstances';

import { AcquiredDevice, AppState, Dispatch } from '@suite-types';

const { FONT_SIZE } = variables;

const Wrapper = styled.div`
    background: ${colors.WHITE};
`;

const Item = styled.div`
    padding: 12px 24px;
    display: flex;
    height: 38px;
    align-items: center;
    font-size: ${FONT_SIZE.BASE};
    cursor: pointer;
    color: ${colors.TEXT_SECONDARY};

    &:hover {
        background: ${colors.GRAY_LIGHT};
    }
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: ${colors.DIVIDER};
`;

const Label = styled.div`
    flex: 1;
`;

const IconWrapper = styled.div`
    width: 18px;
    display: flex;
    justify-content: center;
    margin-right: 15px;
`;

// const Link = styled.a``;

const SwitchWrapper = styled.div``;

const mapStateToProps = (state: AppState) => ({
    settings: state.wallet.settings,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setHideBalance: bindActionCreators(setHideBalance, dispatch),
    acquireDevice: bindActionCreators(suiteActions.acquireDevice, dispatch),
    selectDevice: bindActionCreators(suiteActions.selectDevice, dispatch),
    requestForgetDevice: bindActionCreators(suiteActions.requestForgetDevice, dispatch),
    requestDeviceInstance: bindActionCreators(suiteActions.requestDeviceInstance, dispatch),
});

type Props = {
    device: AcquiredDevice;
    instances: AcquiredDevice[];
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const MenuItems = ({
    device,
    instances,
    setHideBalance,
    settings,
    acquireDevice,
    selectDevice,
    requestForgetDevice,
    requestDeviceInstance,
}: Props) => {
    // const showDeviceMenu = device && device.mode === 'normal';

    const showClone =
        device && device.features.passphrase_protection && device.connected && device.available;

    const showRenewSession = device && device.status !== 'available';

    return (
        <Wrapper>
            <DeviceInstances
                instances={instances}
                selectDevice={selectDevice}
                requestForgetDevice={requestForgetDevice}
            />
            {showClone && (
                <Item onClick={() => requestDeviceInstance(device)}>
                    <IconWrapper>
                        <Icon icon="WALLET_HIDDEN" size={14} color={colors.TEXT_SECONDARY} />
                    </IconWrapper>
                    <Label>
                        <FormattedMessage {...l10nMessages.TR_ADD_HIDDEN_WALLET} />
                    </Label>
                </Item>
            )}
            {showRenewSession && (
                <Item onClick={acquireDevice}>
                    <IconWrapper>
                        <DeviceIcon device={device} size={14} color={colors.TEXT_SECONDARY} />
                    </IconWrapper>
                    <Label>
                        <FormattedMessage {...l10nMessages.TR_RENEW_SESSION} />
                    </Label>
                </Item>
            )}
            <Item onClick={() => goto(getRoute('suite-device-settings'))}>
                <IconWrapper>
                    <Icon icon="COG" size={14} color={colors.TEXT_SECONDARY} />
                </IconWrapper>
                <Label>
                    <FormattedMessage {...l10nCommonMessages.TR_DEVICE_SETTINGS} />
                </Label>
            </Item>
            <Item onClick={() => requestForgetDevice(device)}>
                <IconWrapper>
                    <Icon icon="EJECT" size={14} color={colors.TEXT_SECONDARY} />
                </IconWrapper>
                <Label>
                    <FormattedMessage {...l10nCommonMessages.TR_FORGET_DEVICE} />
                </Label>
            </Item>
            <Divider />
            <Item>
                <IconWrapper>
                    <Icon icon="EYE_CROSSED" size={14} color={colors.TEXT_SECONDARY} />
                </IconWrapper>
                <Label>
                    <FormattedMessage {...l10nCommonMessages.TR_HIDE_BALANCE} />
                </Label>
                <SwitchWrapper
                    onClick={event => {
                        // prevents closing the device menu when toggling the switch
                        event.stopPropagation();
                        event.preventDefault();
                    }}
                >
                    <Switch
                        width={36}
                        height={18}
                        handleDiameter={14}
                        checkedIcon={false}
                        uncheckedIcon={false}
                        onChange={checked => {
                            setHideBalance(checked);
                        }}
                        checked={settings.hideBalance}
                    />
                </SwitchWrapper>
            </Item>
            <Divider />
            <Item onClick={() => goto(getRoute('wallet-settings'))}>
                <IconWrapper>
                    <Icon icon="COG" size={14} color={colors.TEXT_SECONDARY} />
                </IconWrapper>
                <Label>
                    <FormattedMessage {...l10nCommonMessages.TR_APPLICATION_SETTINGS} />
                </Label>
            </Item>
        </Wrapper>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(MenuItems);
