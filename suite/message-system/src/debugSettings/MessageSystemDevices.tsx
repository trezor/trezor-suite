import { useState } from 'react';

import { type Device } from '@suite-common/suite-types';
import { Collapsible, InfoItem, TextButton } from '@trezor/components';
import { CaretDownFilledIcon, CaretUpFilledIcon, DevicesIcon } from '@trezor/icons';

type MessageSystemDevicesProps = {
    devices?: Device[];
};

export const MessageSystemDevices = ({ devices }: MessageSystemDevicesProps) => {
    const [expanded, setExpanded] = useState(false);

    if (!devices || devices.length === 0) {
        return (
            <InfoItem label="Devices" icon={DevicesIcon} intent="neutral" priority="primary">
                -
            </InfoItem>
        );
    }

    const handleToggle = () => setExpanded(prev => !prev);

    return (
        <Collapsible gap={0}>
            <InfoItem
                labelWidth="100%"
                label={
                    <Collapsible.Toggle>
                        <TextButton
                            iconRight={expanded ? CaretUpFilledIcon : CaretDownFilledIcon}
                            intent="neutral"
                            onClick={handleToggle}
                        >
                            Devices ({devices.length})
                        </TextButton>
                    </Collapsible.Toggle>
                }
                icon={DevicesIcon}
                intent="neutral"
                priority="primary"
            >
                <Collapsible.Content>
                    {devices.map((device, index) => (
                        <div key={`${device.model}_${index}`}>
                            <strong>{device.model}</strong>{' '}
                            {JSON.stringify(
                                device,
                                (key, value) => {
                                    if (key === 'model') return undefined;

                                    return value;
                                },
                                2,
                            )}
                        </div>
                    ))}
                </Collapsible.Content>
            </InfoItem>
        </Collapsible>
    );
};
