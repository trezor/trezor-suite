import { FirmwareActions } from '@settings-actions/firmwareActions';
import { WalletSettingsActions } from '@settings-actions/walletSettingsActions';

export type SettingsActions = FirmwareActions | WalletSettingsActions;
