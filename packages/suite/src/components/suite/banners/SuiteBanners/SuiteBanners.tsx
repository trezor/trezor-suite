import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { selectBannerMessage } from '@suite-common/message-system';
import {
    selectIsDeviceBackupRequired,
    selectIsDeviceBackupUnfinished,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { spacingsPx } from '@trezor/theme';

import { MAX_CONTENT_WIDTH } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';
import {
    selectFirmwareHashCheckErrorIfEnabled,
    selectFirmwareRevisionCheckErrorIfEnabled,
    selectTransportOfType,
} from 'src/reducers/suite/suiteReducer';
import { isTranslationMode } from 'src/utils/suite/l10n';

import { MessageSystemBanner } from '../MessageSystemBanner';
import { BridgeDeprecated } from './BridgeDeprecatedBanner';
import { FailedBackup } from './FailedBackupBanner';
import { FirmwareAuthenticityCheckBanner } from './FirmwareAuthenticityCheckBanner';
import { NoBackup } from './NoBackupBanner';
import { NoConnectionBanner } from './NoConnectionBanner';
import { SafetyChecksBanner } from './SafetyChecksBanner';
import { TranslationMode } from './TranslationModeBanner';

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
    const bannerMessage = useSelector(selectBannerMessage);
    const firmwareRevisionError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);
    const firmwareHashError = useSelector(selectFirmwareHashCheckErrorIfEnabled);
    const isDeviceBackupUnfinished = useSelector(selectIsDeviceBackupUnfinished);
    const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);

    // The dismissal doesn't need to outlive the session. Use local state.
    const [safetyChecksDismissed, setSafetyChecksDismissed] = useState(false);
    useEffect(() => {
        setSafetyChecksDismissed(false);
    }, [device?.features?.safety_checks]);

    let banner = null;
    let priority = 0;
    // firmware hash & revision check (performed when connecting a device), either of them may fail
    if (firmwareRevisionError || firmwareHashError) {
        banner = <FirmwareAuthenticityCheckBanner />;
        priority = 91;
    } else if (isDeviceBackupUnfinished) {
        banner = <FailedBackup />;
        priority = 90;
    } else if (isDeviceBackupRequired) {
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
    } else if (bridge?.outdated) {
        banner = <BridgeDeprecated />;
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
