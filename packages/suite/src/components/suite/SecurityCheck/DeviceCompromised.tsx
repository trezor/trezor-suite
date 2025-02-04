import { deviceActions } from '@suite-common/wallet-core';
import { Card } from '@trezor/components';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL, TREZOR_SUPPORT_URL } from '@trezor/urls';

import { WelcomeLayout } from 'src/components/suite';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import {
    selectFirmwareHashCheckErrorIfEnabled,
    selectFirmwareRevisionCheckErrorIfEnabled,
    selectIsEntropyCheckEnabledAndFailed,
} from 'src/reducers/suite/suiteReducer';

import { SecurityCheckFail, SecurityCheckFailProps } from './SecurityCheckFail';
import { hardFailureChecklistItems, softFailureChecklistItems } from './checklistItems';

const useSecurityCheckFailProps = (): SecurityCheckFailProps => {
    const { device } = useDevice();
    const revisionCheckError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);
    const hashCheckError = useSelector(selectFirmwareHashCheckErrorIfEnabled);
    const isEntropyCheckFailed = useSelector(selectIsEntropyCheckEnabledAndFailed);
    const dispatch = useDispatch();

    // Let user access the wallet if it may have been initiated before so that they can access the funds and send them to safety.
    const goToSuite = () => {
        // Condition to satisfy TypeScript, device.id is always defined at this point.
        if (device?.id) {
            dispatch(deviceActions.dismissFirmwareAuthenticityCheck(device.id));
        }
    };

    if (isEntropyCheckFailed) {
        return {
            heading: 'TR_DEVICE_COMPROMISED_HEADING',
            text: 'TR_DEVICE_COMPROMISED_ENTROPY_CHECK_TEXT',
            checklistItems: hardFailureChecklistItems,
            goBack: undefined,
            supportUrl: TREZOR_SUPPORT_URL, // TODO: add specific URL when it is created
        };
    }
    // revision check has precedence over hash check, because it does not have the ambiguous other-error state
    if (revisionCheckError !== null) {
        return {
            heading: 'TR_DEVICE_COMPROMISED_HEADING',
            text: 'TR_DEVICE_COMPROMISED_FW_REVISION_CHECK_TEXT',
            checklistItems: hardFailureChecklistItems,
            goBack: goToSuite,
            supportUrl: TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL,
        };
    }
    // hash check other-error shall display softer wording than standard hash check errors
    if (hashCheckError === 'other-error') {
        return {
            heading: 'TR_FAILED_VERIFY_DEVICE_HEADING',
            text: 'TR_FAILED_VERIFY_DEVICE_TEXT',
            checklistItems: softFailureChecklistItems,
            supportButtonVariant: 'warning',
            goBack: goToSuite,
            supportUrl: TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL,
        };
    }
    if (hashCheckError !== null) {
        return {
            heading: 'TR_DEVICE_COMPROMISED_HEADING',
            text: 'TR_DEVICE_COMPROMISED_FW_HASH_CHECK_TEXT',
            checklistItems: hardFailureChecklistItems,
            goBack: goToSuite,
            supportUrl: TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL,
        };
    }

    // should not happen, but default props will be used with no problem
    return { supportUrl: TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL };
};

export const DeviceCompromised = () => {
    const securityCheckFailProps = useSecurityCheckFailProps();

    return (
        <WelcomeLayout>
            <Card data-testid="@device-compromised">
                <SecurityCheckFail {...securityCheckFailProps} />
            </Card>
        </WelcomeLayout>
    );
};
