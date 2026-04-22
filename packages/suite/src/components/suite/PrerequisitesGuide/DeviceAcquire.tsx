import { type MouseEventHandler } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { acquireDevice } from '@suite-common/wallet-core';
import { Banner } from '@trezor/components';

import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';
import {
    TROUBLESHOOTING_TIP_CLOSE_ALL_TABS,
    TROUBLESHOOTING_TIP_RECONNECT,
} from 'src/components/suite/troubleshooting/tips';
import { useDispatch } from 'src/hooks/suite';

export const DeviceAcquire = () => {
    const { isLocked } = useDevice();
    const dispatch = useDispatch();

    const isDeviceLocked = isLocked();

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
        dispatch(acquireDevice({}));
    };

    const ctaButton = (
        <Banner.Button
            data-testid="@device-acquire"
            isLoading={isDeviceLocked}
            onClick={handleClick}
            size="small"
        >
            <Translation id="TR_TRY_AGAIN" />
        </Banner.Button>
    );

    const tips = [TROUBLESHOOTING_TIP_CLOSE_ALL_TABS, TROUBLESHOOTING_TIP_RECONNECT];

    return (
        <TroubleshootingTips
            label={<Translation id="TR_NEEDS_ATTENTION_CONNECT_USB_OR_BLUETOOTH" />}
            cta={ctaButton}
            items={tips}
        />
    );
};
