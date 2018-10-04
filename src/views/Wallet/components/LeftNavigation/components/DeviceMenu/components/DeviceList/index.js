import React, { Component } from 'react';
import styled from 'styled-components';
import Icon from 'components/Icon';
import DeviceHeader from 'components/DeviceHeader';
import icons from 'config/icons';
import colors from 'config/colors';
import { withRouter } from 'react-router-dom';

const Wrapper = styled.div``;
const IconClick = styled.div``;

class DeviceList extends Component {
    sortByInstance(a, b) {
        if (!a.instance || !b.instance) return -1;
        return a.instance > b.instance ? 1 : -1;
    }

    redirectToBootloader(selectedDevice) {
        this.props.history.push(`/device/${selectedDevice.features.device_id}/bootloader`);
    }

    render() {
        const {
            devices, selectedDevice, onSelectDevice, forgetDevice,
        } = this.props;
        return (
            <Wrapper>
                {devices
                    .sort(this.sortByInstance)
                    .map(device => (
                        device !== selectedDevice && (
                            <DeviceHeader
                                key={device.state || device.path}
                                isBootloader={device.features && device.features.bootloader_mode}
                                onClickWrapper={() => {
                                    if (device.features) {
                                        if (device.features.bootloader_mode) {
                                            this.redirectToBootloader(selectedDevice);
                                        }
                                    }
                                    onSelectDevice(device);
                                }}
                                onClickIcon={() => forgetDevice(device)}
                                icon={(
                                    <React.Fragment>
                                        <IconClick onClick={(event) => {
                                            event.stopPropagation();
                                            event.preventDefault();
                                            forgetDevice(device);
                                        }}
                                        >
                                            <Icon
                                                icon={icons.EJECT}
                                                size={25}
                                                color={colors.TEXT_SECONDARY}
                                            />
                                        </IconClick>
                                    </React.Fragment>
                                )}
                                device={device}
                                devices={devices}
                                isHoverable
                            />
                        )
                    ))}

            </Wrapper>
        );
    }
}

export default withRouter(DeviceList);