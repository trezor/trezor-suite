import { FirmwareActions } from '@settings-actions/firmwareActions';
import { DeviceSettingsActions } from '@settings-actions/deviceSettingsActions';
import { WalletSettingsActions } from '@settings-actions/walletSettingsActions';

export type SettingsActions = FirmwareActions | DeviceSettingsActions | WalletSettingsActions;
