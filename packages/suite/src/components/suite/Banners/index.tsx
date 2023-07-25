import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { isDesktop } from '@trezor/env-utils';
import { isTranslationMode } from 'src/utils/suite/l10n';
import { useSelector } from 'src/hooks/suite';
import { selectBannerMessage } from '@suite-common/message-system';
import OnlineStatus from './OnlineStatus';
import UpdateBridge from './UpdateBridge';
import UpdateFirmware from './UpdateFirmware';
import NoBackup from './NoBackup';
import FailedBackup from './FailedBackup';
import MessageSystemBanner from './MessageSystemBanner';
import SafetyChecksBanner from './SafetyChecks';
import TranslationMode from './TranslationMode';
import FirmwareHashMismatch from './FirmwareHashMismatch';

const Wrapper = styled.div`
    background: ${({ theme }) => theme.BG_WHITE};
`;

const Banners = () => {
    const transport = useSelector(state => state.suite.transport);
    const device = useSelector(state => state.suite.device);
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
        <Wrapper>
            {useMessageSystemBanner && <MessageSystemBanner message={bannerMessage} />}
            {isTranslationMode() && <TranslationMode />}
            <OnlineStatus isOnline={online} />
            {!useMessageSystemBanner && banner}
            {/* TODO: add Pin not set */}
        </Wrapper>
    );
};

export default Banners;
