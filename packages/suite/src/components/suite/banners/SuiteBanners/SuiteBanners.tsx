import { useState, useEffect } from 'react';

import { isDesktop } from '@trezor/env-utils';
import { selectBannerMessage } from '@suite-common/message-system';
import { selectDevice } from '@suite-common/wallet-core';

import { isTranslationMode } from 'src/utils/suite/l10n';
import { useSelector } from 'src/hooks/suite';

import { MessageSystemBanner } from '../MessageSystemBanner';
import { OnlineStatus } from './OnlineStatusBanner';
import { UpdateBridge } from './UpdateBridgeBanner';
import { UpdateFirmware } from './UpdateFirmwareBanner';
import { NoBackup } from './NoBackupBanner';
import { FailedBackup } from './FailedBackupBanner';
import { SafetyChecksBanner } from './SafetyChecksBanner';
import { TranslationMode } from './TranslationModeBanner';
import { FirmwareHashMismatch } from './FirmwareHashMismatchBanner';
import styled from 'styled-components';

const Container = styled.div`
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
`;

export const SuiteBanners = () => {
    const transport = useSelector(state => state.suite.transport);
    const device = useSelector(selectDevice);
    const online = useSelector(state => state.suite.online);
    const firmwareHashInvalid = useSelector(state => state.firmware.firmwareHashInvalid);
    const bannerMessage = useSelector(selectBannerMessage);

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

    let banner;
    let priority = 0;
    if (device?.id && firmwareHashInvalid.includes(device.id)) {
        banner = <FirmwareHashMismatch />;
        priority = 91;
    } else if (device?.features?.unfinished_backup) {
        banner = <FailedBackup />;
        priority = 90;
    } else if (device?.features?.needs_backup) {
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
