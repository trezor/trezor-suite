import { TranslationKey } from '@suite-common/intl-types';
import { Banner, Row } from '@trezor/components';
import { FirmwareHashCheckError, FirmwareRevisionCheckError } from '@trezor/connect';
import {
    HELP_CENTER_FIRMWARE_REVISION_CHECK,
    TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL,
} from '@trezor/urls';
import { spacings } from '@trezor/theme';

import { Translation, TrezorLink } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { SkippedHashCheckError } from 'src/constants/suite/firmware';
import {
    selectFirmwareHashCheckErrorIfEnabled,
    selectFirmwareRevisionCheckErrorIfEnabled,
} from 'src/reducers/suite/suiteReducer';

const revisionCheckMessages: Record<FirmwareRevisionCheckError, TranslationKey> = {
    'cannot-perform-check-offline': 'TR_DEVICE_FIRMWARE_REVISION_CHECK_UNABLE_TO_PERFORM',
    'other-error': 'TR_FIRMWARE_REVISION_CHECK_OTHER_ERROR',
    'revision-mismatch': 'TR_FIRMWARE_REVISION_CHECK_FAILED',
    'firmware-version-unknown': 'TR_FIRMWARE_REVISION_CHECK_FAILED',
};

const hashCheckMessages: Record<
    Exclude<FirmwareHashCheckError, SkippedHashCheckError>,
    TranslationKey
> = {
    'hash-mismatch': 'TR_DEVICE_FIRMWARE_HASH_CHECK_HASH_MISMATCH',
    'other-error': 'TR_DEVICE_FIRMWARE_HASH_CHECK_OTHER_ERROR',
};

const useAuthenticityCheckMessage = (): TranslationKey | null => {
    const firmwareRevisionError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);
    const firmwareHashError = useSelector(selectFirmwareHashCheckErrorIfEnabled);

    if (firmwareRevisionError) {
        return revisionCheckMessages[firmwareRevisionError];
    }
    if (firmwareHashError) {
        return hashCheckMessages[firmwareHashError];
    }

    return null;
};

const urlWithChatBox = `${TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL}#open-chat`;

const BannerButtons = () => (
    <Row gap={spacings.sm}>
        <TrezorLink variant="nostyle" href={urlWithChatBox}>
            <Banner.Button>
                <Translation id="TR_CONTACT_TREZOR_SUPPORT" />
            </Banner.Button>
        </TrezorLink>
        <TrezorLink variant="nostyle" href={HELP_CENTER_FIRMWARE_REVISION_CHECK}>
            <Banner.Button isSubtle>
                <Translation id="TR_LEARN_MORE" />
            </Banner.Button>
        </TrezorLink>
    </Row>
);

export const FirmwareAuthenticityCheckBanner = () => {
    const firmwareRevisionError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);
    const firmwareHashError = useSelector(selectFirmwareHashCheckErrorIfEnabled);
    const wasOffline = firmwareRevisionError === 'cannot-perform-check-offline';
    const isHashCheckOtherError =
        firmwareRevisionError === null && firmwareHashError === 'other-error';

    const message = useAuthenticityCheckMessage();
    if (message === null) return null;

    return (
        <Banner
            icon
            variant={isHashCheckOtherError ? 'warning' : 'destructive'}
            rightContent={wasOffline ? null : <BannerButtons />}
        >
            <Translation id={message} />
        </Banner>
    );
};
