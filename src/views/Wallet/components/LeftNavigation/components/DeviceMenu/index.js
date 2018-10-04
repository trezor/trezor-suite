/* @flow */
import React, { Component } from 'react';
import styled from 'styled-components';
import TrezorConnect from 'trezor-connect';
import type { TrezorDevice } from 'flowtype';
import Button from 'components/Button';
import * as deviceUtils from 'utils/device';
import MenuItems from './components/MenuItems';
import DeviceList from './components/DeviceList';

import type { Props } from '../common';

import AsideDivider from '../Divider';

const Wrapper = styled.div``;
const ButtonWrapper = styled.div`
    margin-top: 10px;
    padding: 0 10px;
    display: flex;
`;
const StyledButton = styled(Button)`
    flex: 1;
`;

type DeviceMenuItem = {
    type: string;
    label: string;
}

class DeviceMenu extends Component<Props> {
    constructor(props: Props) {
        super(props);
        this.mouseDownHandler = this.mouseDownHandler.bind(this);
        this.blurHandler = this.blurHandler.bind(this);
    }

    componentDidMount(): void {
        window.addEventListener('mousedown', this.mouseDownHandler, false);
        // window.addEventListener('blur', this.blurHandler, false);
        const { transport } = this.props.connect;
        if (transport.type && transport.version.indexOf('webusb') >= 0) TrezorConnect.renderWebUSBButton();
    }

    componentDidUpdate() {
        const { transport } = this.props.connect;
        if (deviceUtils.isWebUSB(transport)) TrezorConnect.renderWebUSBButton();
    }

    componentWillUnmount(): void {
        window.removeEventListener('mousedown', this.mouseDownHandler, false);
    }

    onDeviceMenuClick(item: DeviceMenuItem, device: TrezorDevice): void {
        if (item.type === 'reload') {
            this.props.acquireDevice();
        } else if (item.type === 'forget') {
            this.props.forgetDevice(device);
        } else if (item.type === 'clone') {
            this.props.duplicateDevice(device);
        } else if (item.type === 'settings') {
            this.props.toggleDeviceDropdown(false);
            this.props.gotoDeviceSettings(device);
        }
    }

    blurHandler(): void {
        this.props.toggleDeviceDropdown(false);
    }

    mouseDownHandler(event: MouseEvent): void {
        let elem: any = (event.target: any);
        let block: boolean = false;
        while (elem.parentElement) {
            if (elem.tagName.toLowerCase() === 'aside' || (elem.className && elem.className.indexOf && elem.className.indexOf('modal-container') >= 0)) {
                block = true;
                break;
            }

            elem = elem.parentElement;
        }

        if (!block) {
            this.props.toggleDeviceDropdown(false);
        }
    }

    mouseDownHandler: (event: MouseEvent) => void;

    blurHandler: (event: FocusEvent) => void;

    showDivider() {
        return this.props.devices.length > 1;
    }

    showMenuItems() {
        return deviceUtils.isDeviceAccessible(this.props.wallet.selectedDevice);
    }

    render() {
        const { devices, onSelectDevice, forgetDevice } = this.props;
        const { transport } = this.props.connect;
        const { selectedDevice } = this.props.wallet;

        return (
            <Wrapper>
                {this.showMenuItems() && <MenuItems device={selectedDevice} {...this.props} />}
                {this.showDivider() && <AsideDivider textLeft="Other devices" />}
                <DeviceList
                    devices={devices}
                    selectedDevice={selectedDevice}
                    onSelectDevice={onSelectDevice}
                    forgetDevice={forgetDevice}
                />
                <ButtonWrapper>
                    {deviceUtils.isWebUSB(transport) && (
                        <StyledButton isWebUsb>Check for devices</StyledButton>
                    )}
                </ButtonWrapper>
            </Wrapper>
        );
    }
}

export default DeviceMenu;