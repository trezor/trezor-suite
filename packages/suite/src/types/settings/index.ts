import { FirmwareActions } from '@settings-actions/firmwareActions';
import { DeviceSettingsActions } from '@settings-actions/deviceSettingsActions';

export type SettingsActions = FirmwareActions | DeviceSettingsActions;
