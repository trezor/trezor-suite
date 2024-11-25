import { deviceActions } from '@suite-common/wallet-core';
import { Card } from '@trezor/components';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL } from '@trezor/urls';

import { WelcomeLayout } from 'src/components/suite';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import {
    selectFirmwareHashCheckError,
    selectFirmwareRevisionCheckError,
} from 'src/reducers/suite/suiteReducer';

import { SecurityCheckFail, SecurityCheckFailProps } from './SecurityCheckFail';
import { softFailureChecklistItems } from './checklistItems';

export const DeviceCompromised = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const revisionCheckError = useSelector(selectFirmwareRevisionCheckError);
    const hashCheckError = useSelector(selectFirmwareHashCheckError);

    const goToSuite = () => {
        // Condition to satisfy TypeScript, device.id is always defined at this point.
        if (device?.id) {
            dispatch(deviceActions.dismissFirmwareAuthenticityCheck(device.id));
        }
    };

    const isSoftFailure = revisionCheckError === null && hashCheckError === 'other-error';
    const softFailureSecurityCheckFailProps: Partial<SecurityCheckFailProps> = isSoftFailure
        ? {
              heading: 'TR_DEVICE_MAYBE_COMPROMISED_HEADING',
              text: 'TR_DEVICE_MAYBE_COMPROMISED_TEXT',
              checklistItems: softFailureChecklistItems,
          }
        : {};

    return (
        <WelcomeLayout>
            <Card data-testid="@device-compromised">
                <SecurityCheckFail
                    goBack={goToSuite}
                    supportUrl={TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL}
                    {...softFailureSecurityCheckFailProps}
                />
            </Card>
        </WelcomeLayout>
    );
};
