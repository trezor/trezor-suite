/* @flow */
import React, { Component } from 'react';
import styled from 'styled-components';
import TrezorConnect from 'trezor-connect';
import type { TrezorDevice } from 'flowtype';
import DeviceHeader from 'components/DeviceHeader';
import Button from 'components/buttons/Button';
import { isWebUSB } from 'utils/device';
import MenuItems from './components/MenuItems';
import DeviceList from './components/DeviceList';

import type { Props } from '../common';

import AsideDivider from '../Divider';

const Wrapper = styled.div``;
const ButtonWrapper = styled.div``;

type DeviceMenuItem = {
    type: string;
    label: string;
}

class DeviceMenu extends Component<Props> {
    mouseDownHandler: (event: MouseEvent) => void;

    blurHandler: (event: FocusEvent) => void;

    constructor(props: Props) {
        super(props);
        this.mouseDownHandler = this.mouseDownHandler.bind(this);
        this.blurHandler = this.blurHandler.bind(this);
    }

    componentDidUpdate() {
        const { transport } = this.props.connect;
        if (isWebUSB(transport)) TrezorConnect.renderWebUSBButton();
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

    blurHandler(event: FocusEvent): void {
        this.props.toggleDeviceDropdown(false);
    }

    componentDidMount(): void {
        window.addEventListener('mousedown', this.mouseDownHandler, false);
        // window.addEventListener('blur', this.blurHandler, false);
        const { transport } = this.props.connect;
        if (transport && transport.version.indexOf('webusb') >= 0) TrezorConnect.renderWebUSBButton();
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

    componentWillUnmount(): void {
        window.removeEventListener('mousedown', this.mouseDownHandler, false);
    }

    showDivider() {
        return this.props.devices.length > 1;
    }

    showMenuItems() {
        const { selectedDevice } = this.props.wallet;
        return selectedDevice && selectedDevice.features;
    }

    render() {
        const { devices, onSelectDevice } = this.props;
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
                />
                <ButtonWrapper>
                    {isWebUSB(transport) && (
                        <Button
                            className="trezor-webusb-button"
                            text="Check for devices"
                            isWebUsb
                        />
                    )}
                </ButtonWrapper>
            </Wrapper>
        );
    }
}

export default DeviceMenu;