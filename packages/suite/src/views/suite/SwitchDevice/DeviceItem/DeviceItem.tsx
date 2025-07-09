import * as deviceUtils from '@suite-common/suite-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import type { AcquiredDevice, ForegroundAppProps, TrezorDevice } from 'src/types/suite';

import { AddWalletButton } from './AddWalletButton';
import { WalletInstance } from './WalletInstance';
import { CardWithDevice } from '../CardWithDevice';

type DeviceItemProps = {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    onCancel?: ForegroundAppProps['onCancel'];
};

export const DeviceItem = ({ device, instances, onCancel }: DeviceItemProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);

    const instancesWithState = instances.filter(i => i.state);

    return (
        <CardWithDevice isFindTrezorVisible onCancel={onCancel} device={device}>
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
        </CardWithDevice>
    );
};
