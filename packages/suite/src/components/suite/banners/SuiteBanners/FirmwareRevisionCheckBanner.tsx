import { TranslationKey } from '@suite-common/intl-types';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { selectDevice } from '@suite-common/wallet-core';
import { Banner } from '@trezor/components';
import { FirmwareRevisionCheckError } from '@trezor/connect';
import { HELP_CENTER_FIRMWARE_REVISION_CHECK } from '@trezor/urls';

import { Translation, TrezorLink } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

const messages: Record<FirmwareRevisionCheckError, TranslationKey> = {
    'cannot-perform-check-offline': 'TR_DEVICE_FIRMWARE_REVISION_CHECK_UNABLE_TO_PERFORM',
    'other-error': 'TR_FIRMWARE_REVISION_CHECK_OTHER_ERROR',
    'revision-mismatch': 'TR_FIRMWARE_REVISION_CHECK_FAILED',
    'firmware-version-unknown': 'TR_FIRMWARE_REVISION_CHECK_FAILED',
};

export const FirmwareRevisionCheckBanner = () => {
    const device = useSelector(selectDevice);

    if (
        !isDeviceAcquired(device) ||
        device.authenticityChecks?.firmwareRevision?.success !== false
    ) {
        return null;
    }

    const wasOffline =
        device.authenticityChecks.firmwareRevision.error === 'cannot-perform-check-offline';

    return (
        <Banner
            icon
            variant="destructive"
            rightContent={
                !wasOffline && (
                    <TrezorLink variant="nostyle" href={HELP_CENTER_FIRMWARE_REVISION_CHECK}>
                        <Banner.Button iconAlignment="right">
                            <Translation id="TR_LEARN_MORE" />
                        </Banner.Button>
                    </TrezorLink>
                )
            }
        >
            <Translation id={messages[device.authenticityChecks.firmwareRevision.error]} />
        </Banner>
    );
};
