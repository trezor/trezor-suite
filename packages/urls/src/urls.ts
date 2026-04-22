import { type Url } from './types';
import { withPlatformUtm } from './utms';

// =====================
// 🧩 TREZOR SUITE - CORE
// =====================

export const SUITE_WEB_URL = 'https://suite.trezor.io/web/';
export const SUITE_URL: Url = 'https://trezor.io/trezor-suite';
export const SUITE_FIRMWARE_URL: Url = 'https://suite.trezor.io/web/firmware/';
export const SUITE_UDEV_URL: Url = 'https://suite.trezor.io/web/udev/';
export const SUITE_WEB_DEVICE_SETTINGS_URL = (SUITE_WEB_URL + 'settings/device/') as Url;

export const TREZOR_URL: Url = 'https://trezor.io';
export const TREZOR_FORUM_URL: Url = 'https://forum.trezor.io/';
export const TREZOR_START_URL: Url = 'https://trezor.io/start';
export const TREZOR_RESELLERS_URL: Url = 'https://trezor.io/resellers/';
export const TREZOR_COINS_URL: Url = 'https://trezor.io/coins';

// =====================
// 📜 LEGAL
// =====================

export const DATA_URL: Url = 'https://data.trezor.io/';
export const DATA_TOS_URL: Url = 'https://data.trezor.io/legal/wallet-terms.pdf';

export const DATA_TOS_MOBILE_URL: Url = 'https://data.trezor.io/legal/mobile-wallet-terms.pdf';

export const DATA_PRIVACY_URL: Url = 'https://data.trezor.io/legal/privacy-policy.html';

export const DOCS_ANALYTICS_URL: Url = withPlatformUtm(
    'https://docs.trezor.io/trezor-suite/analytics/',
);

export const TREZOR_SUITE_TOS_URL: Url = 'https://trezor.io/documents/suite_terms_of_use.pdf';
export const TREZOR_TRADING_LEARN_MORE_URL: Url = 'https://trezor.io/trade-features';

// =====================
// 🆘 SUPPORT
// =====================

export const HOW_TO_CHOOSE_RIGHT_NETWORK_URL = withPlatformUtm(
    'https://trezor.io/guides/sending-receiving-staking-funds/moving-funds-from-exchanges/how-to-choose-the-right-network-when-withdrawing-from-or-sending-to-trezor',
);

export const RECOVERY_ISSUES_LINK = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/trezor-suite-issues/trezor-recovery-issues#lost-wallet-backup',
);

export const PIN_HELP_URL = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/device-issues/how-to-enter-pin-on-model-one',
);

export const TREZOR_SUPPORT_URL: Url = withPlatformUtm('https://trezor.io/support');

export const TREZOR_SUPPORT_BLUETOOTH_TROUBLESHOOTING: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/device-issues/bluetooth-troubleshooting',
);
export const TREZOR_SUPPORT_DEVICE_URL: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/device-issues/trezor-suite-doesn-t-see-my-device',
);
export const TREZOR_SUPPORT_RECOVERY_ISSUES_URL: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/trezor-suite-issues/trezor-recovery-issues',
);
export const TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_URL: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/device-issues/trezor-safe-device-authentication-check-failed',
);
export const TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_MOBILE_URL: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/device-issues/trezor-safe-device-authentication-check-failed',
); // FIXME: mobile specific
export const TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/device-issues/trezor-fw-authenticity-check-failed',
);
export const TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL: Url = withPlatformUtm(
    'https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/trezor-firmware-authenticity-check-failed',
);
export const TREZOR_SUPPORT_FW_ALREADY_INSTALLED: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/device-issues/firmware-is-already-installed',
);
export const TREZOR_SUPPORT_IS_MY_DEVICE_SAFE: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/device-issues/is-my-device-safe-to-use',
);
export const TREZOR_SUPPORT_DIFFERENT_PACKAGING: Url = withPlatformUtm(
    'https://trezor.io/support/logistics/order-shipping-faq/why-is-my-box-different-from-what-is-shown-on-the-website',
);
export const TREZOR_SUPPORT_RESET_PIN: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/device-issues/how-to-reset-your-pin',
);

export const TREZOR_SUPPORT_MULTIPLE_ACCOUNTS: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-suite/multiple-accounts-in-trezor-suite',
);

export const TREZOR_SUPPORT_TRADING_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/sending-receiving-staking-funds/trading-crypto-in-trezor-suite',
);

