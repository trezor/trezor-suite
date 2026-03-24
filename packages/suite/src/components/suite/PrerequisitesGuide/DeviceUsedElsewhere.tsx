import { type MouseEventHandler } from 'react';

import { Translation } from '@suite/intl';
import { isDesktop } from '@trezor/env-utils';

import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';
import {
    TROUBLESHOOTING_TIP_CLOSE_ALL_TABS,
    TROUBLESHOOTING_TIP_RECONNECT,
} from 'src/components/suite/troubleshooting/tips';
import { useDevice } from 'src/hooks/suite';

import { AcquireDeviceButton } from '../AcquireDeviceButton';
import { type TroubleshootingTipsItem } from '../troubleshooting/TroubleshootingTipsItem';

export const DeviceUsedElsewhere = () => {
    const { device } = useDevice();

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
    };

    const tips: TroubleshootingTipsItem[] = [
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
            icon: 'trezorBody',
        },
        TROUBLESHOOTING_TIP_CLOSE_ALL_TABS,
        TROUBLESHOOTING_TIP_RECONNECT,
    ];

    return (
        <TroubleshootingTips
            label={<Translation id="TR_ACQUIRE_DEVICE_TITLE" />}
            cta={<AcquireDeviceButton onClick={handleClick} />}
            items={tips}
            intent="info"
            toggleText={
                isDesktop() ? <Translation id="TR_TROUBLE_SHOOTING_BLUETOOTH" /> : undefined
            }
        />
    );
};
