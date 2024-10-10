import { TranslationKey } from '@suite-common/intl-types';
import { Banner } from '@trezor/components';
import { FirmwareHashCheckError, FirmwareRevisionCheckError } from '@trezor/connect';
import { HELP_CENTER_FIRMWARE_REVISION_CHECK } from '@trezor/urls';

import { Translation, TrezorLink } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import {
    selectFirmwareHashCheckError,
    selectFirmwareRevisionCheckError,
} from 'src/reducers/suite/suiteReducer';

const revisionCheckMessages: Record<FirmwareRevisionCheckError, TranslationKey> = {
    'cannot-perform-check-offline': 'TR_DEVICE_FIRMWARE_REVISION_CHECK_UNABLE_TO_PERFORM',
    'other-error': 'TR_FIRMWARE_REVISION_CHECK_OTHER_ERROR',
    'revision-mismatch': 'TR_FIRMWARE_REVISION_CHECK_FAILED',
    'firmware-version-unknown': 'TR_FIRMWARE_REVISION_CHECK_FAILED',
};

const hashCheckMessages: Record<
    Exclude<FirmwareHashCheckError, 'check-skipped'>,
    TranslationKey
> = {
    'hash-mismatch': 'TR_DEVICE_FIRMWARE_HASH_CHECK_HASH_MISMATCH',
    'check-unsupported': 'TR_DEVICE_FIRMWARE_HASH_CHECK_CHECK_UNSUPPORTED',
    'unknown-release': 'TR_DEVICE_FIRMWARE_HASH_CHECK_UNKNOWN_RELEASE',
    'other-error': 'TR_DEVICE_FIRMWARE_HASH_CHECK_OTHER_ERROR',
};

const useAuthenticityCheckMessage = (): TranslationKey | null => {
    const firmwareRevisionError = useSelector(selectFirmwareRevisionCheckError);
    const firmwareHashError = useSelector(selectFirmwareHashCheckError);

    if (firmwareRevisionError) {
        return revisionCheckMessages[firmwareRevisionError];
    }
    if (firmwareHashError && firmwareHashError !== 'check-skipped') {
        return hashCheckMessages[firmwareHashError];
    }

    return null;
};

export const FirmwareRevisionCheckBanner = () => {
    const firmwareRevisionError = useSelector(selectFirmwareRevisionCheckError);
    const wasOffline = firmwareRevisionError === 'cannot-perform-check-offline';

    const message = useAuthenticityCheckMessage();
    if (message === null) return null;

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
            <Translation id={message} />
        </Banner>
    );
};