export const TREZOR_SUPPORT_UNDERSTANDING_FEES: Url = withPlatformUtm(
    'https://trezor.io/guides/sending-receiving-staking-funds/trading-crypto-in-trezor-suite/trade-crypto-in-trezor-suite#understanding-trading-fees',
);

// =====================
// 📚 HELP CENTER
// =====================

export const HELP_CENTER_OTHER_CRYPTOCURRENCIES_DESTINATION_TAGS_URL: Url = withPlatformUtm(
    'https://trezor.io/learn/supported-assets/xrp-xlm/destination-tags',
);

export const EXPERIMENTAL_PASSWORD_MANAGER_KB_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/bonus-tools/retrieve-dropbox-passwords-from-password-manager',
);

export const HELP_CENTER_WHAT_IS_TREZOR_SUITE_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-suite/getting-to-know-trezor-suite',
);

export const HELP_CENTER_VERIFY_TREZOR_SUITE_ADDRESSES_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/sending-receiving-staking-funds/sending-receiving/receive-crypto-in-trezor-suite',
);

export const HELP_CENTER_PIN_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-devices/trezor-fundamentals/pin-protection-on-trezor-devices#trezor-model-one',
);
export const HELP_CENTER_DRY_RUN_T1B1_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/backups-recovery/general-standards/check-wallet-backup-on-model-one',
);
export const HELP_CENTER_DRY_RUN_T2T1_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/backups-recovery/general-standards/check-wallet-backup-on-model-t',
);
export const HELP_CENTER_DRY_RUN_T3B1_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/backups-recovery/general-standards/check-backup-on-trezor-safe-3',
);
export const HELP_CENTER_DRY_RUN_T3T1_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/backups-recovery/general-standards/check-backup-on-trezor-safe-5',
);
export const HELP_CENTER_DRY_RUN_T3W1_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/backups-recovery/general-standards/check-backup-on-trezor-safe-7',
);
export const HELP_CENTER_PASSPHRASE_URL: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/trezor-suite-issues/passphrase-hidden-wallets-issues',
);
export const HELP_CENTER_RECOVERY_SEED_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/backups-recovery/general-standards/how-to-use-a-wallet-backup',
);
export const HELP_CENTER_PACKAGING_T1B1_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-devices/trezor-model-one/authenticate-model-one',
);
export const HELP_CENTER_PACKAGING_T2T1_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-devices/trezor-model-t/authenticate-model-t',
);
export const HELP_CENTER_PACKAGING_T3B1_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-devices/trezor-safe-3/authenticate-trezor-safe-3',
);
export const HELP_CENTER_PACKAGING_T3T1_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-devices/trezor-safe-5/authenticate-trezor-safe-5',
);

