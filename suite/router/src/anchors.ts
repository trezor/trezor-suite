import { type Route } from './route';

export type AnchorSettingSection =
    | 'general-settings'
    | 'device-settings'
    | 'coin-settings'
    | 'earn';

type Anchor = `@${AnchorSettingSection}/${string}`;

export const EarnAnchor = {
    Staking: '@earn/staking',
    Yield: '@earn/yield',
} satisfies { [key: string]: Anchor };

export const SettingsAnchor = {
    Language: '@general-settings/language',
    Fiat: '@general-settings/fiat',
    BitcoinAmountUnit: '@general-settings/btc-amount-unit',
    Labeling: '@general-settings/labeling',
    LabelingServers: '@general-settings/labeling-servers',
    LabelingDisconnect: '@general-settings/labeling-disconnect',
    LabelingConnect: '@general-settings/labeling-connect',
    LabelingMigration: '@general-settings/labeling-migration',
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
    AutoEject: '@general-settings/auto-eject',
    MevProtection: '@general-settings/mev-protection',
    NetworkReserve: '@general-settings/network-reserve',
    DustPhishing: '@general-settings/dust-phishing',
    DustPhishingThreshold: '@general-settings/dust-phishing-threshold',
    GapLimit: '@general-settings/gap-limit',

    BackupFailed: '@device-settings/backup-failed',
    BackupRecoverySeed: '@device-settings/backup-recovery-seed',
    CheckRecoverySeed: '@device-settings/check-recovery-seed',
    FirmwareVersion: '@device-settings/firmware-version',
    FirmwareType: '@device-settings/firmware-type',
    FirmwareLanguage: '@device-settings/firmware-language',
    PinProtection: '@device-settings/pin-protection',
    ThpAutoconnect: '@device-settings/thp-autoconnect',
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
} satisfies { [key: string]: Anchor };

export const mapAnchorToRoute: Record<AnchorSettingSection, Route['name']> = {
    'general-settings': 'settings-index',
    'device-settings': 'settings-device',
    'coin-settings': 'settings-coins',
    earn: 'suite-earn',
};

export const AccountTransactionBaseAnchor = '@account/transaction';

export type AnchorType = keyof typeof SettingsAnchor | string;
