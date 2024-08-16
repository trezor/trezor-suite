import { useState, useEffect } from 'react';
import styled from 'styled-components';

import { isDesktop } from '@trezor/env-utils';
import { selectBannerMessage } from '@suite-common/message-system';
import { selectDevice } from '@suite-common/wallet-core';

import { isTranslationMode } from 'src/utils/suite/l10n';
import { useSelector } from 'src/hooks/suite';
import { MAX_CONTENT_WIDTH } from 'src/constants/suite/layout';

import { MessageSystemBanner } from '../MessageSystemBanner';
import { OnlineStatus } from './OnlineStatusBanner';
import { UpdateBridge } from './UpdateBridgeBanner';
import { UpdateFirmware } from './UpdateFirmwareBanner';
import { NoBackup } from './NoBackupBanner';
import { FailedBackup } from './FailedBackupBanner';
import { SafetyChecksBanner } from './SafetyChecksBanner';
import { TranslationMode } from './TranslationModeBanner';
import { FirmwareHashMismatch } from './FirmwareHashMismatchBanner';
import { UnableToPerformRevisionCheck } from './UnableToPerformRevisionCheck';
import { spacingsPx } from '@trezor/theme';

const Container = styled.div<{ $isVisible?: boolean }>`
    width: 100%;
    max-width: ${MAX_CONTENT_WIDTH};
    padding: ${spacingsPx.sm} ${spacingsPx.md};
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
`;

export const SuiteBanners = () => {
    const transport = useSelector(state => state.suite.transport);
    const device = useSelector(selectDevice);
    const online = useSelector(state => state.suite.online);
    const firmwareHashInvalid = useSelector(state => state.firmware.firmwareHashInvalid);
    const bannerMessage = useSelector(selectBannerMessage);
    const { isFirmwareRevisionCheckDisabled } = useSelector(state => state.suite.settings);

    // The dismissal doesn't need to outlive the session. Use local state.
    const [safetyChecksDismissed, setSafetyChecksDismissed] = useState(false);
    useEffect(() => {
        setSafetyChecksDismissed(false);
    }, [device?.features?.safety_checks]);

    const showUpdateBridge = () => {
        if (
            isDesktop() &&
            transport?.version &&
            ['2.0.27', '2.0.28', '2.0.29'].includes(transport.version)
        ) {
            return false;
        }

        return transport?.outdated;
    };

    let banner = null;
    let priority = 0;
    if (device?.id && firmwareHashInvalid.includes(device.id)) {
        banner = <FirmwareHashMismatch />;
        priority = 92;
    } else if (
        !isFirmwareRevisionCheckDisabled &&
        device?.features &&
        device?.authenticityChecks !== undefined &&
        device?.authenticityChecks.firmwareRevision !== null && // check was performed
        device?.authenticityChecks.firmwareRevision.success === false &&
        device?.authenticityChecks.firmwareRevision.error === 'cannot-perform-check-offline' // but it was not possible to finish it (user is offline & revision not found locally)
    ) {
        banner = <UnableToPerformRevisionCheck />;
        priority = 91;
    } else if (device?.features?.unfinished_backup) {
        banner = <FailedBackup />;
        priority = 90;
    } else if (device?.features?.backup_availability === 'Required') {
        banner = <NoBackup />;
        priority = 70;
    } else if (device?.connected && device?.features?.safety_checks === 'PromptAlways') {
        // PromptAlways could only be set via trezorctl. Warn user unconditionally.
        banner = <SafetyChecksBanner />;
        priority = 50;
    } else if (
        !safetyChecksDismissed &&
        device?.connected &&
        device?.features?.safety_checks === 'PromptTemporarily'
    ) {
        // PromptTemporarily was probably set intentionally via Suite and will change back to Strict when Trezor reboots.
        // Let the user dismiss the warning.
        banner = <SafetyChecksBanner onDismiss={() => setSafetyChecksDismissed(true)} />;
        priority = 50;
    } else if (showUpdateBridge()) {
        banner = <UpdateBridge />;
        priority = 30;
    } else if (
        device?.connected &&
        device?.features &&
        device?.mode !== 'bootloader' &&
        ['outdated'].includes(device.firmware)
    ) {
        banner = <UpdateFirmware />;
        priority = 10;
    }

    // message system banners should always be visible in the app even if app body is blurred
    const useMessageSystemBanner = bannerMessage && bannerMessage.priority >= priority;

    return (
        <Container>
            {useMessageSystemBanner && <MessageSystemBanner message={bannerMessage} />}
            {isTranslationMode() && <TranslationMode />}
            <OnlineStatus isOnline={online} />
            {!useMessageSystemBanner && banner}
            {/* TODO: add Pin not set */}
        </Container>
    );
};
