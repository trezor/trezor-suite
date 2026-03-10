import { useEffect, useState } from 'react';

import styled from 'styled-components';

import {
    selectDeviceStaticSessionId,
    selectIsDeviceBackupRequired,
    selectIsDeviceBackupUnfinished,
    selectSelectedDevice,
} from '@suite-common/device';
import { selectIsFirmwareInstallationRunning } from '@suite-common/firmware';
import { selectBannerMessage } from '@suite-common/message-system';
import { selectHasDeviceSuiteSyncError } from '@suite-common/suite-sync';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { isCardanoStakedWithFiveBinaries } from '@suite-common/wallet-utils';
import { isWeb } from '@trezor/env-utils';
import { spacingsPx } from '@trezor/theme';

import { MAX_CONTENT_WIDTH } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';
import { useLocalNetworkAccessPermission } from 'src/hooks/suite/useLocalNetworkAccessPermission';
import {
    selectFirmwareHashCheckErrorIfEnabled,
    selectFirmwareRevisionCheckErrorIfEnabled,
} from 'src/selectors/suite/suiteAuthenticityChecksSelectors';
import { selectTransportOfType } from 'src/selectors/suite/suiteSelectors';

import { MessageSystemBanner } from '../MessageSystemBanner';
import { BridgeDeprecated } from './BridgeDeprecatedBanner';
import { CardanoOutdatedStakingBanner } from './CardanoOutdatedStakingBanner';
import { FailedBackup } from './FailedBackupBanner';
import { FirmwareAuthenticityCheckBanner } from './FirmwareAuthenticityCheckBanner';
import { LocalNetworkAccessPermission } from './LocalNetworkAccessPermission';
import { NoBackup } from './NoBackupBanner';
import { NoConnectionBanner } from './NoConnectionBanner';
import { SafetyChecksBanner } from './SafetyChecksBanner';
import { SuiteSyncBanner } from './SuiteSyncBanner';

const Container = styled.div<{ $fill?: boolean }>`
    width: 100%;
    max-width: ${({ $fill }) => ($fill ? 'none' : MAX_CONTENT_WIDTH)};
    padding: ${spacingsPx.sm} ${spacingsPx.md};
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
    position: relative; /* because it must be on the top of the draggable area on Mac */
`;

type SuiteBannersProps = {
    isOnboarding?: boolean;
    fill?: boolean;
};

export const SuiteBanners = ({ isOnboarding, fill }: SuiteBannersProps) => {
    const bridge = useSelector(selectTransportOfType('BridgeTransport'));
    const device = useSelector(selectSelectedDevice);
    const isOnline = useSelector(state => state.suite.online);
    const bannerMessage = useSelector(selectBannerMessage);
    const firmwareRevisionError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);
    const firmwareHashError = useSelector(selectFirmwareHashCheckErrorIfEnabled);
    const isDeviceBackupUnfinished = useSelector(selectIsDeviceBackupUnfinished);
    const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);
    const transport = useSelector(state => state.suite.transport);
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const { localNetworkAccessPermission } = useLocalNetworkAccessPermission();
    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);
    const hasSuiteSyncError = useSelector(state =>
        selectHasDeviceSuiteSyncError(state, deviceStaticSessionId),
    );
    const isFirmwareInstallationRunning = useSelector(selectIsFirmwareInstallationRunning);

    // The dismissal doesn't need to outlive the session. Use local state.
    const [safetyChecksDismissed, setSafetyChecksDismissed] = useState(false);
    useEffect(() => {
        setSafetyChecksDismissed(false);
    }, [device?.features?.safety_checks]);

    if (isOnboarding) {
        return bannerMessage ? (
            <Container $fill={fill}>
                <MessageSystemBanner message={bannerMessage} />
            </Container>
        ) : null;
    }

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
    } else if (
        isWeb() &&
        window.location.hostname !== 'localhost' && // localhost is not cross-origin so it is not needed there
        // transport error is unfortunately not very specific but we don't have anything better
        transport?.error === 'Network request failed' &&
        localNetworkAccessPermission === 'denied'
    ) {
        banner = <LocalNetworkAccessPermission />;
        priority = 40;
    } else if (bridge?.outdated) {
        banner = <BridgeDeprecated />;
        priority = 30;
    } else if (accounts.some(account => isCardanoStakedWithFiveBinaries(account))) {
        banner = <CardanoOutdatedStakingBanner />;
        priority = 20;
    } else if (deviceStaticSessionId && hasSuiteSyncError) {
        banner = <SuiteSyncBanner deviceStaticSessionId={deviceStaticSessionId} />;
        priority = 10;
    }

    // message system banners should always be visible in the app even if app body is blurred
    // Don't show message system banner when firmware installation is in progress to avoid confusion
    const isMessageSystemBannerVisible =
        bannerMessage && bannerMessage.priority >= priority && !isFirmwareInstallationRunning;

    const isBannerVisible =
        isMessageSystemBannerVisible ||
        !isOnline ||
        (!isMessageSystemBannerVisible && banner !== null);
    if (!isBannerVisible) return null;

    return (
        <Container $fill={fill}>
            {isMessageSystemBannerVisible && <MessageSystemBanner message={bannerMessage} />}
            {!isOnline && <NoConnectionBanner />}
            {!isMessageSystemBannerVisible && banner}
            {/* TODO: add Pin not set */}
        </Container>
    );
};
