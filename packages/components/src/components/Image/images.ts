export type SvgImage = keyof typeof SVG_IMAGES;

export const SVG_IMAGES = {
    UNI_ERROR: 'uni-error.svg',
    UNI_SUCCESS: 'uni-success.svg',
    UNI_WARNING: 'uni-warning.svg',
    T_BRIDGE_CHECK: 't-bridge-check.svg',
    T_DEVICE_CONFIRM: 't-device-confirm.svg',
    SPINNER: 'spinner.svg',
    ONE_DEVICE_CONFIRM: 'one-device-confirm.svg',
    DEVICE_ANOTHER_SESSION: 'device-another-session.svg',
    CONNECT_DEVICE: 'connect-device.svg',
    '404': '404.svg',
    EARLY_ACCESS: 'early-access.svg',
    EARLY_ACCESS_DISABLE: 'early-access-disable.svg',
    INVITY_LOGO: 'invity-logo.svg',
    COINMARKET_AVATAR: 'coinmarket-avatar.svg',
    COINMARKET_SUCCESS: 'coinmarket-success.svg',
    COINMARKET_WAITING: 'coinmarket-waiting.svg',
    WARNING: 'warning.svg',
    USER_FOCUS: 'user-focus.svg',
    ONBOARDING_WELCOME_BG: 'onboarding-welcome-bg.svg',
    HOURGLASS: 'hourglass.svg',
    WATCH: 'watch.svg',
} as const;

export type PngImage = keyof typeof PNG_IMAGES;

export const PNG_IMAGES = {
    CLOUDY: 'Cloudy.png',
    CLOUDY_2x: 'Cloudy@2x.png',
    BACKUP: 'Backup.png',
    BACKUP_2x: 'Backup@2x.png',
    CHECK_SHIELD: 'CheckShield.png',
    CHECK_SHIELD_2x: 'CheckShield@2x.png',
    CLOCK: 'Clock.png',
    CLOCK_2x: 'Clock@2x.png',
    COINS: 'Coins.png',
    COINS_2x: 'Coins@2x.png',
    ERROR: 'Error.png',
    ERROR_2x: 'Error@2x.png',
    EXTRA_INFO: 'ExtraInfo.png',
    EXTRA_INFO_2x: 'ExtraInfo@2x.png',
    FIRMWARE: 'Firmware.png',
    FIRMWARE_2x: 'Firmware@2x.png',
    FOLDER: 'Folder.png',
    FOLDER_2x: 'Folder@2x.png',
    KEY: 'Key.png',
    KEY_2x: 'Key@2x.png',
    PIN: 'Pin.png',
    PIN_2x: 'Pin@2x.png',
    PIN_LOCKED: 'PinLocked.png',
    PIN_LOCKED_2x: 'PinLocked@2x.png',
    RECOVERY: 'Recovery.png',
    RECOVERY_2x: 'Recovery@2x.png',
    UNDERSTAND: 'Understand.png',
    UNDERSTAND_2x: 'Understand@2x.png',
    WALLET: 'Wallet.png',
    WALLET_2x: 'Wallet@2x.png',
    TOR_ENABLING: 'TorEnabling.png',
    TOR_ENABLING_2x: 'TorEnabling@2x.png',
    COINJOIN_MESS: 'CoinjoinMess.png',
    DONT_DISCONNECT: 'DontDisconnect.png',
    DONT_DISCONNECT_2x: 'DontDisconnect@2x.png',
} as const;
