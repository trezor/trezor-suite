import { useEffect } from 'react';
import { deviceActions } from '@suite-common/wallet-core';
import { Card } from '@trezor/components';
import { getFirmwareVersion } from '@trezor/device-utils';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL } from '@trezor/urls';

import { WelcomeLayout } from 'src/components/suite';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { captureSentryMessage, withSentryScope } from 'src/utils/suite/sentry';
import {
    selectFirmwareHashCheckError,
    selectFirmwareRevisionCheckError,
} from 'src/reducers/suite/suiteReducer';
import { SecurityCheckFail } from 'src/components/suite/SecurityCheck/SecurityCheckFail';

const reportCheckFail = (checkType: 'revision' | 'hash', contextData: any) => {
    withSentryScope(scope => {
        scope.setLevel('error');
        scope.setTag('deviceAuthenticityError', `firmware ${checkType} check failed`);
        captureSentryMessage(
            `Firmware ${checkType} check failed! ${JSON.stringify(contextData)}`,
            scope,
        );
    });
};

export const DeviceCompromised = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const revision = device?.features?.revision;
    const version = getFirmwareVersion(device);
    const vendor = device?.features?.fw_vendor;

    const revisionCheckError = useSelector(selectFirmwareRevisionCheckError);
    const hashCheckError = useSelector(selectFirmwareHashCheckError);

    const goToSuite = () => {
        // Condition to satisfy TypeScript, device.id is always defined at this point.
        if (device?.id) {
            dispatch(deviceActions.dismissFirmwareAuthenticityCheck(device.id));
        }
    };

    useEffect(() => {
        const commonData = { revision, version, vendor };
        if (revisionCheckError) reportCheckFail('revision', { ...commonData, revisionCheckError });
        if (hashCheckError) reportCheckFail('hash', { ...commonData, hashCheckError });
    }, [revisionCheckError, hashCheckError, revision, vendor, version]);

    return (
        <WelcomeLayout>
            <Card data-testid="@device-compromised">
                <SecurityCheckFail
                    goBack={goToSuite}
                    supportUrl={TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL}
                />
            </Card>
        </WelcomeLayout>
    );
};
