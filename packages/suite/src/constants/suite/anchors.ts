import { Route } from '@suite-common/suite-types';

export type AnchorSettingSection =
    | 'general-settings'
    | 'device-settings'
    | 'coin-settings'
    | 'debug-settings';

type Anchor = `@${AnchorSettingSection}/${string}`;

export const SettingsAnchor = {
    Language: '@general-settings/language',
    Fiat: '@general-settings/fiat',
    BitcoinAmountUnit: '@general-settings/btc-amount-unit',
    Labeling: '@general-settings/labeling',
    LabelingDisconnect: '@general-settings/labeling-disconnect',
    LabelingConnect: '@general-settings/labeling-connect',
    Tor: '@general-settings/tor',
    TorExternal: '@general-settings/tor-external',
    TorOnionLinks: '@general-settings/tor-onion-links',
    Theme: '@general-settings/theme',
    AddressDisplay: '@general-settings/address-display',
    Analytics: '@general-settings/analytics',
    ShowLog: '@general-settings/show-log',
    ClearStorage: '@general-settings/clear-storage',
    VersionWithUpdate: '@general-settings/version-with-update',
    EarlyAccess: '@general-settings/early-access',
    AutoStart: '@general-settings/auto-start',
    AutomaticUpdate: '@general-settings/automatic-update',

    BackupFailed: '@device-settings/backup-failed',
    BackupRecoverySeed: '@device-settings/backup-recovery-seed',
    DefaultWalletLoading: '@general-settings/default-wallet-loading',
    CheckRecoverySeed: '@device-settings/check-recovery-seed',
    FirmwareVersion: '@device-settings/firmware-version',
    FirmwareType: '@device-settings/firmware-type',
    FirmwareLanguage: '@device-settings/firmware-language',
    PinProtection: '@device-settings/pin-protection',
    ChangePin: '@device-settings/change-pin',
    WipeCode: '@device-settings/wipe-code',
    Passphrase: '@device-settings/passphrase',
    SafetyChecks: '@device-settings/safety-checks',
    DeviceLabel: '@device-settings/device-label',
    Homescreen: '@device-settings/homescreen',
    DisplayRotation: '@device-settings/display-rotation',
    Autolock: '@device-settings/autolock',
    WipeDevice: '@device-settings/wipe-device',
    CustomFirmware: '@device-settings/custom-firmware',

    Crypto: '@coin-settings/crypto',
    TestnetCrypto: '@coin-settings/testnet-crypto',
    UnsupportedCrypto: '@coin-settings/unsupported-crypto',

    TranslationMode: '@debug-settings/translation-mode',
    GithubIssue: '@debug-settings/github-issue',
    WipeData: '@debug-settings/wipe-data',
    InvityApi: '@debug-settings/invity-api',
    OAuthApi: '@debug-settings/oauth-api',
} satisfies { [key: string]: Anchor };

export type SettingsAnchorValue = (typeof SettingsAnchor)[keyof typeof SettingsAnchor];

export const mapAnchorToRoute: Record<AnchorSettingSection, Route['name']> = {
    'general-settings': 'settings-index',
    'device-settings': 'settings-device',
    'coin-settings': 'settings-coins',
    'debug-settings': 'settings-debug',
};

export const AccountTransactionBaseAnchor = '@account/transaction';

export const CoinjoinLogsAnchor = '@coinjoin/logs';

export type AnchorType = keyof typeof SettingsAnchor | string;
