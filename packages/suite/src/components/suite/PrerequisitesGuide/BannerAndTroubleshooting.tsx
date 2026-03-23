import { Box } from '@trezor/components';

import { DeviceAcquire } from './DeviceAcquire';
import { DeviceBootloader } from './DeviceBootloader';
import { DeviceConnect } from './DeviceConnect';
import { DeviceDisconnectRequired } from './DeviceDisconnectRequired';
import { DeviceFirmwareCorrupted } from './DeviceFirmwareCorrupted';
import { DeviceInitialize } from './DeviceInitialize';
import { DeviceNoFirmware } from './DeviceNoFirmware';
import { DeviceRecoveryMode } from './DeviceRecoveryMode';
import { DeviceSeedless } from './DeviceSeedless';
import { DeviceTrezorHostProtocolPair } from './DeviceTrezorHostProtocolPair';
import { DeviceUnknown } from './DeviceUnknown';
import { DeviceUnreadable } from './DeviceUnreadable';
import { DeviceUpdateRequired } from './DeviceUpdateRequired';
import { DeviceUsedElsewhere } from './DeviceUsedElsewhere';
import { MultiShareBackupInProgress } from './MultiShareBackupInProgress';
import { NoTransport } from './NoTransport';
import { type PrerequisiteType } from '../../../utils/suite/prerequisites';

type BannerAndTroubleshootingProps = {
    prerequisite: PrerequisiteType | null;
};

const getComponent = (prerequisite: PrerequisiteType | null) => {
    switch (prerequisite) {
        case 'no-transport':
            return <NoTransport />;
        case 'device-disconnect-required':
            return <DeviceDisconnectRequired />;
        case 'device-disconnected':
            return <DeviceConnect />;
        case 'device-unacquired':
            return <DeviceAcquire />;
        case 'device-thp-locked':
            return <DeviceTrezorHostProtocolPair />;
        case 'device-used-elsewhere':
            return <DeviceUsedElsewhere />;
        case 'device-unreadable':
            return <DeviceUnreadable />;
        case 'device-unknown':
            return <DeviceUnknown />;
        case 'device-seedless':
            return <DeviceSeedless />;
        case 'device-recovery-mode':
            return <DeviceRecoveryMode />;
        case 'device-initialize':
            return <DeviceInitialize />;
        case 'device-bootloader':
            return <DeviceBootloader />;
        case 'firmware-missing':
            return <DeviceNoFirmware />;
        case 'firmware-corrupted':
            return <DeviceFirmwareCorrupted />;
        case 'firmware-required':
            return <DeviceUpdateRequired />;
        case 'multi-share-backup-in-progress':
            return <MultiShareBackupInProgress />;
        default:
            return <></>;
    }
};

export const BannerAndTroubleshooting = ({ prerequisite }: BannerAndTroubleshootingProps) => {
    const tipComponent = getComponent(prerequisite);

    return <Box margin={{ top: 24 }}>{tipComponent}</Box>;
};
