import { useSelector } from 'react-redux';

import {
    selectDeviceLabel,
    selectDeviceModel,
    selectDeviceName,
    selectIsDeviceInBootloader,
    selectIsDeviceInitialized,
} from '@suite-common/device';
import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import { TitledSection, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader, useNavigateToInitialScreen } from '@suite-native/navigation';

import { BackupAndPassphraseCard } from '../components/BackupAndPassphraseCard';
import { DeviceAuthenticityCard } from '../components/DeviceAuthenticityCard';
import { DeviceConnectionCard } from '../components/DeviceConnectionCard';
import { DeviceFirmwareCard } from '../components/DeviceFirmwareCard';
import { DeviceInfo } from '../components/DeviceInfo';
import { DevicePinProtectionCard } from '../components/DevicePinProtectionCard';
import { WipeDeviceCard } from '../components/WipeDeviceCard';
import { useDeviceChangedCheck } from '../hooks/useDeviceChangedCheck';

export const DeviceSettingsScreen = () => {
    useDeviceChangedCheck();

    const navigateToInitialScreen = useNavigateToInitialScreen();

    const deviceModel = useSelector(selectDeviceModel);
    const deviceName = useSelector(selectDeviceName);
    const deviceLabel = useSelector(selectDeviceLabel);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isDeviceInBootloader = useSelector(selectIsDeviceInBootloader);

    if (!deviceModel || !deviceName) {
        return null;
    }

    // In bootloader mode PIN protection and the authenticity check cannot run, so they are hidden
    // (mirroring desktop). Backup & passphrase stays available for its passphrase settings.
    const isPinProtectionVisible = isDeviceInitialized && !isDeviceInBootloader;
    const isBackupAndPassphraseVisible = isDeviceInitialized;
    const isAuthenticityCheckVisible =
        SUPPORTS_DEVICE_AUTHENTICITY_CHECK[deviceModel] && !isDeviceInBootloader;
    const isSecuritySectionVisible =
        isPinProtectionVisible || isBackupAndPassphraseVisible || isAuthenticityCheckVisible;

    return (
        <Screen
            header={<ScreenHeader closeActionType="close" closeAction={navigateToInitialScreen} />}
        >
            <VStack spacing="sp40">
                <DeviceInfo deviceName={deviceLabel || deviceName} deviceModel={deviceModel} />
                <TitledSection
                    title={<Translation id="moduleDeviceSettings.sectionTitles.general" />}
                >
                    <DeviceFirmwareCard />
                    <DeviceConnectionCard />
                </TitledSection>
                {isSecuritySectionVisible && (
                    <TitledSection
                        title={<Translation id="moduleDeviceSettings.sectionTitles.security" />}
                    >
                        {isPinProtectionVisible && <DevicePinProtectionCard />}
                        {isBackupAndPassphraseVisible && <BackupAndPassphraseCard />}
                        {isAuthenticityCheckVisible && <DeviceAuthenticityCard />}
                    </TitledSection>
                )}
                <TitledSection
                    title={<Translation id="moduleDeviceSettings.sectionTitles.dangerZone" />}
                >
                    <WipeDeviceCard />
                </TitledSection>
            </VStack>
        </Screen>
    );
};
