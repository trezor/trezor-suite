import styled from 'styled-components';

import * as deviceUtils from '@suite-common/suite-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Column, variables } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import type { AcquiredDevice, ForegroundAppProps, TrezorDevice } from 'src/types/suite';

import { AddWalletButton } from './AddWalletButton';
import { WalletInstance } from './WalletInstance';
import { CardWithDevice } from '../CardWithDevice';

const WalletsWrapper = styled.div<{ $enabled: boolean }>`
    opacity: ${({ $enabled }) => ($enabled ? 1 : 0.5)};
    pointer-events: ${({ $enabled }) => ($enabled ? 'unset' : 'none')};
    padding-bottom: ${({ $enabled }) => ($enabled ? '0px' : '24px')};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-left: 0;
    }
`;

interface DeviceItemProps {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    onCancel: ForegroundAppProps['onCancel'];
    isFullHeaderVisible?: boolean;
}

export const DeviceItem = ({
    device,
    instances,
    onCancel,
    isFullHeaderVisible,
}: DeviceItemProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);

    const instancesWithState = instances.filter(i => i.state);

    return (
        <CardWithDevice
            isFindTrezorVisible
            onCancel={onCancel}
            device={device}
            isFullHeaderVisible={isFullHeaderVisible}
        >
            <WalletsWrapper $enabled>
                <Column gap={spacings.xs} margin={{ top: spacings.xxs }}>
                    {instancesWithState.length > 0 && (
                        <Column gap={spacings.xs}>
                            {instancesWithState.map((instance, index) => (
                                <WalletInstance
                                    key={`${instance.id}-${instance.instance}-${instance.state}`}
                                    instance={instance}
                                    enabled
                                    selected={deviceUtils.isSelectedInstance(
                                        selectedDevice,
                                        instance,
                                    )}
                                    index={index}
                                    onCancel={onCancel}
                                />
                            ))}
                        </Column>
                    )}
                    <AddWalletButton device={device} instances={instances} onCancel={onCancel} />
                </Column>
            </WalletsWrapper>
        </CardWithDevice>
    );
};
