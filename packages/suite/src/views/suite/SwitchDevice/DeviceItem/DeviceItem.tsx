import styled from 'styled-components';
import { variables } from '@trezor/components';
import * as deviceUtils from '@suite-common/suite-utils';

import { selectDevice, selectDeviceThunk } from '@suite-common/wallet-core';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { WalletInstance } from './WalletInstance';
import { AddWalletButton } from './AddWalletButton';

import { acquireDevice } from '@suite-common/wallet-core';
import type { TrezorDevice, AcquiredDevice, ForegroundAppProps } from 'src/types/suite';
import { spacingsPx } from '@trezor/theme';
import { CardWithDevice } from '../CardWithDevice';
import { DeviceWarning } from './DeviceWarning';
import { redirectAfterWalletSelectedThunk } from 'src/actions/wallet/addWalletThunk';

const WalletsWrapper = styled.div<{ $enabled: boolean }>`
    opacity: ${({ $enabled }) => ($enabled ? 1 : 0.5)};
    pointer-events: ${({ $enabled }) => ($enabled ? 'unset' : 'none')};
    padding-bottom: ${({ $enabled }) => ($enabled ? '0px' : '24px')};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-left: 0;
    }
`;

const InstancesWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
`;

interface DeviceItemProps {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    onCancel: ForegroundAppProps['onCancel'];
    isCloseButtonVisible?: boolean;
}

export const DeviceItem = ({
    device,
    instances,
    onCancel,
    isCloseButtonVisible,
}: DeviceItemProps) => {
    const selectedDevice = useSelector(selectDevice);
    const dispatch = useDispatch();
    const deviceStatus = deviceUtils.getStatus(device);
    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);
    const instancesWithState = instances.filter(i => i.state);

    const onSolveIssueClick = () => {
        const needsAcquire =
            device.type === 'unacquired' ||
            deviceStatus === 'used-in-other-window' ||
            deviceStatus === 'was-used-in-other-window';
        if (needsAcquire) {
            dispatch(acquireDevice(device));
        } else {
            dispatch(selectDeviceThunk({ device }));
            dispatch(redirectAfterWalletSelectedThunk());
            onCancel(false);
        }
    };

    return (
        <CardWithDevice
            deviceWarning={
                <DeviceWarning
                    needsAttention={needsAttention}
                    device={device}
                    onSolveIssueClick={onSolveIssueClick}
                />
            }
            onCancel={onCancel}
            device={device}
            isCloseButtonVisible={isCloseButtonVisible}
        >
            <WalletsWrapper $enabled>
                <InstancesWrapper>
                    {instancesWithState.map((instance, index) => (
                        <WalletInstance
                            key={`${instance.id}-${instance.instance}-${instance.state}`}
                            instance={instance}
                            enabled
                            selected={deviceUtils.isSelectedInstance(selectedDevice, instance)}
                            index={index}
                            onCancel={onCancel}
                        />
                    ))}
                </InstancesWrapper>

                <AddWalletButton device={device} instances={instances} onCancel={onCancel} />
            </WalletsWrapper>
        </CardWithDevice>
    );
};
