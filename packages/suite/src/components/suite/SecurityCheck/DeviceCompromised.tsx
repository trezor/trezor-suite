import { useEffect } from 'react';

import { Card } from '@trezor/components';
import { getFirmwareVersion } from '@trezor/device-utils';

import { WelcomeLayout } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { captureSentryMessage, withSentryScope } from 'src/utils/suite/sentry';
import { SecurityCheckFail } from '../SecurityCheck/SecurityCheckFail';
import { deviceActions } from '@suite-common/wallet-core';

export const DeviceCompromised = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const revision = device?.features?.revision;
    const version = getFirmwareVersion(device);
    const authenticityError =
        device?.features && device.authenticityChecks?.firmwareRevision?.success === false
            ? device.authenticityChecks.firmwareRevision?.error
            : undefined;

    const goToSuite = () => {
        // Condition to satisfy TypeScript, device.id is always defined at this point.
        if (device?.id) {
            dispatch(deviceActions.dismissFirmwareRevisionCheck(device.id));
        }
    };

    useEffect(() => {
        const contextData = { revision, version, authenticityError };

        withSentryScope(scope => {
            scope.setLevel('error');
            scope.setTag('deviceAuthenticityError', 'firmware revision check failed');
            captureSentryMessage(
                `Firmware revision check failed! ${JSON.stringify(contextData)}`,
                scope,
            );
        });
    }, [revision, version, authenticityError]);

    return (
        <WelcomeLayout>
            <Card data-testid="@device-compromised">
                <SecurityCheckFail goBack={goToSuite} />
            </Card>
        </WelcomeLayout>
    );
};
