import { FirmwareActions } from '@settings-actions/firmwareActions';
import { WalletSettingsActions } from '@settings-actions/walletSettingsActions';
import { RecoveryActions } from '@settings-actions/recoveryActions';

export type SettingsActions = FirmwareActions | WalletSettingsActions | RecoveryActions;

export type WordCount = 12 | 18 | 24;
