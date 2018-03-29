/* @flow */
'use strict';

import React, { Component } from 'react';
import Select from 'react-select';

import { findSelectedDevice } from '../../../reducers/TrezorConnectReducer';


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
            <div className="device-menu">
                { deviceMenuButtons }
            </div>
            <div className="arrow">
            </div>
        </div>
    );
}

export const DeviceSelect1 = (props: any): any => {

    const { devices } = props.connect;
    const selected = findSelectedDevice(props.connect);
    if (!selected) return null;

    const handleMenuClick = (type, device) => {
        console.log("handleMenuClick", type, device)
        if (type === 'acquire') {
            props.acquireDevice(device);
        } else if (type === 'forget') {
            props.forgetDevice(device);
        }else if (type === 'settings') {
            props.duplicateDevice(device);
        }
    }

    return (
        <Select 
                className="device-select"
                // disabled={ (devices && devices.length <= 1) }
                disabled={ false }
                searchable={ false }
                clearable= { false }
                tabSelectsValue={ false }
                valueComponent={ Value }
                onValueClick={ handleMenuClick }
                value={ selected }
                options={ [ ] }
                onOpen={ () => props.toggleDeviceDropdown(true) }
                onClose={ () => props.toggleDeviceDropdown(false) }
                />
    );
}


export const DeviceSelect = (props: any): any => {

    const { devices, transport } = props.connect;
    const selected = findSelectedDevice(props.connect);
    if (!selected) return null;

    const handleMenuClick = (type, device) => {
        console.log("handleMenuClick", type, device)
        if (type === 'acquire') {
            props.acquireDevice(device);
        } else if (type === 'forget') {
            props.forgetDevice(device);
        }else if (type === 'settings') {
            props.duplicateDevice(device);
        }
    }

    console.log("DEVSEL", props)

    return (
        <Value 
                className="device-select"
                onClick={ handleMenuClick }
                disabled={ (devices && devices.length <= 1 && transport.indexOf('webusb') < 0) }
                value={ selected }
                opened={ props.deviceDropdownOpened }
                onOpen={ () => props.toggleDeviceDropdown(true) }
                onClose={ () => props.toggleDeviceDropdown(false) }
                />
    );
}

export class DeviceDropdown extends Component {

    constructor(props) {
        super(props);
        this.mouseDownHandler = this.mouseDownHandler.bind(this);
        this.blurHandler = this.blurHandler.bind(this);
    }

    componentDidUpdate() {
        if (this.props.connect.transport.indexOf('webusb') >= 0)
            TrezorConnect.renderWebUSBButton();

        console.log("RENDER USB BUTTON")
    }

    mouseDownHandler(event: MouseEvent): void {
        console.log("HANDLE DOWN!!!!", event)
        let elem = event.target;
        let block: boolean = false;
        while (elem.parentElement) {
            // if (elem.className.indexOf('aside-button') >= 0) {
            if (elem.tagName.toLowerCase() === 'aside') {
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

        if (this.props.connect.transport.indexOf('webusb') >= 0)
            TrezorConnect.renderWebUSBButton();
    }

    componentWillUnmount(): void {
        window.removeEventListener('mousedown', this.mouseDownHandler, false);
        // window.removeEventListener('blur', this.blurHandler, false);
    }

    render() {

        const { devices, transport } = this.props.connect;
        const selected = findSelectedDevice(this.props.connect);

        let webUsbButton = null;
        if (transport.indexOf('webusb') >= 0) {
            webUsbButton = <button className="trezor-webusb-button">Check for devices</button>;
        }

        const deviceList: Array<any> = devices.map((dev, index) => {
            if (dev === selected) return null;

            let deviceStatus: string = "Connected";
            let css: string = "device item"
            if (dev.unacquired || dev.isUsedElsewhere) {
                deviceStatus = "Used in other window";
            } else if (!dev.connected) {
                deviceStatus = "Disconnected";
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
                { webUsbButton }
                { deviceList }
            </section>
        );
    }
}