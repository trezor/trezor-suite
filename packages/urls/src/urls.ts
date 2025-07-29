import { Url } from './types';

export const TREZOR_URL: Url = 'https://trezor.io';
export const TREZOR_FORUM_URL: Url = 'https://forum.trezor.io/';
export const TREZOR_START_URL: Url = 'https://trezor.io/start';
export const TREZOR_SUPPORT_URL: Url = 'https://trezor.io/support';
export const TREZOR_RESELLERS_URL: Url = 'https://trezor.io/resellers/';
export const TREZOR_COINS_URL: Url = 'https://trezor.io/coins';

export const SUITE_WEB_URL = 'https://suite.trezor.io/web/';
export const DATA_URL: Url = 'https://data.trezor.io/';
export const DATA_TOS_URL: Url = 'https://data.trezor.io/legal/wallet-terms.pdf';
export const DATA_TOS_INVITY_URL: Url = 'https://data.trezor.io/legal/invity-terms-of-use.pdf';

export const DOCS_ANALYTICS_URL: Url = 'https://docs.trezor.io/trezor-suite/analytics/';

export const SUITE_URL: Url = 'https://trezor.io/trezor-suite';
export const SUITE_BACKUP_URL: Url = 'https://suite.trezor.io/web/backup/';
export const SUITE_FIRMWARE_URL: Url = 'https://suite.trezor.io/web/firmware/';
export const SUITE_UDEV_URL: Url = 'https://suite.trezor.io/web/udev/';
export const SUITE_WEB_DEVICE_SETTINGS_URL = (SUITE_WEB_URL + 'settings/device/') as Url;

export const SUITE_MOBILE_APP_STORE: Url = 'https://apps.apple.com/app/id1631884497';
export const SUITE_MOBILE_PLAY_STORE: Url =
    'https://play.google.com/store/apps/details?id=io.trezor.suite';

export const TREZOR_SUPPORT_DEVICE_URL: Url =
    'https://trezor.io/support/troubleshooting/device-issues/trezor-suite-doesn-t-see-my-device';
export const TREZOR_SUPPORT_RECOVERY_ISSUES_URL: Url =
    'https://trezor.io/support/troubleshooting/trezor-suite-issues/trezor-recovery-issues';
export const TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_URL: Url =
    'https://trezor.io/support/troubleshooting/device-issues/trezor-safe-device-authentication-check-failed';
export const TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_MOBILE_URL: Url =
    'https://trezor.io/support/troubleshooting/device-issues/trezor-safe-device-authentication-check-failed'; // FIXME: mobile specific
export const TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL: Url =
    'https://trezor.io/support/troubleshooting/device-issues/trezor-fw-authenticity-check-failed';
export const TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-lite/trezor-fw-authenticity-check-failed-on-mobile';
export const TREZOR_SUPPORT_FW_ALREADY_INSTALLED: Url =
    'https://trezor.io/support/troubleshooting/device-issues/firmware-is-already-installed';
export const TREZOR_SUPPORT_IS_MY_DEVICE_SAFE: Url =
    'https://trezor.io/support/troubleshooting/device-issues/is-my-device-safe-to-use';
export const TREZOR_SUPPORT_DIFFERENT_PACKAGING: Url =
    'https://trezor.io/support/logistics/order-shipping-faq/why-is-my-box-different-from-what-is-shown-on-the-website';
export const TREZOR_SUPPORT_RESET_PIN: Url =
    'https://trezor.io/support/troubleshooting/device-issues/how-to-reset-your-pin';

export const HELP_CENTER_PIN_URL: Url =
    'https://trezor.io/guides/trezor-devices/pin-protection-on-trezor-devices#trezor-model-one';
export const HELP_CENTER_DRY_RUN_T1B1_URL: Url =
    'https://trezor.io/guides/backups-recovery/general-standards/check-wallet-backup-on-model-one';
export const HELP_CENTER_DRY_RUN_T2T1_URL: Url =
    'https://trezor.io/guides/backups-recovery/general-standards/check-wallet-backup-on-model-t';
export const HELP_CENTER_DRY_RUN_T3B1_URL: Url =
    'https://trezor.io/guides/backups-recovery/general-standards/check-backup-on-trezor-safe-3';
export const HELP_CENTER_DRY_RUN_T3T1_URL: Url =
    'https://trezor.io/guides/backups-recovery/general-standards/check-backup-on-trezor-safe-5';
export const HELP_CENTER_DRY_RUN_T3W1_URL: Url =
    'https://trezor.io/learn/a/check-backup-on-trezor-safe-7';
export const HELP_CENTER_PASSPHRASE_URL: Url =
    'https://trezor.io/guides/backups-recovery/advanced-wallets/passphrases-and-hidden-wallets';
export const HELP_CENTER_RECOVERY_SEED_URL: Url =
    'https://trezor.io/guides/backups-recovery/general-standards/how-to-use-a-wallet-backup';
