export const enum SettingsAnchor {
    Language = '@general-settings/language',
    Fiat = '@general-settings/fiat',
    BitcoinAmountUnit = '@general-settings/btc-amount-unit',
    Labeling = '@general-settings/labeling',
    LabelingDisconnect = '@general-settings/labeling-disconnect',
    LabelingConnect = '@general-settings/labeling-connect',
    Tor = '@general-settings/tor',
    TorOnionLinks = '@general-settings/tor-onion-links',
    Theme = '@general-settings/theme',
    AddressDisplay = '@general-settings/address-display',
    Analytics = '@general-settings/analytics',
    ShowLog = '@general-settings/show-log',
    ClearStorage = '@general-settings/clear-storage',
    VersionWithUpdate = '@general-settings/version-with-update',
    EarlyAccess = '@general-settings/early-access',

    BackupFailed = '@device-settings/backup-failed',
    BackupRecoverySeed = '@device-settings/backup-recovery-seed',
    CheckRecoverySeed = '@device-settings/check-recovery-seed',
    FirmwareVersion = '@device-settings/firmware-version',
    FirmwareType = '@device-settings/firmware-type',
    PinProtection = '@device-settings/pin-protection',
    ChangePin = '@device-settings/change-pin',
    Passphrase = '@device-settings/passphrase',
    SafetyChecks = '@device-settings/safety-checks',
    DeviceLabel = '@device-settings/device-label',
    Homescreen = '@device-settings/homescreen',
    DisplayRotation = '@device-settings/display-rotation',
    Autolock = '@device-settings/autolock',
    WipeDevice = '@device-settings/wipe-device',
    CustomFirmware = '@device-settings/custom-firmware',

    Crypto = '@coin-settings/crypto',
    TestnetCrypto = '@coin-settings/testnet-crypto',

    TranslationMode = '@debug-settings/translation-mode',
    GithubIssue = '@debug-settings/github-issue',
    WipeData = '@debug-settings/wipe-data',
    InvityApi = '@debug-settings/invity-api',
    OAuthApi = '@debug-settings/oauth-api',
}

export const AccountTransactionBaseAnchor = '@account/transaction';

export const CoinjoinLogsAnchor = '@coinjoin/logs';

export type AnchorType = SettingsAnchor | string;
