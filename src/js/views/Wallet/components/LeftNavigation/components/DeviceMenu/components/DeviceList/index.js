import React from 'react';
import styled from 'styled-components';
import deviceConstants from 'constants/device';

const Wrapper = styled.div``;

class DeviceList {
    getStatus(device) {
        let deviceStatus = '';
        if (device.type === 'unacquired' || (device.features && device.status === 'occupied')) {
            deviceStatus = 'Used in other window';
        } else if (device.type === 'unreadable') {
            deviceStatus = 'Connected';
        } else if (!device.connected) {
            deviceStatus = 'Disconnected';
        } else if (!device.available) {
            deviceStatus = 'Unavailable';
        }

        return deviceStatus;
    }

    render() {
        return (
            <Wrapper>
                {this.props.devices.map((device, index) => (
                    <div key={index} className={css} onClick={() => this.props.onSelectDevice(device)}>
                        <div className="label-container">
                            <span className="label">{device.instanceLabel}</span>
                            <span className="status">{this.getStatus(device)}</span>
                        </div>
                        <div
                            className="forget-button"
                            onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                this.onDeviceMenuClick({ type: 'forget', label: '' }, device);
                            }}
                        />
                    </div>
                ))}
            </Wrapper>
        );
    }
}

export default DeviceList;