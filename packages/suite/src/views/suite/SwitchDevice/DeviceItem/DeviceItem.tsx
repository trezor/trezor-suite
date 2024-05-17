import styled from 'styled-components';
import { variables } from '@trezor/components';
import * as deviceUtils from '@suite-common/suite-utils';

import { selectDevice, createDeviceInstance, selectDeviceThunk } from '@suite-common/wallet-core';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';

import { WalletInstance } from './WalletInstance';
import { AddWalletButton } from './AddWalletButton';

import { acquireDevice } from '@suite-common/wallet-core';
import type { TrezorDevice, AcquiredDevice, ForegroundAppProps } from 'src/types/suite';
import type { getBackgroundRoute } from 'src/utils/suite/router';
import { spacingsPx } from '@trezor/theme';
import { CardWithDevice } from '../CardWithDevice';
import { DeviceWarning } from './DeviceWarning';

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
    backgroundRoute: ReturnType<typeof getBackgroundRoute>;
}

export const DeviceItem = ({ device, instances, onCancel, backgroundRoute }: DeviceItemProps) => {
    const selectedDevice = useSelector(selectDevice);
    const dispatch = useDispatch();
    const deviceStatus = deviceUtils.getStatus(device);
    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);
    const instancesWithState = instances.filter(i => i.state);

    const handleRedirection = async () => {
        // Preserve route for dashboard or wallet context only. Redirect from other routes to dashboard index.
        const isWalletOrDashboardContext =
            backgroundRoute && ['wallet', 'dashboard'].includes(backgroundRoute.app);
        if (!isWalletOrDashboardContext) {
            await dispatch(goto('suite-index'));
        }

        // Subpaths of wallet are not available to all account types (e.g. Tokens tab not available to BTC accounts).
        const isWalletSubpath =
            backgroundRoute?.app === 'wallet' && backgroundRoute?.name !== 'wallet-index';
        if (isWalletSubpath) {
            await dispatch(goto('wallet-index'));
        }

        const preserveParams = false;
        onCancel(preserveParams);
    };

    const selectDeviceInstance = (instance: DeviceItemProps['device']) => {
        dispatch(selectDeviceThunk(instance));
        handleRedirection();
    };

    const addDeviceInstance = async (
        instance: DeviceItemProps['device'],
        useEmptyPassphrase?: boolean,
    ) => {
        await dispatch(createDeviceInstance({ device: instance, useEmptyPassphrase }));
        handleRedirection();
    };

    const onSolveIssueClick = () => {
        const needsAcquire =
            device.type === 'unacquired' ||
            deviceStatus === 'used-in-other-window' ||
            deviceStatus === 'was-used-in-other-window';
        if (needsAcquire) {
            dispatch(acquireDevice(device));
        } else {
            selectDeviceInstance(device);
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
        >
            <WalletsWrapper $enabled>
                <InstancesWrapper>
                    {instancesWithState.map((instance, index) => (
                        <WalletInstance
                            key={`${instance.id}-${instance.instance}-${instance.state}`}
                            instance={instance}
                            enabled
                            selected={deviceUtils.isSelectedInstance(selectedDevice, instance)}
                            selectDeviceInstance={selectDeviceInstance}
                            index={index}
                        />
                    ))}
                </InstancesWrapper>

                <AddWalletButton
                    device={device}
                    instances={instances}
                    addDeviceInstance={addDeviceInstance}
                    selectDeviceInstance={selectDeviceInstance}
                />
            </WalletsWrapper>
        </CardWithDevice>
    );
};
