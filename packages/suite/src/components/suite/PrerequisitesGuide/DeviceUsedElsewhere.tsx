import { MouseEventHandler } from 'react';

import { isDesktop } from '@trezor/env-utils';

import { Translation, TroubleshootingTips } from 'src/components/suite';
import {
    TROUBLESHOOTING_TIP_CLOSE_ALL_TABS,
    TROUBLESHOOTING_TIP_RECONNECT,
} from 'src/components/suite/troubleshooting/tips';
import { useDevice, useSelector } from 'src/hooks/suite';

import { selectSuiteFlags } from '../../../reducers/suite/suiteReducer';
import { AcquireDeviceButton } from '../AcquireDeviceButton';

export const DeviceUsedElsewhere = () => {
    const { device } = useDevice();
    const { isBluetoothEnabled } = useSelector(selectSuiteFlags);

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
    };

    const isBluetoothExpected = isBluetoothEnabled && isDesktop();

    const tips = [
        {
            key: 'device-used-elsewhere',
            heading: <Translation id="TR_DEVICE_CONNECTED_UNACQUIRED" />,
            description: (
                <Translation
                    id="TR_DEVICE_CONNECTED_UNACQUIRED_DESCRIPTION"
                    values={{
                        transportSessionOwner: device?.transportSessionOwner || 'unknown',
                    }}
                />
            ),
        },
        TROUBLESHOOTING_TIP_CLOSE_ALL_TABS,
        TROUBLESHOOTING_TIP_RECONNECT,
    ];

    return (
        <TroubleshootingTips
            label={<Translation id="TR_ACQUIRE_DEVICE_TITLE" />}
            cta={<AcquireDeviceButton onClick={handleClick} />}
            items={tips}
            toggleText={
                isBluetoothExpected ? <Translation id="TR_TROUBLE_SHOOTING_BLUETOOTH" /> : undefined
            }
        />
    );
};
