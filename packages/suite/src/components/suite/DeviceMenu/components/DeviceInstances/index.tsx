import React from 'react';
import styled from 'styled-components';
import { Icon, colors, variables } from '@trezor/components';
import { AcquiredDevice } from '@suite-types';

const { FONT_SIZE } = variables;
const Item = styled.div`
    padding: 12px 22px 12px 58px;
    display: flex;
    height: 38px;
    align-items: center;
    font-size: ${FONT_SIZE.BASE};
    cursor: pointer;
    color: ${colors.TEXT_SECONDARY};

    &:hover {
        background: ${colors.GRAY_LIGHT};
    }
`;

const IconWrapper = styled.div`
    width: 18px;
    display: flex;
    justify-content: center;
    margin-right: 15px;
`;

const ForgetWrapper = styled.div`
    width: 18px;
    display: flex;
    justify-content: center;
`;

const Label = styled.div`
    flex: 1;
`;

interface Props {
    instances: AcquiredDevice[];
    selectDevice: (device: AcquiredDevice) => void;
    requestForgetDevice: (device: AcquiredDevice) => void;
}

const DeviceInstances = ({ instances, selectDevice, requestForgetDevice }: Props) => {
    if (instances.length < 1) return null;
    return (
        <>
            {instances.map(device => (
                <Item
                    key={device.instance || 'base'}
                    onClick={() => selectDevice(device)}
                    data-test="@suite/device-instance"
                >
                    <IconWrapper>
                        <Icon
                            icon={device.instance ? 'WALLET_HIDDEN' : 'WALLET_STANDARD'}
                            size={14}
                            color={colors.TEXT_SECONDARY}
                        />
                    </IconWrapper>
                    <Label>{device.instanceLabel}</Label>
                    {device.instance && (
                        <ForgetWrapper
                            onClick={event => {
                                requestForgetDevice(device);
                                event.stopPropagation();
                                event.preventDefault();
                            }}
                        >
                            <Icon
                                icon="EJECT"
                                size={10}
                                color={colors.TEXT_SECONDARY}
                                hoverColor={colors.TEXT_PRIMARY}
                            />
                        </ForgetWrapper>
                    )}
                </Item>
            ))}
        </>
    );
};

export default DeviceInstances;
