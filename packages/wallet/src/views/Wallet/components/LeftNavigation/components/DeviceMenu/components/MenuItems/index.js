import React, { PureComponent } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { getPattern } from 'support/routes';

import { Switch, Link, Icon, colors, icons } from 'trezor-ui-components';
import DeviceIcon from 'components/images/DeviceIcon';
import { FONT_SIZE } from 'config/variables';

import l10nCommonMessages from 'views/common.messages';
import l10nMessages from './index.messages';

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

class MenuItems extends PureComponent {
    showDeviceMenu() {
        const { device } = this.props;
        return device && device.mode === 'normal';
    }

    showClone() {
        return (
            this.props.device &&
            this.props.device.features.passphrase_protection &&
            this.props.device.connected &&
            this.props.device.available
        );
    }

    showRenewSession() {
        return this.props.device && this.props.device.status !== 'available';
    }

    render() {
        if (!this.showDeviceMenu()) return null;
        const { device } = this.props;
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
                {this.showClone() && (
                    <Item onClick={() => this.props.duplicateDevice(device)}>
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
                {this.showRenewSession() && (
                    <Item onClick={() => this.props.acquireDevice()}>
                        <IconWrapper>
                            <DeviceIcon
                                device={this.props.device}
                                size={14}
                                color={colors.TEXT_SECONDARY}
                            />
                        </IconWrapper>
                        <Label>
                            <FormattedMessage {...l10nMessages.TR_RENEW_SESSION} />
                        </Label>
                    </Item>
                )}
                <Item onClick={() => this.props.forgetDevice(device)}>
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
                    <Switch
                        width={36}
                        height={18}
                        handleDiameter={14}
                        checkedIcon={false}
                        uncheckedIcon={false}
                        onChange={checked => {
                            this.props.setHideBalance(checked);
                        }}
                        checked={this.props.wallet.hideBalance}
                    />
                </Item>
                <Divider />
                <Link to={getPattern('wallet-settings')}>
                    <Item>
                        <IconWrapper>
                            <Icon icon={icons.COG} size={14} color={colors.TEXT_SECONDARY} />
                        </IconWrapper>
                        <Label>
                            <FormattedMessage {...l10nCommonMessages.TR_APPLICATION_SETTINGS} />
                        </Label>
                    </Item>
                </Link>
            </Wrapper>
        );
    }
}

MenuItems.propTypes = {
    device: PropTypes.object.isRequired,
    wallet: PropTypes.object.isRequired,
    acquireDevice: PropTypes.func.isRequired,
    forgetDevice: PropTypes.func.isRequired,
    duplicateDevice: PropTypes.func.isRequired,
    setHideBalance: PropTypes.func.isRequired,
    // toggleDeviceDropdown: PropTypes.func.isRequired,
    // gotoDeviceSettings: PropTypes.func.isRequired,
};

export default MenuItems;
