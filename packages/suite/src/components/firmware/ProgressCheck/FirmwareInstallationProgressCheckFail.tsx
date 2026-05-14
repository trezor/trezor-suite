import { Translation } from '@suite/intl';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL } from '@trezor/urls';

import { SecurityCheckButton } from '../../suite/SecurityCheck/SecurityCheckButton';
import { SecurityCheckFail } from '../../suite/SecurityCheck/SecurityCheckFail';
import { hardFailureChecklistItems } from '../../suite/SecurityCheck/checklistItems';
import { ContactSupport } from '../../suite/SecurityCheck/deviceCompromisedCtas';

// Url is shared with FW authenticity checks, the page is not precise for this check, but close enough.
// It's not worth creating a new page for this temporary measure.
const supportUrl = TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL;

type FirmwareInstallationProgressCheckFailProps = {
    toggleView: () => void;
};

export const FirmwareInstallationProgressCheckFail = ({
    toggleView,
}: FirmwareInstallationProgressCheckFailProps) => (
    <SecurityCheckFail
        heading="TR_DEVICE_COMPROMISED_HEADING"
        text="TR_DEVICE_COMPROMISED_FIRMWARE_WONT_UPDATE_TEXT"
        checklistItems={hardFailureChecklistItems}
        ctaSection={
            <>
                <SecurityCheckButton intent="neutral" priority="secondary" onClick={toggleView}>
                    <Translation id="TR_BACK" />
                </SecurityCheckButton>
                <ContactSupport supportUrl={supportUrl} />
            </>
        }
    />
);
