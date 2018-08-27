/* @flow */
import React, { Component } from 'react';
import styled from 'styled-components';
import TrezorConnect from 'trezor-connect';
import type { TrezorDevice } from 'flowtype';
import DeviceHeader from 'components/DeviceHeader';
import Button from 'components/Button';
import { isWebUSB } from 'utils/device';
import DeviceList from './components/DeviceList';

import type { Props } from '../common';

import AsideDivider from '../Divider';

const Wrapper = styled.div``;

export const DeviceSelect = (props: Props) => {
    const handleOpen = () => {
        props.toggleDeviceDropdown(!props.deviceDropdownOpened);
    };

    return (
        <DeviceHeader
            onClickWrapper={handleOpen}
            device={props.wallet.selectedDevice}
            transport={props.connect.transport}
            devices={props.devices.length}
            isOpen={props.deviceDropdownOpened}
        />
    );
};

type DeviceMenuItem = {
    type: string;
    label: string;
}

export class DeviceDropdown extends Component<Props> {
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

    componentWillUnmount(): void {
        window.removeEventListener('mousedown', this.mouseDownHandler, false);
        // window.removeEventListener('blur', this.blurHandler, false);
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

    showDivider() {
        return this.props.devices.length > 1;
    }

    render() {
        const { devices, onSelectDevice } = this.props;
        const { transport } = this.props.connect;
        const { selectedDevice } = this.props.wallet;

        let currentDeviceMenu = null;
        if (selectedDevice.features) {
            const deviceMenuItems: Array<DeviceMenuItem> = [];

            if (selectedDevice.status !== 'available') {
                deviceMenuItems.push({ type: 'reload', label: 'Renew session' });
            }

            deviceMenuItems.push({ type: 'settings', label: 'Device settings' });
            if (selectedDevice.features.passphrase_protection && selectedDevice.connected && selected.available) {
                deviceMenuItems.push({ type: 'clone', label: 'Create hidden wallet' });
            }
            //if (selected.remember) {
            deviceMenuItems.push({ type: 'forget', label: 'Forget device' });
            //}


            const deviceMenuButtons = deviceMenuItems.map((item, index) => (
                <div key={item.type} className={item.type} onClick={event => this.onDeviceMenuClick(item, selected)}>{item.label}</div>
            ));
            currentDeviceMenu = deviceMenuButtons.length < 1 ? null : (
                <div className="device-menu">
                    {deviceMenuButtons}
                </div>
            );
        }

        return (
            <Wrapper>
                {currentDeviceMenu}
                {this.showDivider() && <AsideDivider textLeft="Other devices" />}
                <DeviceList
                    devices={devices}
                    selectedDevice={selectedDevice}
                    onSelectDevice={onSelectDevice}
                />
                {isWebUSB(transport) && (
                    <Button
                        className="trezor-webusb-button"
                        text="Check for devices"
                        isWebUsb
                    />
                )}
            </Wrapper>
        );
    }
}
