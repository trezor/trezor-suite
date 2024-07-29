export type SvgImage = keyof typeof SVG_IMAGES;

export const SVG_IMAGES = {
    UNI_ERROR: 'uni-error.svg',
    UNI_SUCCESS: 'uni-success.svg',
    UNI_WARNING: 'uni-warning.svg',
    BRIDGE_CHECK_TREZOR_T2T1: 'bridge-check-trezor-t2t1.svg',
    DEVICE_CONFIRM_TREZOR_T1B1: 'device-confirm-trezor-t1b1.svg',
    DEVICE_CONFIRM_TREZOR_T2T1: 'device-confirm-trezor-t2t1.svg',
    DEVICE_CONFIRM_TREZOR_T2B1: 'device-confirm-trezor-t3b1.svg',
    DEVICE_CONFIRM_TREZOR_T3B1: 'device-confirm-trezor-t3b1.svg',
    DEVICE_CONFIRM_TREZOR_T3T1: 'device-confirm-trezor-t3t1.svg',
    SPINNER: 'spinner.svg',
    SPINNER_GREY: 'spinner-grey.svg',
    SPINNER_LIGHT_GREY: 'spinner-light-grey.svg',
    SPINNER_ORANGE: 'spinner-orange.svg',
    SPINNER_PRIMARY_DEFAULT: 'spinner-primary-default.svg',
    DEVICE_ANOTHER_SESSION: 'device-another-session.svg',
    CONNECT_DEVICE: 'connect-device.svg',
    ERROR_404: 'error-404.svg',
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
    TREZOR_PATTERN: 'trezor-pattern.svg',
    HOLLOW_APP_LOGO: 'hollow-app-logo.svg',
    APP_STORE_BADGE: 'app-store-badge.svg',
    APP_STORE_TITLE: 'app-store-title.svg',
    PLAY_STORE_BADGE: 'play-store-badge.svg',
    PLAY_STORE_TITLE: 'play-store-title.svg',
    STROKE_BORDER: 'stroke-border.svg',
    TREZOR_SAFE_PROMO_UNDERLINE: 'trezor-safe-promo-underline.svg',
    CONFIRM_EVM_EXPLANATION_ETH: 'confirm-evm-explanation-eth.svg',
    CONFIRM_EVM_EXPLANATION_OTHER: 'confirm-evm-explanation-other.svg',
} as const;

export type PngImage = keyof typeof PNG_IMAGES;