export const HELP_CENTER_PACKAGING_T1B1_URL: Url =
    'https://trezor.io/guides/trezor-devices/trezor-model-one/authenticate-model-one';
export const HELP_CENTER_PACKAGING_T2T1_URL: Url =
    'https://trezor.io/guides/trezor-devices/trezor-model-t/authenticate-model-t';
export const HELP_CENTER_PACKAGING_T3B1_URL: Url =
    'https://trezor.io/guides/trezor-devices/trezor-safe-3/authenticate-trezor-safe-3';
export const HELP_CENTER_PACKAGING_T3T1_URL: Url =
    'https://trezor.io/guides/trezor-devices/trezor-safe-5/authenticate-trezor-safe-5';
export const HELP_CENTER_PACKAGING_T3W1_URL: Url =
    'https://trezor.io/learn/a/authenticate-trezor-safe-7';
export const HELP_CENTER_XRP_URL: Url =
    'https://trezor.io/learn/supported-assets/xrp-xlm/xrp-on-trezor-devices';
export const HELP_CENTER_XLM_URL: Url =
    'https://trezor.io/learn/supported-assets/xrp-xlm/xlm-on-trezor-devices';
export const HELP_CENTER_CASHADDR_URL: Url = 'https://trezor.io/learn/basics/glossary#CashAddr';
export const HELP_CENTER_QR_CODE_URL: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/qr-codes-in-trezor-suite';
export const HELP_CENTER_ADDRESSES_URL: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/addresses-transaction-history';
export const HELP_CENTER_COINJOIN_URL: Url =
    'https://trezor.io/learn/advanced/Blockchain-architecture-technologies/what-is-coinjoin';
export const HELP_CENTER_TAPROOT_URL: Url =
    'https://trezor.io/learn/advanced/standards-proposals/what-is-taproot';
export const HELP_CENTER_UDEV_URL: Url = 'https://trezor.io/guides/trezorctl/udev-rules';
export const HELP_CENTER_TOR_URL: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/tor-in-trezor-suite';
export const HELP_CENTER_FW_DOWNGRADE_T1B1_URL: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/downgrade-firmware-model-one';
export const HELP_CENTER_FW_DOWNGRADE_T2T1_URL: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/downgrade-firmware-model-t';
export const HELP_CENTER_FW_DOWNGRADE_T3B1_URL: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/downgrade-firmware-trezor-safe-3';
export const HELP_CENTER_FW_DOWNGRADE_T3T1_URL: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/downgrade-firmware-trezor-safe-5';
export const HELP_CENTER_FW_DOWNGRADE_T3W1_URL: Url =
    'https://trezor.io/learn/a/downgrade-firmware-trezor-safe-7';
export const HELP_CENTER_RECOVERY_ISSUES_URL: Url =
    'https://trezor.io/support/troubleshooting/trezor-suite-issues/trezor-recovery-issues';
export const HELP_CENTER_ADVANCED_RECOVERY_URL: Url =
    'https://trezor.io/guides/backups-recovery/general-standards/advanced-recovery-on-model-one';
export const HELP_CENTER_XPUB_URL: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-lite/public-keys-xpub-in-trezor-suite-lite';
export const HELP_CENTER_BIP32_URL: Url =
    'https://trezor.io/learn/advanced/standards-proposals/what-is-bip32';
export const HELP_CENTER_WIPE_CODE_URL: Url =
    'https://trezor.io/learn/security-privacy/create-wipe-code-to-erase-device';
export const HELP_FIRMWARE_TYPE =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/bitcoin-only-firmware-on-trezor';
export const HELP_CENTER_ZERO_VALUE_ATTACKS: Url =
    'https://trezor.io/support/troubleshooting/coins-tokens/address-poisoning-attacks';
export const HELP_CENTER_LABELING: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/labels-in-trezor-suite';
export const HELP_CENTER_DEVICE_AUTHENTICATION: Url =
    'https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/trezor-safe-device-authentication-check';
export const HELP_CENTER_DEVICE_AUTHENTICATION_MOBILE: Url =
    'https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/trezor-safe-device-authentication-check'; // FIXME: mobile specific
export const HELP_CENTER_ETH_STAKING: Url =
    'https://trezor.io/guides/sending-receiving-staking-funds/staking-assets-in-trezor-suite/staking-ethereum-eth-in-trezor-suite';
export const HELP_CENTER_SOL_STAKING: Url =
    'https://trezor.io/learn/supported-assets/solana/solana-sol-on-trezor';
export const HELP_CENTER_SEED_CARD_URL: Url =
    'https://trezor.io/learn/security-privacy/personal-security-standards/wallet-backup-card';
export const HELP_CENTER_MULTI_SHARE_BACKUP_URL: Url =
    'https://trezor.io/guides/backups-recovery/advanced-wallets/multi-share-backup-on-trezor';
