import {
    selectFirmwareHashCheckErrorIfEnabled,
    selectFirmwareRevisionCheckErrorIfEnabled,
    selectIsDeviceIdCheckEnabledAndFailed,
    selectIsDeviceInvariabilityEnabledAndFailed,
    selectIsEntropyCheckEnabledAndFailed,
} from '@suite/authenticity-checks';
import { type TranslationKey } from '@suite/intl';
import { selectWasFwHashCheckOtherErrorLastTime } from '@suite-common/device';
import { type SkippedHashCheckError } from '@suite-common/firmware-authenticity';
import { Card } from '@trezor/components';
import { type FirmwareHashCheckError } from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';

import { SecurityCheckFail } from './components/SecurityCheckFail';
import { hardFailureChecklistItems, softFailureChecklistItems } from './components/checklistItems';
import {
    DismissFwAuthenticityCheckButton,
    EntropyCheckSupportButton,
    FwAuthencityChecksCtas,
    FwAuthenticityCheckSupportButton,
} from './components/ctas';
import { WelcomeLayout } from '../layouts/WelcomeLayout/WelcomeLayout';

const hashCheckSubtitleMap: Record<
    // map only for active cases, and except 'other-error' because it has complex handling
    Exclude<FirmwareHashCheckError, SkippedHashCheckError | 'other-error'>,
    TranslationKey
> = {
    'hash-mismatch': 'TR_DEVICE_COMPROMISED_FW_HASH_CHECK_TEXT',
    'takes-too-long': 'TR_DEVICE_COMPROMISED_FW_HASH_CHECK_TAKES_TOO_LONG_TEXT',
};

const DeviceCompromisedContent = () => {
    const isIdCheckFailure = useSelector(selectIsDeviceIdCheckEnabledAndFailed);
    const isInvariabilityCheckFailure = useSelector(selectIsDeviceInvariabilityEnabledAndFailed);
    const revisionCheckError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);
    const hashCheckError = useSelector(selectFirmwareHashCheckErrorIfEnabled);
    const isEntropyCheckFailed = useSelector(selectIsEntropyCheckEnabledAndFailed);
    const wasHashCheckOtherErrorLastTime = useSelector(selectWasFwHashCheckOtherErrorLastTime);

    // this check is only a precaution, not expected to be seen often. This one cannot be dismissed (need id to register dismissal)
    if (isIdCheckFailure) {
        return (
            <SecurityCheckFail
                ctaSection={<FwAuthenticityCheckSupportButton />}
                heading="TR_DEVICE_COMPROMISED_HEADING"
                text="TR_DEVICE_COMPROMISED_INVALID_ID_TEXT"
                checklistItems={hardFailureChecklistItems}
            />
        );
    }
    // this check is only a precaution, not expected to be seen often
    if (isInvariabilityCheckFailure) {
        return (
            <SecurityCheckFail
                ctaSection={<FwAuthencityChecksCtas />}
                heading="TR_DEVICE_COMPROMISED_HEADING"
                text="TR_DEVICE_COMPROMISED_INVARIABILITY_CHECK_FAILED_TEXT"
                checklistItems={hardFailureChecklistItems}
            />
        );
    }
    if (isEntropyCheckFailed) {
        return (
            <SecurityCheckFail
                ctaSection={<EntropyCheckSupportButton />}
                heading="TR_DEVICE_COMPROMISED_HEADING"
                text="TR_DEVICE_COMPROMISED_ENTROPY_CHECK_TEXT"
                checklistItems={hardFailureChecklistItems}
            />
        );
    }
    // revision check has precedence over hash check, because it does not have the ambiguous other-error state
    if (revisionCheckError !== null) {
        return (
            <SecurityCheckFail
                ctaSection={<FwAuthencityChecksCtas />}
                heading="TR_DEVICE_COMPROMISED_HEADING"
                text="TR_DEVICE_COMPROMISED_FW_REVISION_CHECK_TEXT"
                checklistItems={hardFailureChecklistItems}
            />
        );
    }
    if (hashCheckError === 'other-error') {
        // display harsh modal only if there was an other-error for the second time
        if (wasHashCheckOtherErrorLastTime) {
            return (
                <SecurityCheckFail
                    ctaSection={<FwAuthencityChecksCtas />}
                    heading="TR_FAILED_VERIFY_DEVICE_HEADING"
                    text="TR_FAILED_VERIFY_DEVICE_AGAIN_TEXT"
                    checklistItems={hardFailureChecklistItems}
                />
            );
        }

        // for the first time, display a softer version without a CTA to contact support
        return (
            <SecurityCheckFail
                ctaSection={<DismissFwAuthenticityCheckButton />}
                heading="TR_FAILED_VERIFY_DEVICE_HEADING"
                text="TR_FAILED_VERIFY_DEVICE_TEXT"
                checklistItems={softFailureChecklistItems}
                useCompromisedImage={false}
            />
        );
    }
    if (hashCheckError !== null) {
        return (
            <SecurityCheckFail
                ctaSection={<FwAuthencityChecksCtas />}
                heading="TR_DEVICE_COMPROMISED_HEADING"
                text={hashCheckSubtitleMap[hashCheckError]}
                checklistItems={hardFailureChecklistItems}
            />
        );
    }

    // should not happen, but default props will be used with no problem
    return <SecurityCheckFail ctaSection={<FwAuthencityChecksCtas />} />;
};

/**
 * Screen displayed when one of the non-interactive security checks has failed, i.e. checks that
 * run automatically, without prompting the user, as part of certain flows.
 * In the happy-case scenario, these checks have no visible UX at all.
 * The interactive checks, meanwhile, are handled by `InteractiveDeviceChecksFlow`.
 */
export const DeviceCompromisedScreen = () => (
    <WelcomeLayout showAccounts={false}>
        <Card data-testid="@device-compromised" paddingType="large">
            <DeviceCompromisedContent />
        </Card>
    </WelcomeLayout>
);
