import React, { PureComponent } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Icon from 'components/Icon';
import DeviceIcon from 'components/images/DeviceIcon';
import { FormattedMessage } from 'react-intl';

import icons from 'config/icons';
import colors from 'config/colors';
import { FONT_SIZE } from 'config/variables';

// import l10nCommonMessages from 'views/common.messages';
import l10nMessages from './index.messages';

const Wrapper = styled.div`
    background: ${colors.WHITE};
`;

const Item = styled.div`
    padding: 6px 24px;
    display: flex;
    align-items: center;
    font-size: ${FONT_SIZE.BASE};
    cursor: pointer;
    color: ${colors.TEXT_SECONDARY};

    &:hover {
        background: ${colors.GRAY_LIGHT};
    }
`;

const Label = styled.div`
    padding-left: 15px;
`;

class MenuItems extends PureComponent {
    showDeviceMenu() {
        const { device } = this.props;
        return device && device.mode === 'normal';
    }

    showClone() {
        return this.props.device && this.props.device.features.passphrase_protection && this.props.device.connected && this.props.device.available;
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
                        size={25}
                        color={colors.TEXT_SECONDARY}
                    />
                    <Label><FormattedMessage {...l10nMessages.TR_DEVICE_SETTINGS} /></Label>
                </Item> */}
                {this.showClone() && (
                    <Item onClick={() => this.props.duplicateDevice(device)}>
                        <Icon
                            icon={icons.WALLET_STANDARD}
                            size={25}
                            color={colors.TEXT_SECONDARY}
                        />
                        <Label><FormattedMessage {...l10nMessages.TR_CHANGE_WALLET_TYPE} /></Label>
                    </Item>
                )}
                {this.showRenewSession() && (
                    <Item
                        onClick={() => this.props.acquireDevice()}
                    >
                        <DeviceIcon device={this.props.device} size={25} color={colors.TEXT_SECONDARY} />
                        <Label><FormattedMessage {...l10nMessages.TR_RENEW_SESSION} /></Label>
                    </Item>
                )}
                <Item onClick={() => this.props.forgetDevice(device)}>
                    <Icon
                        icon={icons.EJECT}
                        size={25}
                        color={colors.TEXT_SECONDARY}
                    />
                    <Label><FormattedMessage {...l10nMessages.TR_FORGET_DEVICE} /></Label>
                </Item>
            </Wrapper>
        );
    }
}

MenuItems.propTypes = {
    device: PropTypes.object.isRequired,
    acquireDevice: PropTypes.func.isRequired,
    forgetDevice: PropTypes.func.isRequired,
    duplicateDevice: PropTypes.func.isRequired,
    // toggleDeviceDropdown: PropTypes.func.isRequired,
    // gotoDeviceSettings: PropTypes.func.isRequired,
};

export default MenuItems;