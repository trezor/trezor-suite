import { deviceActions } from '@suite-common/wallet-core';
import { Card } from '@trezor/components';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL } from '@trezor/urls';

import { WelcomeLayout } from 'src/components/suite';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import {
    selectFirmwareHashCheckErrorIfEnabled,
    selectFirmwareRevisionCheckErrorIfEnabled,
} from 'src/reducers/suite/suiteReducer';

import { SecurityCheckFail, SecurityCheckFailProps } from './SecurityCheckFail';
import { hardFailureChecklistItems, softFailureChecklistItems } from './checklistItems';

const useSecurityCheckFailProps = (): Partial<SecurityCheckFailProps> => {
    const revisionCheckError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);
    const hashCheckError = useSelector(selectFirmwareHashCheckErrorIfEnabled);

    // revision check has precedence over hash check, because it is unimpeachable
    if (revisionCheckError !== null) {
        return {
            heading: 'TR_DEVICE_COMPROMISED_HEADING',
            text: 'TR_DEVICE_COMPROMISED_FW_REVISION_CHECK_TEXT',
            checklistItems: hardFailureChecklistItems,
        };
    }
    // hash check other-error shall display softer wording than standard hash check errors
    if (hashCheckError === 'other-error') {
        return {
            heading: 'TR_FAILED_VERIFY_DEVICE_HEADING',
            text: 'TR_FAILED_VERIFY_DEVICE_TEXT',
            checklistItems: softFailureChecklistItems,
            supportButtonVariant: 'warning',
        };
    }
    if (hashCheckError !== null) {
        return {
            heading: 'TR_DEVICE_COMPROMISED_HEADING',
            text: 'TR_DEVICE_COMPROMISED_FW_HASH_CHECK_TEXT',
            checklistItems: hardFailureChecklistItems,
        };
    }

    // should not happen, but default props will be used with no problem
    return {};
};

export const DeviceCompromised = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const securityCheckFailProps = useSecurityCheckFailProps();

    const goToSuite = () => {
        // Condition to satisfy TypeScript, device.id is always defined at this point.
        if (device?.id) {
            dispatch(deviceActions.dismissFirmwareAuthenticityCheck(device.id));
        }
    };

    return (
        <WelcomeLayout>
            <Card data-testid="@device-compromised">
                <SecurityCheckFail
                    goBack={goToSuite}
                    supportUrl={TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL}
                    {...securityCheckFailProps}
                />
            </Card>
        </WelcomeLayout>
    );
};