export const PNG_IMAGES = {
    CLOUDY: 'cloudy.png',
    CLOUDY_2x: 'cloudy@2x.png',
    CREATE_SHAMIR_GROUP: 'create-shamir-group.png',
    CREATE_SHAMIR_GROUP_2x: 'create-shamir-group@2x.png',
    BACKUP: 'backup.png',
    BACKUP_2x: 'backup@2x.png',
    CHECK_SHIELD: 'check-shield.png',
    CHECK_SHIELD_2x: 'check-shield@2x.png',
    CLOCK: 'clock.png',
    CLOCK_2x: 'clock@2x.png',
    COINS: 'coins.png',
    COINS_2x: 'coins@2x.png',
    COINMARKET_DCA_INVITY_APP_QR: 'coinmarket-dca-invity-app-qr.png',
    COINMARKET_DCA_INVITY_APP_QR_2x: 'coinmarket-dca-invity-app-qr@2x.png',
    COINMARKET_INVITY_ICON: 'coinmarket-invity-icon.png',
    COINMARKET_INVITY_ICON_2x: 'coinmarket-invity-icon@2x.png',
    ERROR: 'error.png',
    ERROR_2x: 'error@2x.png',
    EXTRA_INFO: 'extra-info.png',
    EXTRA_INFO_2x: 'extra-info@2x.png',
    FIRMWARE: 'firmware.png',
    FIRMWARE_2x: 'firmware@2x.png',
    FOLDER: 'folder.png',
    FOLDER_2x: 'folder@2x.png',
    KEY: 'key.png',
    KEY_2x: 'key@2x.png',
    PIN: 'pin.png',
    PIN_2x: 'pin@2x.png',
    PIN_LOCKED: 'pin-locked.png',
    PIN_LOCKED_2x: 'pin-locked@2x.png',
    RECOVERY: 'recovery.png',
    RECOVERY_2x: 'recovery@2x.png',
    SHAMIR_SHARES: 'shamir-shares.png',
    SHAMIR_SHARES_2x: 'shamir-shares@2x.png',
    UNDERSTAND: 'understand.png',
    UNDERSTAND_2x: 'understand@2x.png',
    WALLET: 'wallet.png',
    WALLET_2x: 'wallet@2x.png',
    DONT_DISCONNECT_TREZOR_T2T1: 'dont-disconnect-trezor-t2t1.png',
    DONT_DISCONNECT_TREZOR_T2T1_2x: 'dont-disconnect-trezor-t2t1@2x.png',
    DONT_DISCONNECT_TREZOR_T1B1: 'dont-disconnect-trezor-t1b1.png',
    DONT_DISCONNECT_TREZOR_T1B1_2x: 'dont-disconnect-trezor-t1b1@2x.png',
    DONT_DISCONNECT_TREZOR_T2B1: 'dont-disconnect-trezor-t3b1.png',
    DONT_DISCONNECT_TREZOR_T2B1_2x: 'dont-disconnect-trezor-t3b1@2x.png',
    DONT_DISCONNECT_TREZOR_T3B1: 'dont-disconnect-trezor-t3b1.png',
    DONT_DISCONNECT_TREZOR_T3B1_2x: 'dont-disconnect-trezor-t3b1@2x.png',
    DONT_DISCONNECT_TREZOR_T3T1: 'dont-disconnect-trezor-t3t1.png',
    DONT_DISCONNECT_TREZOR_T3T1_2x: 'dont-disconnect-trezor-t3t1@2x.png',
    TREZOR_T1B1: 'trezor-t1b1.png',
    TREZOR_T1B1_2x: 'trezor-t1b1@2x.png',
    TREZOR_T2T1: 'trezor-t2t1.png',
    TREZOR_T2T1_2x: 'trezor-t2t1@2x.png',
    TREZOR_T2B1: 'trezor-t3b1.png',
    TREZOR_T2B1_2x: 'trezor-t3b1@2x.png',
    TREZOR_T3B1: 'trezor-t3b1.png',
    TREZOR_T3B1_2x: 'trezor-t3b1@2x.png',
    TREZOR_T3T1: 'trezor-t3t1.png',
    TREZOR_T3T1_2x: 'trezor-t3t1@2x.png',
    TREZOR_T1B1_LARGE: 'trezor-t1b1-large.png',
    TREZOR_T1B1_LARGE_2x: 'trezor-t1b1-large@2x.png',
    TREZOR_T2T1_LARGE: 'trezor-t2t1-large.png',
    TREZOR_T2T1_LARGE_2x: 'trezor-t2t1-large@2x.png',
    TREZOR_T2B1_LARGE: 'trezor-t3b1-large.png',
    TREZOR_T2B1_LARGE_2x: 'trezor-t3b1-large@2x.png',
    TREZOR_T3B1_LARGE: 'trezor-t3b1-large.png',
    TREZOR_T3B1_LARGE_2x: 'trezor-t3b1-large@2x.png',
    TREZOR_T3T1_LARGE: 'trezor-t3t1-large.png',
    TREZOR_T3T1_LARGE_2x: 'trezor-t3t1-large@2x.png',
    TREZOR_T1B1_GHOST: 'trezor-t1b1-ghost.png',
    TREZOR_T1B1_GHOST_2x: 'trezor-t1b1-ghost@2x.png',
    TREZOR_T2T1_GHOST: 'trezor-t2t1-ghost.png',
    TREZOR_T2T1_GHOST_2x: 'trezor-t2t1-ghost@2x.png',
    TREZOR_T2B1_GHOST: 'trezor-t3b1-ghost.png',
    TREZOR_T2B1_GHOST_2x: 'trezor-t3b1-ghost@2x.png',
    TREZOR_T3B1_GHOST: 'trezor-t3b1-ghost.png',
    TREZOR_T3B1_GHOST_2x: 'trezor-t3b1-ghost@2x.png',
    TREZOR_T3T1_GHOST: 'trezor-t3t1-ghost.png',
    TREZOR_T3T1_GHOST_2x: 'trezor-t3t1-ghost@2x.png',
    TREZOR_SAFE_PROMO_PRODUCTS: 'trezor-safe-promo-products.png',
    TREZOR_SAFE_PROMO_PRODUCTS_2x: 'trezor-safe-promo-products@2x.png',
} as const;
