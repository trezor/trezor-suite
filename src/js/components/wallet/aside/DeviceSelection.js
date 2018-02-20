/* @flow */
'use strict';

import React from 'react';
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

    const onClick = (item, device) => {
        if (props.onClick)
            props.onClick(item, device);
    }

    let deviceStatus: string = "Connected";
    let css: string = "device";
    const deviceMenuItems: Array<any> = [];
    // deviceMenuItems.push("settings");

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

    const deviceMenuButtons = deviceMenuItems.map((item, index) => {
        return (
            <div key={ item } className={ item } onMouseDown={ onMouseDown } onClick={ event => onClick(item, device) }></div>
        )
    });
    const deviceMenu = deviceMenuButtons.length < 1 ? null : (
        <div className="device-menu">
            { deviceMenuButtons }
        </div>
    );

    return (
        <div 
            className={ css }
            onMouseDown={ props.onMouseDown }
            onMouseEnter={ props.onMouseEnter }
            onMouseMove={ props.onMouseMove } >
            <div className="label-container">
                <span className="label">{ device.instanceLabel }</span>
                <span className="status">{ deviceStatus }</span>
            </div>
            { deviceMenu }
        </div>
    );
}

export const DeviceSelect = (props: any): any => {

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
                disabled={ (devices && devices.length <= 1) }
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

export const DeviceDropdown = (props: any): any => {
    const { devices } = props.connect;
    const selected = findSelectedDevice(props.connect);

    const deviceList: Array<any> = devices.map((dev, index) => {
        if (dev === selected) return null;

        let deviceStatus: string = "Connected";
        if (dev.unacquired || dev.isUsedElsewhere) {
            deviceStatus = "Used in other window";
        } else if (!dev.connected) {
            deviceStatus = "Disconnected";
        }
        return (
            <div key={index} className="device item" onMouseDown={ () => props.onSelectDevice(dev) } onTouchStart={ () => props.onSelectDevice(dev) } >
                <div className="label-container">
                    <span className="label">{ dev.instanceLabel }</span>
                    <span className="status">{ deviceStatus }</span>
                </div>
            </div>
        );
    });

    return (
        <section>
            { deviceList }
        </section>
    );
}