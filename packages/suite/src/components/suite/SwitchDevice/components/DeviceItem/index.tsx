import React from 'react';
import styled from 'styled-components';
import { Button, colors, variables } from '@trezor/components-v2';
import * as deviceUtils from '@suite-utils/device';
import { Props as DeviceModalProps } from '../../Container';
import { AcquiredDevice, TrezorDevice } from '@suite-types';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import WalletInstance from '../WalletInstance/Container';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';

const DeviceWrapper = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 6px;
    border: solid 2px ${colors.BLACK92};
    background-color: ${colors.WHITE};
    width: 100%;

    & + & {
        margin-top: 10px;
    }
`;

const Device = styled.div`
    display: flex;
    padding: 24px;
    flex-direction: row;
    align-items: center;
    border-bottom: 2px solid #f5f5f5;
`;

const DeviceTitle = styled.span`
    font-size: ${variables.FONT_SIZE.NORMAL};
`;
const DeviceStatus = styled.span<{ color: string }>`
    font-size: ${variables.FONT_SIZE.BODY};
    font-weight: 600;
    color: ${props => props.color};
`;

const Badge = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: 600;
    padding: 1px 2px;
    border-radius: 2px;
    background-color: ${colors.BLACK70};
    text-transform: uppercase;
    color: white;
    align-self: center;
`;

const Col = styled.div<{ grow?: number }>`
    display: flex;
    flex-grow: ${props => props.grow || 0};
    align-items: flex-start;
    flex-direction: column;
`;

const Actions = styled.div`
    display: flex;
    padding: 24px;
    justify-content: center;
`;

const ForgetButton = styled(Button)`
    font-size: ${variables.FONT_SIZE.BUTTON};
`;

interface Props extends WrappedComponentProps {
    device: TrezorDevice;
    selectedDevice?: TrezorDevice;
    instances: AcquiredDevice[];
    accounts: DeviceModalProps['accounts'];
    selectInstance: (instance: TrezorDevice) => void;
    forgetDevice: DeviceModalProps['forgetDevice'];
    addHiddenWallet: (instance: TrezorDevice) => void;
    goto: DeviceModalProps['goto'];
}

const DeviceItem = ({
    device,
    instances,
    accounts,
    selectInstance,
    addHiddenWallet,
    forgetDevice,
    selectedDevice,
    goto,
    ...props
}: Props) => {
    const deviceStatus = deviceUtils.getStatus(device);

    return (
        <DeviceWrapper key={device.path}>
            <Device>
                <Col>
                    <DeviceTitle>{device.label}</DeviceTitle>
                    <DeviceStatus color={deviceUtils.getStatusColor(deviceStatus)}>
                        {deviceUtils.getStatusName(deviceStatus, props.intl)}
                    </DeviceStatus>
                </Col>
                <Col grow={1}>
                    {!deviceUtils.isDeviceRemembered(device) && <Badge>Guest Mode</Badge>}
                </Col>
                <Col>
                    <ForgetButton
                        size="small"
                        variant="secondary"
                        onClick={() => goto('settings-device')}
                    >
                        Device settings
                    </ForgetButton>
                </Col>
                <Col>
                    <ForgetButton
                        size="small"
                        variant="secondary"
                        onClick={() => {
                            forgetDevice(device);
                        }}
                    >
                        <Translation {...messages.TR_FORGET} />
                    </ForgetButton>
                </Col>
            </Device>
            {instances.map(instance => (
                <WalletInstance
                    key={`${instance.label}-${instance.instance}-${instance.state}`}
                    instance={instance}
                    active={selectedDevice ? selectedDevice.state === instance.state : false}
                    selectInstance={selectInstance}
                />
            ))}
            <Actions>
                {device.features?.passphrase_protection && (
                    <Button
                        variant="tertiary"
                        icon="PLUS"
                        disabled={!device.connected} // TODO: tooltip?
                        onClick={() => {
                            addHiddenWallet(device);
                        }}
                    >
                        <Translation {...messages.TR_ADD_HIDDEN_WALLET} />
                    </Button>
                )}
            </Actions>
        </DeviceWrapper>
    );
};

export default injectIntl(DeviceItem);
