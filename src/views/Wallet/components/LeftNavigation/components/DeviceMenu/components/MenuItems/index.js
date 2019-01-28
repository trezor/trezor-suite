import React, { PureComponent } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Icon from 'components/Icon';
import DeviceIcon from 'components/images/DeviceIcon';

import icons from 'config/icons';
import colors from 'config/colors';
import { FONT_SIZE } from 'config/variables';

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
    onDeviceMenuClick(action, device) {
        if (action === 'reload') {
            this.props.acquireDevice();
        } else if (action === 'forget') {
            this.props.forgetDevice(device);
        } else if (action === 'clone') {
            this.props.duplicateDevice(device);
        } else if (action === 'settings') {
            this.props.toggleDeviceDropdown(false);
            this.props.gotoDeviceSettings(device);
        }
    }

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
        return (
            <Wrapper>
                {/* <Item onClick={() => this.onDeviceMenuClick('settings', this.props.device)}>
                    <Icon
                        icon={icons.COG}
                        size={25}
                        color={colors.TEXT_SECONDARY}
                    />
                    <Label>Device settings</Label>
                </Item> */}
                <Item onClick={() => this.onDeviceMenuClick('forget', this.props.device)}>
                    <Icon
                        icon={icons.EJECT}
                        size={25}
                        color={colors.TEXT_SECONDARY}
                    />
                    <Label>Forget</Label>
                </Item>
                {this.showClone() && (
                    <Item onClick={() => this.onDeviceMenuClick('clone', this.props.device)}>
                        <DeviceIcon device={this.props.device} size={25} color={colors.TEXT_SECONDARY} />
                        <Label>Change wallet type</Label>
                    </Item>
                )}
                {this.showRenewSession() && (
                    <Item
                        onClick={() => this.onDeviceMenuClick('reload')}
                    >
                        <DeviceIcon device={this.props.device} size={25} color={colors.TEXT_SECONDARY} />
                        <Label>Renew session</Label>
                    </Item>
                )}
            </Wrapper>
        );
    }
}

MenuItems.propTypes = {
    device: PropTypes.object.isRequired,
    acquireDevice: PropTypes.func.isRequired,
    forgetDevice: PropTypes.func.isRequired,
    duplicateDevice: PropTypes.func.isRequired,
    toggleDeviceDropdown: PropTypes.func.isRequired,
    gotoDeviceSettings: PropTypes.func.isRequired,
};

export default MenuItems;