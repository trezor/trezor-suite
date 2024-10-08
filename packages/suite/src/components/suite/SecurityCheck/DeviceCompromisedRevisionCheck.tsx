import { useEffect } from 'react';

import { isDeviceAcquired } from '@suite-common/suite-utils';
import { deviceActions } from '@suite-common/wallet-core';
import { Card } from '@trezor/components';
import { getFirmwareVersion } from '@trezor/device-utils';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL } from '@trezor/urls';

import { WelcomeLayout } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { captureSentryMessage, withSentryScope } from 'src/utils/suite/sentry';
import { SecurityCheckFail } from 'src/components/suite/SecurityCheck/SecurityCheckFail';

export const DeviceCompromisedRevisionCheck = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const revision = device?.features?.revision;
    const version = getFirmwareVersion(device);
    const vendor = device?.features?.fw_vendor;
    const authenticityError =
        isDeviceAcquired(device) && device.authenticityChecks?.firmwareRevision?.success === false
            ? device.authenticityChecks.firmwareRevision?.error
            : undefined;

    const goToSuite = () => {
        // Condition to satisfy TypeScript, device.id is always defined at this point.
        if (device?.id) {
            dispatch(deviceActions.dismissFirmwareRevisionCheck(device.id));
        }
    };

    useEffect(() => {
        const contextData = { revision, version, vendor, authenticityError };

        withSentryScope(scope => {
            scope.setLevel('error');
            scope.setTag('deviceAuthenticityError', 'firmware revision check failed');
            captureSentryMessage(
                `Firmware revision check failed! ${JSON.stringify(contextData)}`,
                scope,
            );
        });
    }, [authenticityError, revision, vendor, version]);

    return (
        <WelcomeLayout>
            <Card data-testid="@device-compromised/revision-check">
                <SecurityCheckFail
                    goBack={goToSuite}
                    supportUrl={TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL}
                />
            </Card>
        </WelcomeLayout>
    );
};
