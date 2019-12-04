import React from 'react';
import styled from 'styled-components';
import { Button, colors, variables } from '@trezor/components-v2';
import * as deviceUtils from '@suite-utils/device';
import { Props as DeviceModalProps } from '../../Container';
import { AcquiredDevice, TrezorDevice } from '@suite-types';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import WalletInstance from '../WalletInstance';
import * as accountUtils from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';

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
    forgetDeviceInstance: DeviceModalProps['forgetDeviceInstance'];
}

const countCoins = (accounts: Account[]) => {
    const coins = new Set();
    accounts.forEach(acc => coins.add(acc.symbol));
    return coins.size;
};

const DeviceItem = ({
    device,
    instances,
    accounts,
    selectInstance,
    addHiddenWallet,
    forgetDevice,
    forgetDeviceInstance,
    selectedDevice,
    ...props
}: Props) => {
    const deviceStatus = deviceUtils.getStatus(device);
    const getAccountsCount = (device: TrezorDevice) =>
        accountUtils.getDeviceAccounts(device, accounts).length;

    const getCoinsCount = (device: TrezorDevice) =>
        countCoins(accountUtils.getDeviceAccounts(device, accounts));

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
                        inlineWidth
                        onClick={() => {
                            forgetDevice(device);
                        }}
                    >
                        Forget device
                    </ForgetButton>
                </Col>
            </Device>
            {instances.map(instance => (
                <WalletInstance
                    key={`${instance.label}-${instance.instance}-${instance.state}`}
                    instance={instance}
                    accountsCount={getAccountsCount(instance)}
                    coinsCount={getCoinsCount(instance)}
                    active={selectedDevice ? selectedDevice.state === instance.state : false}
                    selectInstance={selectInstance}
                    forgetDeviceInstance={forgetDeviceInstance}
                />
            ))}
            <Actions>
                <Button
                    inlineWidth
                    variant="tertiary"
                    icon="PLUS"
                    onClick={() => {
                        addHiddenWallet(device);
                    }}
                >
                    Add hidden wallet
                </Button>
            </Actions>
        </DeviceWrapper>
    );
};

export default injectIntl(DeviceItem);
