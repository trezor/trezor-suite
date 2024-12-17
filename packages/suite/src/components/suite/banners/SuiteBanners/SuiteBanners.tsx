import { useState, useEffect } from 'react';

import styled from 'styled-components';

import { selectBannerMessage } from '@suite-common/message-system';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { isDesktop } from '@trezor/env-utils';
import { spacingsPx } from '@trezor/theme';

import { isTranslationMode } from 'src/utils/suite/l10n';
import { useSelector } from 'src/hooks/suite';
import { MAX_CONTENT_WIDTH } from 'src/constants/suite/layout';
import {
    selectFirmwareHashCheckErrorIfEnabled,
    selectFirmwareRevisionCheckErrorIfEnabled,
    selectTransportOfType,
} from 'src/reducers/suite/suiteReducer';

import { MessageSystemBanner } from '../MessageSystemBanner';
import { NoConnectionBanner } from './NoConnectionBanner';
import { UpdateBridge } from './UpdateBridgeBanner';
import { NoBackup } from './NoBackupBanner';
import { FailedBackup } from './FailedBackupBanner';
import { SafetyChecksBanner } from './SafetyChecksBanner';
import { TranslationMode } from './TranslationModeBanner';
import { FirmwareHashMismatchOnLastUpdateBanner } from './FirmwareHashMismatchOnLastUpdateBanner';
import { FirmwareAuthenticityCheckBanner } from './FirmwareAuthenticityCheckBanner';

const Container = styled.div<{ $isVisible?: boolean }>`
    width: 100%;
    max-width: ${MAX_CONTENT_WIDTH};
    padding: ${spacingsPx.sm} ${spacingsPx.md};
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
    position: relative; /* because it must be on the top of the draggable area on Mac */
`;

export const SuiteBanners = () => {
    const bridge = useSelector(selectTransportOfType('BridgeTransport'));
    const device = useSelector(selectSelectedDevice);
    const isOnline = useSelector(state => state.suite.online);
    const firmwareHashInvalid = useSelector(state => state.firmware.firmwareHashInvalid);
    const bannerMessage = useSelector(selectBannerMessage);
    const firmwareRevisionError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);
    const firmwareHashError = useSelector(selectFirmwareHashCheckErrorIfEnabled);

    // The dismissal doesn't need to outlive the session. Use local state.
    const [safetyChecksDismissed, setSafetyChecksDismissed] = useState(false);
    useEffect(() => {
        setSafetyChecksDismissed(false);
    }, [device?.features?.safety_checks]);

    const showUpdateBridge = () => {
        if (
            isDesktop() &&
            bridge?.version &&
            ['2.0.27', '2.0.28', '2.0.29'].includes(bridge.version)
        ) {
            return false;
        }

        return bridge?.outdated;
    };

    let banner = null;
    let priority = 0;
    // this handles firmware hash being invalid after a firmware update, not the regular firmware hash check
    if (device?.id && firmwareHashInvalid.includes(device.id)) {
        banner = <FirmwareHashMismatchOnLastUpdateBanner />;
        priority = 92;
    }
    // the regular firmware hash check, and revision id check, either of them may fail
    else if (firmwareRevisionError || firmwareHashError) {
        banner = <FirmwareAuthenticityCheckBanner />;
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
