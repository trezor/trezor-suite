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

export const DeviceCompromisedHashCheck = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const revision = device?.features?.revision;
    const version = getFirmwareVersion(device);
    const vendor = device?.features?.fw_vendor;
    const authenticityError =
        isDeviceAcquired(device) && device.authenticityChecks?.firmwareHash?.success === false
            ? device.authenticityChecks.firmwareHash?.error
            : undefined;

    const goToSuite = () => {
        // Condition to satisfy TypeScript, device.id is always defined at this point.
        if (device?.id) {
            dispatch(deviceActions.dismissFirmwareHashCheck(device.id));
        }
    };

    useEffect(() => {
        const contextData = { revision, version, vendor, authenticityError };

        withSentryScope(scope => {
            scope.setLevel('error');
            scope.setTag('deviceAuthenticityError', 'firmware hash check failed');
            captureSentryMessage(
                `Firmware hash check failed! ${JSON.stringify(contextData)}`,
                scope,
            );
        });
    }, [authenticityError, revision, vendor, version]);

    return (
        <WelcomeLayout>
            <Card data-testid="@device-compromised/hash-check">
                {/* TODO #14766 REMOVE ME ! */}
                (THIS IS HASH CHECK..)
                <SecurityCheckFail
                    goBack={goToSuite}
                    supportUrl={TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL}
                />
            </Card>
        </WelcomeLayout>
    );
};
