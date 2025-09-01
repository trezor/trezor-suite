import { useState } from 'react';

import { Device } from '@suite-common/suite-types';
import { Collapsible, InfoItem, TextButton } from '@trezor/components';

type MessageSystemManagerDevicesProps = {
    devices?: Device[];
};

export const MessageSystemManagerDevices = ({ devices }: MessageSystemManagerDevicesProps) => {
    const [expanded, setExpanded] = useState(false);

    if (!devices || devices.length === 0) {
        return (
            <InfoItem label="Devices" iconName="devices" variant="default">
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
                            icon={expanded ? 'caretUpFilled' : 'caretDownFilled'}
                            iconAlignment="end"
                            variant="tertiary"
                            onClick={handleToggle}
                        >
                            Devices ({devices.length})
                        </TextButton>
                    </Collapsible.Toggle>
                }
                iconName="devices"
                variant="default"
            >
                <Collapsible.Content>
                    {devices.map((device, index) => (
                        <div key={`${device.model}_${index}`}>
                            <strong>{device.model}</strong> (firmware: {device.firmware},
                            bootloader: {device.bootloader}, variant: {device.variant},
                            firmwareRevision: {device.firmwareRevision}, vendor: {device.vendor})
                        </div>
                    ))}
                </Collapsible.Content>
            </InfoItem>
        </Collapsible>
    );
};
