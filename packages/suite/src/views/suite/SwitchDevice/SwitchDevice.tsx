import styled from 'styled-components';

import * as deviceUtils from '@suite-common/suite-utils';
import { selectDevice, selectDevices } from '@suite-common/wallet-core';

import { getBackgroundRoute } from 'src/utils/suite/router';
import { ForegroundAppProps } from 'src/types/suite';
import { useSelector } from 'src/hooks/suite';

import { DeviceItem } from './DeviceItem/DeviceItem';
import { SwitchDeviceRenderer } from './SwitchDeviceRenderer';
import { Card } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { motion } from 'framer-motion';

const DeviceItemsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: ${spacingsPx.md};
    flex: 1;
`;

export const SwitchDevice = ({ cancelable, onCancel }: ForegroundAppProps) => {
    const selectedDevice = useSelector(selectDevice);
    const devices = useSelector(selectDevices);

    // exclude selectedDevice from list, because other devices could have a higher priority
    // and we want to have selectedDevice on top
    const sortedDevices = deviceUtils
        .getFirstDeviceInstance(devices)
        .filter(d => !deviceUtils.isSelectedDevice(selectedDevice, d));

    // append selectedDevice at top of the list
    if (selectedDevice) {
        sortedDevices.unshift(selectedDevice);
    }

    const backgroundRoute = getBackgroundRoute();

    const initial = {
        width: 279,
        height: 70,
    };

    return (
        <SwitchDeviceRenderer isCancelable={cancelable} onCancel={onCancel}>
            <DeviceItemsWrapper>
                <motion.div
                    initial={initial}
                    exit={initial}
                    animate={{
                        width: 369,
                        height: 'auto',
                    }}
                    style={{ originX: 0, originY: 0, overflow: 'hidden' }}
                >
                    <>
                        {sortedDevices.map(device => (
                            <Card key={`${device.id}-${device.instance}`} paddingType="small">
                                <DeviceItem
                                    device={device}
                                    instances={deviceUtils.getDeviceInstances(device, devices)}
                                    backgroundRoute={backgroundRoute}
                                    onCancel={onCancel}
                                />
                            </Card>
                        ))}
                    </>
                </motion.div>
            </DeviceItemsWrapper>
        </SwitchDeviceRenderer>
    );
};
