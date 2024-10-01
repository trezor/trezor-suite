import { MouseEventHandler } from 'react';

import { acquireDevice } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';

import { Translation, TroubleshootingTips } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { TROUBLESHOOTING_TIP_RECONNECT } from 'src/components/suite/troubleshooting/tips';

export const DeviceAcquire = () => {
    const { isLocked, device } = useDevice();
    const dispatch = useDispatch();

    const isDeviceLocked = isLocked();

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
        dispatch(acquireDevice());
    };

    const ctaButton = (
        <Button data-testid="@device-acquire" isLoading={isDeviceLocked} onClick={handleClick}>
            <Translation id="TR_ACQUIRE_DEVICE" />
        </Button>
    );

    const tips = [
        {
            key: 'device-used-elsewhere',
            heading: <Translation id="TR_DEVICE_CONNECTED_UNACQUIRED" />,
            description: device?.transportSessionOwner ? (
                <Translation
                    id="TR_DEVICE_CONNECTED_UNACQUIRED_DESCRIPTION"
                    values={{
                        transportSessionOwner: device.transportSessionOwner,
                    }}
                />
            ) : (
                // legacy bridge does not share transportSessionOwner information
                <Translation id="TR_DEVICE_CONNECTED_UNACQUIRED_DESCRIPTION_UNKNOWN_APP" />
            ),
        },
        {
            key: 'device-acquire',
            heading: <Translation id="TR_TROUBLESHOOTING_CLOSE_TABS" />,
            description: (
                <Translation
                    id={
                        isDesktop()
                            ? 'TR_TROUBLESHOOTING_CLOSE_TABS_DESCRIPTION_DESKTOP'
                            : 'TR_TROUBLESHOOTING_CLOSE_TABS_DESCRIPTION'
                    }
                />
            ),
        },
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
