import React, { Component } from 'react';
import styled from 'styled-components';
import Icon from 'components/Icon';
import icons from 'config/icons';
import colors from 'config/colors';

const Wrapper = styled.div``;
const Item = styled.div``;

class MenuItems extends Component {
    showClone() {
        return this.props.selectedDevice.features.passphrase_protection && this.props.selectedDevice.connected && this.props.selectedDevice.available;
    }

    showRenewSession() {
        return this.props.selectedDevice.status;
    }

    render() {
        return (
            <Wrapper>
                <Item>Device settings</Item>
                <Item>Forget</Item>
                {this.showClone() && <Item>Create hidden wallet</Item>}
                {this.showRenewSession() && <Item>Renew session</Item>}
            </Wrapper>
        );
    }
}

export default MenuItems;