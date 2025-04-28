import { selectWasFwHashCheckOtherErrorLastTime } from '@suite-common/wallet-core';
import { Card } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import {
    selectFirmwareHashCheckErrorIfEnabled,
    selectFirmwareRevisionCheckErrorIfEnabled,
    selectIsEntropyCheckEnabledAndFailed,
} from 'src/reducers/suite/suiteReducer';

import { SecurityCheckFail } from './SecurityCheckFail';
import { hardFailureChecklistItems, softFailureChecklistItems } from './checklistItems';
import {
    DismissFwAuthenticityCheckButton,
    EntropyCheckSupportButton,
    FwAuthencityChecksCtas,
} from './deviceCompromisedCtas';
import { WelcomeLayout } from '../layouts/WelcomeLayout/WelcomeLayout';

const DeviceCompromisedContent = () => {
    const revisionCheckError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);
    const hashCheckError = useSelector(selectFirmwareHashCheckErrorIfEnabled);
    const isEntropyCheckFailed = useSelector(selectIsEntropyCheckEnabledAndFailed);
    const wasHashCheckOtherErrorLastTime = useSelector(selectWasFwHashCheckOtherErrorLastTime);

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
                text="TR_DEVICE_COMPROMISED_FW_HASH_CHECK_TEXT"
                checklistItems={hardFailureChecklistItems}
            />
        );
    }

    // should not happen, but default props will be used with no problem
    return <SecurityCheckFail ctaSection={<FwAuthencityChecksCtas />} />;
};

export const DeviceCompromised = () => (
    <WelcomeLayout>
        <Card data-testid="@device-compromised">
            <DeviceCompromisedContent />
        </Card>
    </WelcomeLayout>
);
