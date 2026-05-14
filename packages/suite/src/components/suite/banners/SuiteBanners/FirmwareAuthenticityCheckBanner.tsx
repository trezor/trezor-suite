import { Translation, type TranslationKey } from '@suite/intl';
import { selectWasFwHashCheckOtherErrorLastTime } from '@suite-common/device';
import {
    type SkippedHashCheckError,
    type SkippedRevisionCheckError,
} from '@suite-common/firmware-authenticity';
import { Banner } from '@trezor/components';
import { type FirmwareHashCheckError, type FirmwareRevisionCheckError } from '@trezor/connect';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL } from '@trezor/urls';

import { useSelector } from 'src/hooks/suite';
import {
    selectFirmwareHashCheckErrorIfEnabled,
    selectFirmwareRevisionCheckErrorIfEnabled,
} from 'src/selectors/suite/suiteAuthenticityChecksSelectors';

const revisionCheckMessages: Record<
    Exclude<FirmwareRevisionCheckError, SkippedRevisionCheckError>,
    TranslationKey
> = {
    'cannot-perform-check-offline': 'TR_DEVICE_FIRMWARE_REVISION_CHECK_UNABLE_TO_PERFORM',
    'revision-mismatch': 'TR_FIRMWARE_REVISION_CHECK_FAILED',
    'firmware-version-unknown': 'TR_FIRMWARE_REVISION_CHECK_FAILED',
};

const hashCheckMessages: Record<
    // map only for active cases, and except 'other-error' because it has complex handling
    Exclude<FirmwareHashCheckError, SkippedHashCheckError | 'other-error'>,
    TranslationKey
> = {
    'hash-mismatch': 'TR_DEVICE_FIRMWARE_HASH_CHECK_HASH_MISMATCH',
    'takes-too-long': 'TR_DEVICE_FIRMWARE_HASH_TAKES_TOO_LONG',
};

const useAuthenticityCheckMessage = (): TranslationKey | null => {
    const firmwareRevisionError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);
    const firmwareHashError = useSelector(selectFirmwareHashCheckErrorIfEnabled);
    const wasHashCheckOtherErrorLastTime = useSelector(selectWasFwHashCheckOtherErrorLastTime);

    if (firmwareRevisionError !== null) {
        return revisionCheckMessages[firmwareRevisionError];
    }
    if (firmwareHashError === 'other-error') {
        return wasHashCheckOtherErrorLastTime
            ? 'TR_DEVICE_FIRMWARE_HASH_CHECK_OTHER_ERROR_AGAIN'
            : 'TR_DEVICE_FIRMWARE_HASH_CHECK_OTHER_ERROR';
    }
    if (firmwareHashError !== null) {
        return hashCheckMessages[firmwareHashError];
    }

    return null;
};

const urlWithChatBox = `${TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL}#open-chat`;
export const FirmwareAuthenticityCheckBanner = () => {
    const firmwareRevisionError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);
    const firmwareHashError = useSelector(selectFirmwareHashCheckErrorIfEnabled);
    const wasOffline = firmwareRevisionError === 'cannot-perform-check-offline';
    const isHashCheckOtherError =
        firmwareRevisionError === null && firmwareHashError === 'other-error';
    const wasHashCheckOtherErrorLastTime = useSelector(selectWasFwHashCheckOtherErrorLastTime);
    const isFirstHashCheckOtherError = isHashCheckOtherError && !wasHashCheckOtherErrorLastTime;

    const useWarningVariant = isFirstHashCheckOtherError;
    const hideBannerButtons = wasOffline || isFirstHashCheckOtherError;

    const message = useAuthenticityCheckMessage();
    if (message === null) return null;

    return (
        <Banner
            icon
            intent={useWarningVariant ? 'warning' : 'critical'}
            rightContent={
                !hideBannerButtons && (
                    <Banner.Button href={urlWithChatBox}>
                        <Translation id="TR_CONTACT_TREZOR_SUPPORT" />
                    </Banner.Button>
                )
            }
            description={<Translation id={message} />}
        />
    );
};
