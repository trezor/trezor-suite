import { MouseEventHandler } from 'react';

import { Translation, TroubleshootingTips } from 'src/components/suite';
import { useDevice } from 'src/hooks/suite';
import {
    TROUBLESHOOTING_TIP_RECONNECT,
    TROUBLESHOOTING_TIP_CLOSE_ALL_TABS,
} from 'src/components/suite/troubleshooting/tips';

import { AcquireDeviceButton } from '../AcquireDeviceButton';

export const DeviceUsedElsewhere = () => {
    const { device } = useDevice();

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
    };

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
        />
    );
};