export const HELP_CENTER_PACKAGING_T3W1_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-devices/trezor-safe-7/authenticate-trezor-safe-7',
);
export const HELP_CENTER_XRP_URL: Url = withPlatformUtm(
    'https://trezor.io/learn/supported-assets/xrp-xlm/xrp-on-trezor-devices',
);
export const HELP_CENTER_XLM_URL: Url = withPlatformUtm(
    'https://trezor.io/learn/supported-assets/xrp-xlm/xlm-on-trezor-devices',
);
export const HELP_CENTER_CASHADDR_URL: Url = withPlatformUtm(
    'https://trezor.io/learn/basics/glossary#CashAddr',
);
export const HELP_CENTER_QR_CODE_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-suite/qr-codes-in-trezor-suite',
);
export const HELP_CENTER_ADDRESSES_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-suite/addresses-transaction-history',
);
export const HELP_CENTER_TAPROOT_URL: Url = withPlatformUtm(
    'https://trezor.io/learn/advanced/standards-proposals/what-is-taproot',
);
export const HELP_CENTER_UDEV_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/trezorctl/udev-rules',
);
export const HELP_CENTER_TOR_URL: Url = withPlatformUtm(
    'https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/tor-in-trezor-suite',
);
export const HELP_CENTER_FW_DOWNGRADE_T1B1_URL: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/device-issues/install-custom-firmware-on-trezor-model-one',
);
export const HELP_CENTER_FW_DOWNGRADE_T2T1_URL: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/device-issues/install-custom-firmware-on-trezor-model-t',
);
export const HELP_CENTER_FW_DOWNGRADE_T3B1_URL: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/device-issues/install-custom-firmware-on-trezor-safe-3',
);
export const HELP_CENTER_FW_DOWNGRADE_T3T1_URL: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/device-issues/install-custom-firmware-on-trezor-safe-5',
);
export const HELP_CENTER_FW_DOWNGRADE_T3W1_URL: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/device-issues/install-custom-firmware-on-trezor-safe-7',
);
export const HELP_CENTER_RECOVERY_ISSUES_URL: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/trezor-suite-issues/trezor-recovery-issues',
);
export const HELP_CENTER_ADVANCED_RECOVERY_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/backups-recovery/general-standards/advanced-recovery-on-model-one',
);
export const HELP_CENTER_XPUB_URL: Url = withPlatformUtm(
    'https://trezor.io/learn/supported-assets/bitcoin/what-is-a-public-key-xpub',
);
export const HELP_CENTER_BIP329_URL: Url = withPlatformUtm(
    'https://trezor.io/learn/advanced/standards-proposals/what-is-bip-329',
);
export const HELP_CENTER_BIP32_URL: Url = withPlatformUtm(
    'https://trezor.io/learn/advanced/standards-proposals/what-is-bip32',
);
export const HELP_CENTER_WIPE_CODE_URL: Url = withPlatformUtm(
    'https://trezor.io/learn/security-privacy/personal-security-standards/create-wipe-code-to-erase-device',
);
export const HELP_FIRMWARE_TYPE = withPlatformUtm(
    'https://trezor.io/learn/supported-assets/bitcoin/bitcoin-only-firmware-on-trezor',
);
export const HELP_CENTER_ZERO_VALUE_ATTACKS: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/coins-tokens/address-poisoning-attacks',
);
export const HELP_CENTER_LABELING: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-suite/labels-in-trezor-suite',
);
export const HELP_CENTER_DEVICE_AUTHENTICATION: Url = withPlatformUtm(
    'https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/trezor-safe-device-authentication-check',
);
export const HELP_CENTER_DEVICE_AUTHENTICATION_MOBILE: Url = withPlatformUtm(
    'https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/trezor-safe-device-authentication-check',
); // FIXME: mobile specific
export const HELP_CENTER_ETH_STAKING: Url = withPlatformUtm(
    'https://trezor.io/guides/sending-receiving-staking-funds/staking-assets-in-trezor-suite/staking-ethereum-eth-in-trezor-suite',
);
export const HELP_CENTER_SOL_STAKING: Url = withPlatformUtm(
    'https://trezor.io/guides/sending-receiving-staking-funds/staking-assets-in-trezor-suite/staking-solana-in-trezor-suite',
);
export const HELP_CENTER_ADA_STAKING: Url = withPlatformUtm(
    'https://trezor.io/guides/sending-receiving-staking-funds/staking-assets-in-trezor-suite/staking-cardano-ada-in-trezor-suite',
);
export const HELP_CENTER_SEED_CARD_URL: Url = withPlatformUtm(
    'https://trezor.io/learn/security-privacy/personal-security-standards/wallet-backup-card',
);
export const HELP_CENTER_MULTI_SHARE_BACKUP_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/backups-recovery/advanced-wallets/multi-share-backup-on-trezor',
);
export const HELP_CENTER_UPGRADING_TO_MULTI_SHARE_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/backups-recovery/advanced-wallets/upgrading-to-multi-share-backup',
);
export const HELP_CENTER_KEEPING_SEED_SAFE_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/backups-recovery/general-standards/keeping-your-wallet-backup-safe',
);
export const HELP_CENTER_TRANSACTION_FEES_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-suite/transaction-fees-in-trezor-suite',
);
export const HELP_CENTER_EVM_ADDRESS_CHECKSUM: Url = withPlatformUtm(
    'https://trezor.io/learn/advanced/blockchain-architecture-technologies/evm-address-checksum-in-trezor-suite',
);
export const HELP_CENTER_EVM_SEND_TO_CONTRACT_URL = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/coins-tokens/where-is-my-ethereum',
);
export const HELP_CENTER_FIRMWARE_REVISION_CHECK: Url = withPlatformUtm(
    'https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/trezor-firmware-revision-check',
);
export const HELP_CENTER_FIRMWARE_REVISION_CHECK_MOBILE: Url = withPlatformUtm(
    'https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/trezor-firmware-authenticity-check',
);
export const HELP_CENTER_ENTROPY_CHECK_URL: Url = withPlatformUtm(
    'https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/entropy-check-how-trezor-verifies-your-wallet-is-truly-random',
);

