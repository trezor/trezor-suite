import { WalletBackupType } from '@suite-native/device';
import { TxKeyPath } from '@suite-native/intl';

type TranslationKeys =
    | 'submitButton'
    | 'timeDescription'
    | 'formatDescription'
    | 'storageDescription'
    | 'title'
    | 'description'
    | 'calloutLabel';

export const walletBackupSheetCopyByType = {
    'shamir-single': {
        submitButton: `moduleDeviceOnboarding.walletBackupSheet.options.shamir-single.submitButton`,
        timeDescription: `moduleDeviceOnboarding.walletBackupSheet.options.shamir-single.time`,
        formatDescription: `moduleDeviceOnboarding.walletBackupSheet.options.shamir-single.format`,
        storageDescription: `moduleDeviceOnboarding.walletBackupSheet.options.shamir-single.storage`,
        title: `moduleDeviceOnboarding.walletBackupSheet.options.shamir-single.title`,
        description: `moduleDeviceOnboarding.walletBackupSheet.options.shamir-single.description`,
        calloutLabel: `moduleDeviceOnboarding.walletBackupSheet.options.shamir-single.callout`,
    },
    'shamir-advanced': {
        submitButton: `moduleDeviceOnboarding.walletBackupSheet.options.shamir-advanced.submitButton`,
        timeDescription: `moduleDeviceOnboarding.walletBackupSheet.options.shamir-advanced.time`,
        formatDescription: `moduleDeviceOnboarding.walletBackupSheet.options.shamir-advanced.format`,
        storageDescription: `moduleDeviceOnboarding.walletBackupSheet.options.shamir-advanced.storage`,
        title: `moduleDeviceOnboarding.walletBackupSheet.options.shamir-advanced.title`,
        description: `moduleDeviceOnboarding.walletBackupSheet.options.shamir-advanced.description`,
        calloutLabel: `moduleDeviceOnboarding.walletBackupSheet.options.shamir-advanced.callout`,
    },
    '12-words': {
        submitButton: `moduleDeviceOnboarding.walletBackupSheet.options.12-words.submitButton`,
        timeDescription: undefined,
        formatDescription: `moduleDeviceOnboarding.walletBackupSheet.options.12-words.format`,
        storageDescription: `moduleDeviceOnboarding.walletBackupSheet.options.12-words.storage`,
        title: `moduleDeviceOnboarding.walletBackupSheet.options.12-words.title`,
        description: `moduleDeviceOnboarding.walletBackupSheet.options.12-words.description`,
        calloutLabel: `moduleDeviceOnboarding.walletBackupSheet.options.12-words.callout`,
    },
    '24-words': {
        submitButton: `moduleDeviceOnboarding.walletBackupSheet.options.24-words.submitButton`,
        timeDescription: undefined,
        formatDescription: `moduleDeviceOnboarding.walletBackupSheet.options.24-words.format`,
        storageDescription: `moduleDeviceOnboarding.walletBackupSheet.options.24-words.storage`,
        title: `moduleDeviceOnboarding.walletBackupSheet.options.24-words.title`,
        description: `moduleDeviceOnboarding.walletBackupSheet.options.24-words.description`,
        calloutLabel: `moduleDeviceOnboarding.walletBackupSheet.options.24-words.callout`,
    },
} satisfies Record<WalletBackupType, Record<TranslationKeys, TxKeyPath | undefined>>;
