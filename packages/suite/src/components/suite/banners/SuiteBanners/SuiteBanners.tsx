import { useState, useEffect } from 'react';
import styled from 'styled-components';

import { selectBannerMessage } from '@suite-common/message-system';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { selectDevice } from '@suite-common/wallet-core';
import { isDesktop } from '@trezor/env-utils';
import { spacingsPx } from '@trezor/theme';

import { isTranslationMode } from 'src/utils/suite/l10n';
import { useSelector } from 'src/hooks/suite';
import { MAX_CONTENT_WIDTH } from 'src/constants/suite/layout';
import { MessageSystemBanner } from '../MessageSystemBanner';
import { NoConnectionBanner } from './NoConnectionBanner';
import { UpdateBridge } from './UpdateBridgeBanner';
import { UpdateFirmware } from './UpdateFirmwareBanner';
import { NoBackup } from './NoBackupBanner';
import { FailedBackup } from './FailedBackupBanner';
import { SafetyChecksBanner } from './SafetyChecksBanner';
import { TranslationMode } from './TranslationModeBanner';
import { FirmwareHashMismatch } from './FirmwareHashMismatchBanner';
import { FirmwareRevisionCheckBanner } from './FirmwareRevisionCheckBanner';

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
    const isOnline = useSelector(state => state.suite.online);
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
        isDeviceAcquired(device) &&
        device.authenticityChecks !== undefined &&
        device.authenticityChecks.firmwareRevision !== null && // check was performed
        device.authenticityChecks.firmwareRevision.success === false
    ) {
        banner = <FirmwareRevisionCheckBanner />;
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
        isDeviceAcquired(device) &&
        device.mode !== 'bootloader' &&
        ['outdated'].includes(device.firmware)
    ) {
        banner = <UpdateFirmware />;
        priority = 10;
    }

    // message system banners should always be visible in the app even if app body is blurred
    const isMessageSystemBannerVisible = bannerMessage && bannerMessage.priority >= priority;

    const isBannerVisible =
        isMessageSystemBannerVisible ||
        isTranslationMode() ||
        !isOnline ||
        (!isMessageSystemBannerVisible && banner !== null);
    if (!isBannerVisible) return null;

    return (
        <Container>
            {isMessageSystemBannerVisible && <MessageSystemBanner message={bannerMessage} />}
            {isTranslationMode() && <TranslationMode />}
            {!isOnline && <NoConnectionBanner />}
            {!isMessageSystemBannerVisible && banner}
            {/* TODO: add Pin not set */}
        </Container>
    );
};