export const HELP_CENTER_REPLACE_BY_FEE_ETHEREUM: Url = withPlatformUtm(
    'https://trezor.io/learn/supported-assets/ethereum-layer-2-EVM/replace-by-fee-rbf-ethereum',
);
export const HELP_CENTER_REPLACE_BY_FEE_BITCOIN = withPlatformUtm(
    'https://trezor.io/learn/supported-assets/bitcoin/speed-up-a-stuck-bitcoin-transaction-with-replace-by-fee-rbf',
);
export const HELP_CENTER_CANCEL_TRANSACTION: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/trezor-suite-issues/can-i-cancel-or-reverse-a-transaction',
);
// TODO: update this link when the article is ready
export const HELP_CENTER_SOL_SEND: Url = withPlatformUtm(
    'https://trezor.io/learn/supported-assets/solana/solana',
);

export const HELP_CENTER_SOLANA_HELP_URL: Url = withPlatformUtm(
    'https://trezor.io/support/troubleshooting/coins-tokens/where-is-my-solana',
);

export const UNINSTALL_BRIDGE_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-suite/deprecation-and-removal-of-standalone-trezor-bridge',
);

export const EXPERIMENTAL_FEATURES_KB_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-suite/experimental-features-in-trezor-suite',
);

export const NETWORK_RESERVE_URL: Url = withPlatformUtm(
    'https://trezor.io/learn/supported-assets/ethereum-layer-2-EVM/network-reserve-for-base-optimism-and-solana',
);

export const HELP_CENTER_T3W1_INTRODUCTION_URL: Url = withPlatformUtm(
    'https://trezor.io/guides/trezor-devices/trezor-safe-7/introduction-to-the-trezor-safe-7',
);

// =====================
// 🛠️ SERVICES
// =====================

export const GEOLOCATION_API_URL = 'https://services.trezor.io/get-country/';
export const IMAGE_PROXY_API_URL = 'https://services.trezor.io/image-proxy/';

export const CROWDIN_URL: Url = 'https://crowdin.com/project/trezor-suite';

export const HOMESCREEN_EDITOR_URL: Url = 'https://trezor.github.io/homescreen-editor/';

// =====================
// 💸 INVITY
// =====================
export const LTC_ADDRESS_INFO_URL: Url = withPlatformUtm(
    'https://blog.trezor.io/litecoins-new-p2sh-segwit-addresses-843633e3e707',
);

export const TRADING_DOWNLOAD_INVITY_APP_URL: Url = 'https://invity.onelink.me/yIY4/q7ltbnv0';

// =====================
// 📣 PROMO
// =====================

export const TREZOR_SAFE_5_URL: Url = withPlatformUtm('https://trezor.io/trezor-safe-5');
export const ESHOP_KEEP_METAL_SINGLE_SHARE_URL: Url = withPlatformUtm(
    'https://trezor.io/trezor-keep-metal-single-share',
);

export const SUITE_REFERRAL: Url = withPlatformUtm('https://trezor.io/refer-a-friend');

export const DASHBOARD_BANNER_TEX_URL: Url =
    'https://trezor.io/trezor-expert-consultation?utm_source=trezor_suite&utm_medium=suite_desktop_banner&utm_campaign=expert_consultation';

export const DASHBOARD_BANNER_TS7_URL: Url =
    'https://trezor.io/trezor-safe-7?utm_source=trezor_suite&utm_medium=suite_desktop_banner&utm_campaign=ts7_introduction';

export const ESHOP_KEEP_METAL_MULTI_SHARE_URL: Url = withPlatformUtm(
    'https://trezor.io/trezor-keep-metal-multi-share',
);

export const ESHOP_WHAT_IS_A_HARDWARE_WALLET_URL: Url = withPlatformUtm(
    'https://trezor.io/what-is-a-hardware-wallet',
);

export const ESHOP_WHY_TREZOR_IS_SECURE_URL: Url = withPlatformUtm(
    'https://trezor.io/why-trezor-is-secure',
);

// =====================
// 📱 SOCIAL MEDIA
// =====================

export const TREZOR_X_URL: Url = 'https://x.com/trezor';

export const TREZOR_INSTAGRAM_URL: Url = 'https://www.instagram.com/trezor.io/';

export const TREZOR_TIKTOK_URL: Url = 'https://www.tiktok.com/@trezor.io_official';

// =====================
// 🏪 STORES
// =====================

export const SUITE_MOBILE_APP_STORE: Url = 'https://apps.apple.com/app/id1631884497';
export const SUITE_MOBILE_PLAY_STORE: Url =
    'https://play.google.com/store/apps/details?id=io.trezor.suite';
