/* @flow */


import React, { Component } from 'react';
import Select from 'react-select';
import TrezorConnect from 'trezor-connect';

import type { Props } from './index';
import type { TrezorDevice } from '~/flowtype';

export const DeviceSelect = (props: Props) => {
    const { devices } = props;
    const { transport } = props.connect;

    const selected: ?TrezorDevice = props.wallet.selectedDevice;
    if (!selected) return null;

    let deviceStatus: string = 'Connected';
    let css: string = 'device-select device';
    if (props.deviceDropdownOpened) css += ' opened';

    if (!selected.connected) {
        css += ' disconnected';
        deviceStatus = 'Disconnected';
    } else if (!selected.available) {
        css += ' unavailable';
        deviceStatus = 'Unavailable';
    } else {
        if (selected.unacquired) {
            css += ' unacquired';
            deviceStatus = 'Used in other window';
        }
        if (selected.isUsedElsewhere) {
            css += ' used-elsewhere';
            deviceStatus = 'Used in other window';
        } else if (selected.featuresNeedsReload) {
            css += ' reload-features';
        }
    }

    if (selected.features && selected.features.major_version > 1) {
        css += ' trezor-t';
    }

    const handleOpen = () => {
        props.toggleDeviceDropdown(!props.deviceDropdownOpened);
    };

    const deviceCount = devices.length;
    const webusb: boolean = !!((transport && transport.version.indexOf('webusb') >= 0));
    const disabled: boolean = (devices.length < 1 && !webusb) || (devices.length === 1 && !selected.features);
    if (disabled) {
        css += ' disabled';
    }

    return (
        <div className={css} onClick={!disabled ? handleOpen : null}>
            <div className="label-container">
                <span className="label">{ selected.instanceLabel }</span>
                <span className="status">{ deviceStatus }</span>
            </div>
            { deviceCount > 1 ? <div className="counter">{ deviceCount }</div> : null }
            <div className="arrow" />
        </div>
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

            if (selected.isUsedElsewhere) {
                deviceMenuItems.push({ type: 'reload', label: 'Renew session' });
            } else if (selected.featuresNeedsReload) {
                deviceMenuItems.push({ type: 'reload', label: 'Renew session' });
            }

            deviceMenuItems.push({ type: 'settings', label: 'Device settings' });
            if (selected.features && selected.features.passphrase_protection && selected.connected && selected.available) {
                deviceMenuItems.push({ type: 'clone', label: 'Clone device' });
            }
            //if (selected.remember) {
            deviceMenuItems.push({ type: 'forget', label: 'Forget device' });
            //}


            const deviceMenuButtons = deviceMenuItems.map((item, index) => (
                <div key={item.type} className={item.type} onClick={event => this.onDeviceMenuClick(item, selected)}>{ item.label}</div>
            ));
            currentDeviceMenu = deviceMenuButtons.length < 1 ? null : (
                <div className="device-menu">
                    { deviceMenuButtons }
                </div>
            );
        }

        const deviceList = devices.map((dev, index) => {
            if (dev === selected) return null;

            let deviceStatus: string = 'Connected';
            let css: string = 'device item';
            if (dev.unacquired || dev.isUsedElsewhere) {
                deviceStatus = 'Used in other window';
                css += ' unacquired';
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
                        <span className="label">{ dev.instanceLabel }</span>
                        <span className="status">{ deviceStatus }</span>
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
            <section>
                { currentDeviceMenu }
                { deviceList.length > 1 ? <div className="device-divider">Other devices</div> : null }
                { deviceList }
                { webUsbButton }
            </section>
        );
    }
}