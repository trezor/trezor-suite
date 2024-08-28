import { selectDevice } from '@suite-common/wallet-core';
import { Warning } from '@trezor/components';
import { HELP_CENTER_FIRMWARE_REVISION_CHECK } from '@trezor/urls';

import { Translation, TrezorLink } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

export const FirmwareRevisionCheckBanner = () => {
    const device = useSelector(selectDevice);

    const wasOffline =
        device?.features &&
        device.authenticityChecks?.firmwareRevision?.success === false &&
        device.authenticityChecks.firmwareRevision.error === 'cannot-perform-check-offline';
    const message = wasOffline
        ? 'TR_DEVICE_FIRMWARE_REVISION_CHECK_UNABLE_TO_PERFORM'
        : 'TR_FIRMWARE_REVISION_CHECK_FAILED';

    return (
        <Warning
            icon
            variant="destructive"
            rightContent={
                !wasOffline && (
                    <TrezorLink variant="nostyle" href={HELP_CENTER_FIRMWARE_REVISION_CHECK}>
                        <Warning.Button iconAlignment="right">
                            <Translation id="TR_LEARN_MORE" />
                        </Warning.Button>
                    </TrezorLink>
                )
            }
        >
            <Translation id={message} />
        </Warning>
    );
};
