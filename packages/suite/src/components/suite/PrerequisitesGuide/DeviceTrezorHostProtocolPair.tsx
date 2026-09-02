import { type MouseEventHandler } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { acquireDeviceThunk } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import { Banner } from '@trezor/components';

import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';

export const DeviceTrezorHostProtocolPair = () => {
    const { isLocked, device } = useDevice();
    const dispatch = useDispatch();

    const isDeviceLocked = isLocked();

    const handleStartPairing: MouseEventHandler = () => {
        dispatch(acquireDeviceThunk({ requestedDevice: device }));
    };

    const ctaButton = (
        <Banner.Button
            data-testid="@device-acquire"
            isLoading={isDeviceLocked}
            onClick={handleStartPairing}
        >
            <Translation id="TR_CONTINUE" />
        </Banner.Button>
    );

    return (
        <TroubleshootingTips
            label={<Translation id="TR_THP_CREATE_SECURE_CONNECTION" />}
            cta={ctaButton}
            intent="info"
            items={[]}
        />
    );
};
