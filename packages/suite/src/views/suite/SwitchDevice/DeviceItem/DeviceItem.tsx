import { useState } from 'react';

import * as deviceUtils from '@suite-common/suite-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Column, IconButton, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import type { AcquiredDevice, ForegroundAppProps, TrezorDevice } from 'src/types/suite';

import { AddWalletButton } from './AddWalletButton';
import { WalletInstance } from './WalletInstance';
import { CardWithDevice } from '../CardWithDevice';
import { EjectAllConfirmation } from './EjectAllConfirmation';

type DeviceItemProps = {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    onCancel?: ForegroundAppProps['onCancel'];
};

export const DeviceItem = ({ device, instances, onCancel }: DeviceItemProps) => {
    const [isEjecting, setIsEjecting] = useState(false);
    const selectedDevice = useSelector(selectSelectedDevice);

    const instancesWithState = instances.filter(i => i.state);

    return (
        <CardWithDevice
            isFindTrezorVisible
            onCancel={onCancel}
            device={device}
            actions={
                instancesWithState.length > 0 && !isEjecting ? (
                    <Tooltip content={<Translation id="TR_EJECT_ALL_HEADING" />}>
                        <IconButton
                            icon="eject"
                            variant="tertiary"
                            size="small"
                            onClick={() => setIsEjecting(true)}
                        />
                    </Tooltip>
                ) : null
            }
        >
            {isEjecting ? (
                <EjectAllConfirmation onCancel={() => setIsEjecting(false)} instances={instances} />
            ) : (
                <Column gap={spacings.sm}>
                    {instancesWithState.length > 0 && (
                        <Column gap={spacings.xs}>
                            {instancesWithState.map((instance, index) => (
                                <WalletInstance
                                    key={`${instance.id}-${instance.instance}-${instance.state}`}
                                    instance={instance}
                                    isSelected={deviceUtils.isSelectedInstance(
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
            )}
        </CardWithDevice>
    );
};
