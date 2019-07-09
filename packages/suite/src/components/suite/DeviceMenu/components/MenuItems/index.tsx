import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { getRoute } from '@suite-utils/router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { forgetDevice } from '@suite-actions/trezorConnectActions';

import { goto } from '@suite-actions/routerActions';
import { Switch, Icon, colors, icons, variables } from '@trezor/components';
import DeviceIcon from '@suite-components/images/DeviceIcon';
import { AcquiredDevice, AppState } from '@suite-types/index';
import { setHideBalance } from '@wallet-actions/settingsActions';

import l10nCommonMessages from '@suite-views/index.messages';
import l10nMessages from './index.messages';

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

const Link = styled.a``;

const SwitchWrapper = styled.div``;

interface Props {
    device: AcquiredDevice;
    setHideBalance: typeof setHideBalance;
    settings: AppState['wallet']['settings'];
}

const MenuItems = ({ device, setHideBalance, settings }: Props) => {
    // const showDeviceMenu = device && device.mode === 'normal';

    const showClone =
        device && device.features.passphrase_protection && device.connected && device.available;

    const showRenewSession = device && device.status !== 'available';

    return (
        <Wrapper>
            {/* <Item onClick={() => {
                this.props.toggleDeviceDropdown(false);
                this.props.gotoDeviceSettings(device);
            }}
            >
                <Icon
                    icon={icons.COG}
                    size={14}
                    color={colors.TEXT_SECONDARY}
                />
                <Label><FormattedMessage {...l10nMessages.TR_DEVICE_SETTINGS} /></Label>
            </Item> */}
            {showClone && (
                // <Item onClick={() => this.props.duplicateDevice(device)}>
                <Item onClick={() => {}}>
                    <IconWrapper>
                        <Icon
                            icon={icons.WALLET_STANDARD}
                            size={14}
                            color={colors.TEXT_SECONDARY}
                        />
                    </IconWrapper>
                    <Label>
                        <FormattedMessage {...l10nMessages.TR_CHANGE_WALLET_TYPE} />
                    </Label>
                </Item>
            )}
            {showRenewSession && (
                // <Item onClick={() => this.props.acquireDevice()}>
                <Item onClick={() => {}}>
                    <IconWrapper>
                        <DeviceIcon device={device} size={14} color={colors.TEXT_SECONDARY} />
                    </IconWrapper>
                    <Label>
                        <FormattedMessage {...l10nMessages.TR_RENEW_SESSION} />
                    </Label>
                </Item>
            )}
            <Item
                onClick={() => {
                    console.log('aaa');
                    forgetDevice(device);
                }}
            >
                <IconWrapper>
                    <Icon icon={icons.EJECT} size={14} color={colors.TEXT_SECONDARY} />
                </IconWrapper>
                <Label>
                    <FormattedMessage {...l10nCommonMessages.TR_FORGET_DEVICE} />
                </Label>
            </Item>
            <Divider />
            <Item>
                <IconWrapper>
                    <Icon icon={icons.EYE_CROSSED} size={14} color={colors.TEXT_SECONDARY} />
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
                    <Icon icon={icons.COG} size={14} color={colors.TEXT_SECONDARY} />
                </IconWrapper>
                <Label>
                    <FormattedMessage {...l10nCommonMessages.TR_APPLICATION_SETTINGS} />
                </Label>
            </Item>
        </Wrapper>
    );
};

const mapStateToProps = (state: AppState) => ({
    settings: state.wallet.settings,
});

export default connect(
    mapStateToProps,
    dispatch => ({
        setHideBalance: bindActionCreators(setHideBalance, dispatch),
    }),
)(MenuItems);
