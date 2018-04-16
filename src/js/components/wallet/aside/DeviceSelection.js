/* @flow */
'use strict';

import React, { Component } from 'react';
import Select from 'react-select';
import TrezorConnect from 'trezor-connect';

import { findSelectedDevice } from '../../../reducers/TrezorConnectReducer';

import type { Props } from './index';
import type { TrezorDevice } from '../../../flowtype';

const Value = (props: any): any => {
    const device = props.value; // device is passed as value of selected item

    // prevent onMouseDown event
    const onMouseDown = event => {
        if (props.onClick) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    const onClick = (event, item, device) => {
        if (props.onClick) {
            event.preventDefault();
            event.stopPropagation();
            props.onClick(item, device);
        }
    }

    let deviceStatus: string = "Connected";
    let css: string = "device-select device";
    if (props.opened) css += " opened";
    if (props.disabled) css += " disabled";


    const deviceMenuItems: Array<any> = [];

    if (device.features && device.features.passphrase_protection) {
        deviceMenuItems.push("settings"); // TODO: clone
    }

    if (device.unacquired) {
        css += " unacquired";
        deviceStatus = "Used in other window";
    }
    if (device.isUsedElsewhere) {
        css += " used-elsewhere";
        deviceStatus = "Used in other window";
        deviceMenuItems.push("acquire");
    } else if (device.featuresNeedsReload) {
        css += " reload-features";
        //deviceMenuItems.push("acquire");
    }
    if (!device.connected) {
        css += " reload-features";
        deviceStatus = "Disconnected";
    } else if (!device.available) {
        css += " unavailable";
        deviceStatus = "Unavailable";
    }

    if (device.remember) {
        deviceMenuItems.push("forget");
    }

    if (device.features && device.features.major_version > 1) {
        css += " trezor-t";
    }

    

    const deviceMenuButtons = deviceMenuItems.map((item, index) => {
        return (
            <div key={ item } className={ item } onClick={ event => onClick(event, item, device) }></div>
        )
    });
    const deviceMenu = deviceMenuButtons.length < 1 ? null : (
        <div className="device-menu">
            { deviceMenuButtons }
        </div>
    );

    const handleOpen = () => {
        if (props.disabled) return;
        props.opened ? props.onClose() : props.onOpen();
    }

    return (
        <div className={ css } onClick={ handleOpen }>
            <div className="label-container">
                <span className="label">{ device.instanceLabel }</span>
                <span className="status">{ deviceStatus }</span>
            </div>
            <div className="arrow">
            </div>
        </div>
    );
}



export const DeviceSelect = (props: Props) => {

    const { devices, transport } = props.connect;
    const selected: ?TrezorDevice = findSelectedDevice(props.connect);
    if (!selected) return null;

    const handleMenuClick = (type, device) => {
        console.log("handleMenuClick", type, device)
        if (type === 'acquire') {
            props.acquireDevice();
        } else if (type === 'forget') {
            props.forgetDevice(device);
        }else if (type === 'settings') {
            props.duplicateDevice(device);
        }
    }

    const disabled: boolean = (devices.length < 1 && transport && transport.version.indexOf('webusb') < 0);

    return (
        <Value 
                className="device-select"
                onClick={ handleMenuClick }
                disabled={ disabled }
                value={ selected }
                opened={ props.deviceDropdownOpened }
                onOpen={ () => props.toggleDeviceDropdown(true) }
                onClose={ () => props.toggleDeviceDropdown(false) }
                />
    );
}

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
        const transport: any = this.props.connect.transport;
        if (transport && transport.version.indexOf('webusb') >= 0)
            TrezorConnect.renderWebUSBButton();
    }

    mouseDownHandler(event: MouseEvent): void {
        let elem: any = (event.target : any);
        let block: boolean = false;
        while (elem.parentElement) {
            // if (elem.className.indexOf('aside-button') >= 0) {
            if (elem.tagName.toLowerCase() === 'aside' || (elem.className && elem.className.indexOf('modal-container') >= 0)) {
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
        const transport: any = this.props.connect.transport;
        if (transport && transport.version.indexOf('webusb') >= 0)
            TrezorConnect.renderWebUSBButton();
    }

    componentWillUnmount(): void {
        window.removeEventListener('mousedown', this.mouseDownHandler, false);
        // window.removeEventListener('blur', this.blurHandler, false);
    }

    onDeviceMenuClick(item: DeviceMenuItem, device: TrezorDevice): void {
        if (item.type === 'reload') {
            this.props.acquireDevice();
        } else if (item.type === 'forget') {
            // this.props.toggleDeviceDropdown(false);
            this.props.forgetDevice(device);
        } else if (item.type === 'clone') {
            this.props.duplicateDevice(device);
        } else if (item.type === 'settings') {
            this.props.toggleDeviceDropdown(false);
            this.props.gotoDeviceSettings(device);
        }
    }

    render() {

        const { devices, transport } = this.props.connect;
        const selected: ?TrezorDevice = findSelectedDevice(this.props.connect);
        if (!selected) return;

        let webUsbButton = null;
        if (transport && transport.version.indexOf('webusb') >= 0) {
            webUsbButton = <button className="trezor-webusb-button">Check for devices</button>;
        }

        let currentDeviceMenu = null;
        if (selected.features) {
            const deviceMenuItems: Array<DeviceMenuItem> = [];

            if (selected.isUsedElsewhere) {
                deviceMenuItems.push({ type: "reload", label: "Renew session" });
            } else if (selected.featuresNeedsReload) {
                deviceMenuItems.push({ type: "reload", label: "Reload device" });
            }

            deviceMenuItems.push({ type: "settings", label: "Device settings" });
            if (selected.features && selected.features.passphrase_protection && selected.connected && selected.available) {
                deviceMenuItems.push({ type: "clone", label: "Clone device" });
            }
            if (selected.remember) {
                deviceMenuItems.push({ type: "forget", label: "Forget device" });
            }


            const deviceMenuButtons = deviceMenuItems.map((item, index) => {
                return (
                    <div key={ item.type } className={ item.type } onClick={ (event) => this.onDeviceMenuClick(item, selected) }>{ item.label}</div>
                )
            });
            currentDeviceMenu = deviceMenuButtons.length < 1 ? null : (
                <div className="device-menu">
                    { deviceMenuButtons }
                </div>
            );
        }

        // const currentDeviceMenu = (
        //     <div className="device-menu">
        //         <div className="settings">Device settings</div>
        //         <div className="clone">Clone device</div>
        //         <div className="forget">Forget device</div>
        //     </div>
        // );

        const deviceList: Array<any> = devices.map((dev, index) => {
            if (dev === selected) return null;

            let deviceStatus: string = "Connected";
            let css: string = "device item"
            if (dev.unacquired || dev.isUsedElsewhere) {
                deviceStatus = "Used in other window";
            } else if (!dev.connected) {
                deviceStatus = "Disconnected";
            } else if (!dev.available) {
                deviceStatus = "Unavailable";
            }

            if (dev.features && dev.features.major_version > 1) {
                css += " trezor-t";
            }

            return (
                <div key={index} className={ css } onMouseDown={ () => this.props.onSelectDevice(dev) } onTouchStart={ () => this.props.onSelectDevice(dev) } >
                    <div className="label-container">
                        <span className="label">{ dev.instanceLabel }</span>
                        <span className="status">{ deviceStatus }</span>
                    </div>
                </div>
            );
        });

        return (
            <section>
                { currentDeviceMenu }
                { webUsbButton }
                { deviceList }
            </section>
        );
    }
}