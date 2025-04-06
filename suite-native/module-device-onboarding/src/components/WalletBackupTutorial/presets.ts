import { TxKeyPath } from '@suite-native/intl';

import { WalletBackupType } from '../../screens/WalletBackupTutorialScreen';

type TranslationKeys = 'title' | 'description' | 'calloutLabel';
export const walletBackupTutorialCopyByType = {
    'shamir-single': {
        title: `moduleDeviceOnboarding.walletBackupTutorialScreen.step5.backupOptions.shamir-single.title`,
        description: `moduleDeviceOnboarding.walletBackupTutorialScreen.step5.backupOptions.shamir-single.description`,
        calloutLabel: `moduleDeviceOnboarding.walletBackupTutorialScreen.step5.backupOptions.shamir-single.callout`,
    },
    'shamir-advanced': {
        title: `moduleDeviceOnboarding.walletBackupTutorialScreen.step5.backupOptions.shamir-advanced.title`,
        description: `moduleDeviceOnboarding.walletBackupTutorialScreen.step5.backupOptions.shamir-advanced.description`,
        calloutLabel: `moduleDeviceOnboarding.walletBackupTutorialScreen.step5.backupOptions.shamir-advanced.callout`,
    },
    '12-words': {
        title: `moduleDeviceOnboarding.walletBackupTutorialScreen.step5.backupOptions.12-words.title`,
        description: `moduleDeviceOnboarding.walletBackupTutorialScreen.step5.backupOptions.12-words.description`,
        calloutLabel: undefined,
    },
    '24-words': {
        title: `moduleDeviceOnboarding.walletBackupTutorialScreen.step5.backupOptions.24-words.title`,
        description: `moduleDeviceOnboarding.walletBackupTutorialScreen.step5.backupOptions.24-words.description`,
        calloutLabel: undefined,
    },
} satisfies Record<WalletBackupType, Record<TranslationKeys, TxKeyPath | undefined>>;
