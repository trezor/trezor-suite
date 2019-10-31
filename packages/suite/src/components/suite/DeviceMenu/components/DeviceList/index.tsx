import React from 'react';
import styled from 'styled-components';
import DeviceItem from '@suite-components/DeviceMenu/components/DeviceItem';
import * as deviceUtils from '@suite-utils/device';
import { Icon, colors } from '@trezor/components';
import { TrezorDevice, AcquiredDevice } from '@suite-types';
import DeviceInstances from '../DeviceInstances';

const Wrapper = styled.div``;

const IconClick = styled.div``;

interface Props {
    devices: TrezorDevice[];
    instances: AcquiredDevice[][];
    selectDevice: (device: TrezorDevice) => void;
    requestForgetDevice: (device: TrezorDevice) => void;
}

const DeviceList = ({ devices, instances, selectDevice, requestForgetDevice }: Props) => (
    <>
        {devices.map((device: TrezorDevice, index: number) => (
            <Wrapper key={device.state || device.path}>
                <DeviceItem
                    isAccessible={deviceUtils.isDeviceAccessible(device)}
                    onClick={() => {
                        selectDevice(device);
                    }}
                    data-test={`@suite/device-item-${index}`}
                    icon={
                        <>
                            <IconClick
                                onClick={event => {
                                    requestForgetDevice(device);
                                    event.stopPropagation();
                                    event.preventDefault();
                                }}
                            >
                                <Icon
                                    icon="EJECT"
                                    size={14}
                                    color={colors.TEXT_SECONDARY}
                                    hoverColor={colors.TEXT_PRIMARY}
                                />
                            </IconClick>
                        </>
                    }
                    device={device}
                    isHoverable
                />
                <DeviceInstances
                    instances={instances[index]}
                    selectDevice={selectDevice}
                    requestForgetDevice={requestForgetDevice}
                />
            </Wrapper>
        ))}
    </>
);

export default DeviceList;
