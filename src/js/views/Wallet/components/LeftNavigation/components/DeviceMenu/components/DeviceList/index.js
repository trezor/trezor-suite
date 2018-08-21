import React, { Component } from 'react';
import styled from 'styled-components';
import { getStatus } from 'utils/device';

const Wrapper = styled.div``;

class DeviceList extends Component {
    render() {
        return (
            <Wrapper>
                {this.props.devices.map((device, index) => (
                    <div
                        key={index}
                        onClick={() => this.props.onSelectDevice(device)}
                    >
                        <div className="label-container">
                            <span className="label">{device.instanceLabel}</span>
                            <span className="status">{getStatus(device)}</span>
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