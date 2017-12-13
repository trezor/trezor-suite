/* @flow */
'use strict';

import React, { Component } from 'react';

export default class Devices extends Component {
    render() {
        const { devices, selectedDevice } = this.props.connect;
        const deviceList: Array<any> = devices.map((dev, index) => {
            let css: string = "";
            if (dev.unacquired) {
                css += "unacquired";
            }
            if (dev.isUsedElsewhere) {
                css += " used-elsewhere";
            }
            if (dev.featuresNeedsReload) {
                css += " reload-features";
            }
            if (dev.path === selectedDevice) {
                css += " active";
            }
            return (<li key={index} className={css} onClick={ event => this.props.onSelectDevice(dev.path) } >{ dev.label }</li>);
        });

        if (deviceList.length === 0) {
            deviceList.push(
                (<li key={0}>No connected devices</li>)
            );
        }

        return (
            <nav>
                <div className="layout-wrapper">
                    <ul>
                        { deviceList }
                    </ul>
                </div>
            </nav>
        );
    }
}
