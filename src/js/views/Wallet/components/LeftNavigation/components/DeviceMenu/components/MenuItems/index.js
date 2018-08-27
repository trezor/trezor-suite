import React, { Component } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Icon from 'components/Icon';

import icons from 'config/icons';
import colors from 'config/colors';
import { FONT_SIZE } from 'config/variables';

const Wrapper = styled.div`
    padding: 0px 24px 8px 19px;
    border-bottom: 1px solid ${colors.DIVIDER};
    background: ${colors.WHITE};
`;

const Item = styled.div`
    padding: 4px 2px;
    display: flex;
    align-items: center;
    font-size: ${FONT_SIZE.SMALL};
    line-height: 24px;
    cursor: pointer;
    color: ${colors.TEXT_SECONDARY};    
`;

const Label = styled.div`
    padding-left: 15px;
`;

class MenuItems extends Component {
    // makeAction(action, device) {
    //     switch (action) {
    //         case 'reload': this.props.acquireDevice();
    //             break;
    //         case 'forget': this.props.forgetDevice();
    //             break;
    //         case 'clone': this.props.duplicateDevice();
    //             break;
    //         case 'settings': {
    //             this.props.toggleDeviceDropdown(false);
    //             this.props.gotoDeviceSettings(device);
    //             break;
    //         }
    //         default: console.log('no action');
    //             break;
    //     }
    // }

    showClone() {
        return this.props.selectedDevice && this.props.selectedDevice.features.passphrase_protection && this.props.selectedDevice.connected && this.props.selectedDevice.available;
    }

    showRenewSession() {
        return this.props.selectedDevice && this.props.selectedDevice.status !== 'available';
    }

    render() {
        return (
            <Wrapper>
                <Item>
                    <Icon icon={icons.COG} size={25} color={colors.TEXT_SECONDARY} />
                    <Label>Device settings</Label>
                </Item>
                <Item>
                    <Icon icon={icons.EJECT} size={25} color={colors.TEXT_SECONDARY} />
                    <Label>Forget</Label>
                </Item>
                {this.showClone() && (
                    <Item>
                        <Icon icon={icons.T1} size={25} color={colors.TEXT_SECONDARY} />
                        <Label>Create hidden wallet</Label>
                    </Item>
                )}
                {this.showRenewSession() && (
                    <Item>
                        <Icon icon={icons.T1} size={25} color={colors.TEXT_SECONDARY} />
                        <Label>Renew session</Label>
                    </Item>
                )}
            </Wrapper>
        );
    }
}

MenuItems.propTypes = {
    selectedDevice: PropTypes.object.isRequired,
    acquireDevice: PropTypes.func.isRequired,
    forgetDevice: PropTypes.func.isRequired,
    duplicateDevice: PropTypes.func.isRequired,
    toggleDeviceDropdown: PropTypes.func.isRequired,
    gotoDeviceSettings: PropTypes.func.isRequired,
};

export default MenuItems;