export const HELP_CENTER_UPGRADING_TO_MULTI_SHARE_URL: Url =
    'https://trezor.io/guides/backups-recovery/advanced-wallets/upgrading-to-multi-share-backup';
export const HELP_CENTER_KEEPING_SEED_SAFE_URL: Url =
    'https://trezor.io/learn/basics/keeping-your-wallet-backup-safe';
export const HELP_CENTER_TRANSACTION_FEES_URL: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/transaction-fees-in-trezor-suite';
export const HELP_CENTER_EVM_ADDRESS_CHECKSUM: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/experimental-features-in-trezor-suite';
export const HELP_CENTER_EVM_SEND_TO_CONTRACT_URL =
    'https://trezor.io/support/troubleshooting/coins-tokens/where-is-my-ethereum';
export const HELP_CENTER_FIRMWARE_REVISION_CHECK: Url =
    'https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/trezor-firmware-revision-check';
export const HELP_CENTER_FIRMWARE_REVISION_CHECK_MOBILE: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-lite/trezor-firmware-authenticity-check-on-mobile';
export const HELP_CENTER_ENTROPY_CHECK_URL: Url =
    'https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/entropy-check';

export const HELP_CENTER_REPLACE_BY_FEE_ETHEREUM: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/replace-by-fee-rbf-ethereum';
export const HELP_CENTER_REPLACE_BY_FEE_BITCOIN =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/replace-by-fee-rbf-bitcoin';
export const HELP_CENTER_CANCEL_TRANSACTION: Url =
    'https://trezor.io/support/troubleshooting/trezor-suite-issues/can-i-cancel-or-reverse-a-transaction';
// TODO: update this link when the article is ready
export const HELP_CENTER_SOL_SEND: Url =
    'https://trezor.io/learn/supported-assets/solana/solana-sol-on-trezor';
// TODO: update this link when the article is ready
export const HELP_CENTER_SOLANA_HELP_URL: Url =
    'https://trezor.io/support/troubleshooting/coins-tokens/where-is-my-solana';

export const INVITY_URL: Url = 'https://invity.io/invest-crypto/';
export const INVITY_SCHEDULE_OF_FEES: Url = 'https://blog.invity.io/schedule-of-fees/';
export const HOMESCREEN_EDITOR_URL: Url = 'https://trezor.github.io/homescreen-editor/';
export const LTC_ADDRESS_INFO_URL: Url =
    'https://blog.trezor.io/litecoins-new-p2sh-segwit-addresses-843633e3e707';

export const CARDANO_STAKE_POOL_MAINNET_URL: Url =
    'https://trezor-cardano-mainnet.blockfrost.io/api/v0/pools/';
export const CARDANO_STAKE_POOL_PREVIEW_URL: Url =
    'https://trezor-cardano-preview.blockfrost.io/api/v0/pools/';
export const CARDANO_MAINNET_DREP: Url =
    'https://trezor-cardano-mainnet.blockfrost.io/api/v0/dreps/';
export const CARDANO_PREVIEW_DREP: Url =
    'https://trezor-cardano-preview.blockfrost.io/api/v0/dreps/';

export const CHROME_URL: Url = 'https://www.google.com/chrome/';
export const CHROME_UPDATE_URL: Url = 'https://support.google.com/chrome/answer/95414';
export const CHROME_ANDROID_URL: Url =
    'https://play.google.com/store/apps/details?id=com.android.chrome';
export const EXPERIMENTAL_FEATURES_KB_URL: Url =
    'https://trezor.io/learn/a/experimental-features-in-trezor-suite';
export const EXPERIMENTAL_PASSWORD_MANAGER_KB_URL: Url =
    'https://trezor.io/guides/bonus-tools/retrieve-dropbox-passwords-from-password-manager';
export const CROWDIN_URL: Url = 'https://crowdin.com/project/trezor-suite';

export const TREZOR_SAFE_5_URL: Url = 'https://trezor.io/trezor-safe-5';
export const ESHOP_KEEP_METAL_SINGLE_SHARE_URL: Url =
    'https://trezor.io/trezor-keep-metal-single-share';

export const ESHOP_KEEP_METAL_MULTI_SHARE_URL: Url =
    'https://trezor.io/trezor-keep-metal-multi-share';

export const TRADING_DOWNLOAD_INVITY_APP_URL: Url = 'https://invity.onelink.me/yIY4/q7ltbnv0';

export const UNINSTALL_BRIDGE_URL: Url =
    'https://trezor.io/guides/trezor-suite/trezor-suite-desktop/deprecation-and-removal-of-standalone-trezor-bridge';

export const GEOLOCATION_API_URL = 'https://services.trezor.io/get-country/';
export const IMAGE_PROXY_API_URL = 'https://services.trezor.io/image-proxy/';
