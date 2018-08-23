/* @flow */
import React, { Component } from 'react';
import styled from 'styled-components';
import TrezorConnect from 'trezor-connect';
import type { TrezorDevice } from 'flowtype';
import { getStatus, getVersion, isDisabled } from 'utils/device';

import DeviceHeader from './components/DeviceHeader';

// import DeviceList from './components/DeviceList';
import type { Props } from '../common';

import AsideDivider from '../Divider';

const Wrapper = styled.div``;

export const DeviceSelect = (props: Props) => {
    const { devices } = props;
    const { transport } = props.connect;
    const { selectedDevice } = props.wallet;
    const disabled = isDisabled(selectedDevice, devices, transport);

    const handleOpen = () => {
        props.toggleDeviceDropdown(!props.deviceDropdownOpened);
    };

    return (
        <DeviceHeader
            handleOpen={handleOpen}
            disabled={disabled}
            label={selectedDevice.instanceLabel}
            status={getStatus(selectedDevice)}
            deviceCount={devices.length}
            isOpen={props.deviceDropdownOpened}
            trezorModel={getVersion(selectedDevice)}
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
        if (transport && transport.version.indexOf('webusb') >= 0) TrezorConnect.renderWebUSBButton();
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

    render() {
        const { devices } = this.props;
        const { transport } = this.props.connect;
        const selected: ?TrezorDevice = this.props.wallet.selectedDevice;
        if (!selected) return;

        let webUsbButton = null;
        if (transport && transport.version.indexOf('webusb') >= 0) {
            webUsbButton = <button className="trezor-webusb-button">Check for devices</button>;
        }

        let currentDeviceMenu = null;
        if (selected.features) {
            const deviceMenuItems: Array<DeviceMenuItem> = [];

            if (selected.status !== 'available') {
                deviceMenuItems.push({ type: 'reload', label: 'Renew session' });
            }

            deviceMenuItems.push({ type: 'settings', label: 'Device settings' });
            if (selected.features.passphrase_protection && selected.connected && selected.available) {
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

        const sortByInstance = (a: TrezorDevice, b: TrezorDevice) => {
            if (!a.instance || !b.instance) return -1;
            return a.instance > b.instance ? 1 : -1;
        };
        const deviceList = devices.sort(sortByInstance).map((dev, index) => {
            if (dev === selected) return null;

            let deviceStatus: string = 'Connected';
            let css: string = 'device item';
            if (dev.type === 'unacquired' || (dev.features && dev.status === 'occupied')) {
                deviceStatus = 'Used in other window';
                css += ' unacquired';
            } else if (dev.type === 'unreadable') {
                deviceStatus = 'Connected';
                css += ' connected';
            } else if (!dev.connected) {
                deviceStatus = 'Disconnected';
                css += ' disconnected';
            } else if (!dev.available) {
                deviceStatus = 'Unavailable';
                css += ' unavailable';
            }

            if (dev.features && dev.features.major_version > 1) {
                css += ' trezor-t';
            }

            return (
                <div key={index} className={css} onClick={() => this.props.onSelectDevice(dev)}>
                    <div className="label-container">
                        <span className="label">{dev.instanceLabel}</span>
                        <span className="status">{deviceStatus}</span>
                    </div>
                    <div
                        className="forget-button"
                        onClick={(event) => {
                            event.stopPropagation();
                            event.preventDefault();
                            this.onDeviceMenuClick({ type: 'forget', label: '' }, dev);
                        }}
                    />
                </div>
            );
        });

        return (
            <Wrapper>
                {currentDeviceMenu}
                {this.props.devices.length > 1 ? <AsideDivider textLeft="Other devices" /> : null}
                {/* <DeviceList devices={devices} /> */}
                {deviceList}
                {webUsbButton}
            </Wrapper>
        );
    }
}
