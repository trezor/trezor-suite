import { WalletSettingsActions } from '@settings-actions/walletSettingsActions';
import { RecoveryActions } from '@settings-actions/recoveryActions';

export type SettingsActions = WalletSettingsActions | RecoveryActions;

export type WordCount = 12 | 18 | 24;
