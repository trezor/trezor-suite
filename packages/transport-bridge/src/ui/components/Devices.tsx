import { H2 } from '@trezor/components/src/components/typography/Heading/Heading';
import { Descriptor } from '@trezor/transport/src/types';

import { Card } from './Card';
import { Device } from './Device';
import { Translation } from './Translation';

export interface DevicesProps {
    devices: Descriptor[];
}

export const Devices = ({ devices }: DevicesProps) => {
    return (
        <>
            <H2>
                <Translation id="devices" />
            </H2>

            <Card>
                {devices.length === 0 && <Translation id="devices.no.connected" />}
                {devices.length > 0 && (
                    <Translation id="devices.connected.num" values={{ number: devices.length }} />
                )}
                {devices.map(device => (
                    <Device key={device.path} device={device} />
                ))}
            </Card>
        </>
    );
};
