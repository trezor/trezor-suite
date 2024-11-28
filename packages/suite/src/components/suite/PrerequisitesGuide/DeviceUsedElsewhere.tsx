import { MouseEventHandler } from 'react';

import { acquireDevice } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';

import { Translation, TroubleshootingTips } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import {
    TROUBLESHOOTING_TIP_RECONNECT,
    TROUBLESHOOTING_TIP_CLOSE_ALL_TABS,
} from 'src/components/suite/troubleshooting/tips';

export const DeviceUsedElsewhere = () => {
    const { isLocked, device } = useDevice();
    const dispatch = useDispatch();

    const isDeviceLocked = isLocked();

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
        dispatch(acquireDevice());
    };

    const ctaButton = (
        <Button
            data-testid="@device-used-elsewhere"
            isLoading={isDeviceLocked}
            onClick={handleClick}
        >
            <Translation id="TR_ACQUIRE_DEVICE" />
        </Button>
    );

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
            cta={ctaButton}
            items={tips}
        />
    );
};
