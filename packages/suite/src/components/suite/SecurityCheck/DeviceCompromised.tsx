import { WelcomeLayout } from 'src/components/suite';
import { SecurityCheckFail } from '../SecurityCheck/SecurityCheckFail';
import { Card } from '@trezor/components';
import { useEffect } from 'react';
import { captureSentryMessage, withSentryScope } from '../../../utils/suite/sentry';
import { useDevice } from '../../../hooks/suite';
import { getFirmwareVersion } from '@trezor/device-utils';

export const DeviceCompromised = () => {
    const { device } = useDevice();

    const revision = device?.features?.revision;
    const version = getFirmwareVersion(device);
    const authenticityError =
        device?.features && device.authenticityChecks.firmwareRevision?.success === false
            ? device.authenticityChecks.firmwareRevision?.error
            : undefined;

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
            <Card data-test="@device-compromised">
                <SecurityCheckFail />
            </Card>
        </WelcomeLayout>
    );
};
