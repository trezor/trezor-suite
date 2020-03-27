import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_XRP_CANNOT_SEND_TO_MYSELF: {
        defaultMessage: 'Cannot send to myself',
        id: 'CANNOT_SEND_TO_MYSELF',
    },
    TR_XRP_CANNOT_SEND_LESS_THAN_RESERVE: {
        defaultMessage: 'Not enough XRP above the required unspendable reserve ({reserve} XRP)',
        id: 'TR_XRP_CANNOT_SEND_LESS_THAN_RESERVE',
    },
    TR_3RD_PARTY_WALLETS: {
        defaultMessage: '3rd party wallets',
        id: 'TR_3RD_PARTY_WALLETS',
    },
    TR_3RD_PARTY_WALLETS_DESC: {
        defaultMessage:
            'These coins are supported by Trezor but only in 3rd party wallets. These coins cannot be managed by Trezor Suite or Wallet.',
        id: 'TR_3RD_PARTY_WALLETS_DESC',
    },
    TR_404_DESCRIPTION: {
        defaultMessage: 'Well… something is broken. Please proceed to Dashboard.',
        id: 'TR_404_DESCRIPTION',
    },
    TR_404_GO_TO_DASHBOARD: {
        defaultMessage: 'Go to Dashboard now!',
        id: 'TR_404_GO_TO_DASHBOARD',
    },
    TR_404_TITLE: {
        defaultMessage: 'Error 404',
        id: 'TR_404_TITLE',
    },
    TR_ACCESS_HIDDEN_WALLET: {
        defaultMessage: 'Access Hidden Wallet',
        id: 'TR_ACCESS_HIDDEN_WALLET',
    },
    TR_ACCESS_STANDARD_WALLET: {
        defaultMessage: 'Access standard Wallet',
        id: 'TR_ACCESS_STANDARD_WALLET',
    },
    TR_ACCOUNT_ENABLE_PASSPHRASE: {
        defaultMessage: 'Enable passphrase',
        id: 'TR_ACCOUNT_ENABLE_PASSPHRASE',
    },
    TR_ACCOUNT_EXCEPTION_AUTH_ERROR: {
        defaultMessage: 'Authorization error.',
        id: 'TR_ACCOUNT_EXCEPTION_AUTH_ERROR',
    },
    TR_ACCOUNT_EXCEPTION_AUTH_ERROR_DESC: {
        defaultMessage: 'You are not allowed to work with this device. Wrong PIN entered.',
        id: 'TR_ACCOUNT_EXCEPTION_AUTH_ERROR_DESC',
    },
    TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY: {
        defaultMessage: 'There are no coins enabled in settings.',
        id: 'TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY',
    },
    TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC: {
        defaultMessage:
            'It’s so empty here. Can’t even describe the emptiness I’m feelin’ here… You can either add new account (that will enable selected coin) or enable any coin in Settings.',
        id: 'TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC',
    },
    TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR: {
        defaultMessage: 'Discovery error.',
        id: 'TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR',
    },
    TR_ACCOUNT_EXCEPTION_NOT_ENABLED: {
        defaultMessage: '{networkName} not enabled in settings.',
        id: 'TR_ACCOUNT_EXCEPTION_NOT_ENABLED',
    },
    TR_ACCOUNT_EXCEPTION_NOT_EXIST: {
        defaultMessage: 'Account does not exist',
        id: 'TR_ACCOUNT_EXCEPTION_NOT_EXIST',
    },
    TR_ACCOUNT_HASH: {
        defaultMessage: 'Account #{number}',
        description: 'Used in auto-generated account label',
        id: 'TR_ACCOUNT_HASH',
    },
    TR_ACCOUNT_IMPORTED_ANNOUNCEMENT: {
        defaultMessage:
            'A watch-only account is a public address you’ve imported into your wallet, allowing the wallet to watch for outputs but not spend them.',
        id: 'TR_ACCOUNT_IMPORTED_ANNOUNCEMENT',
    },
    TR_ACCOUNT_IS_EMPTY: {
        defaultMessage: 'The account is empty',
        id: 'TR_ACCOUNT_IS_EMPTY',
    },
    TR_ACCOUNT_PASSPHRASE_DISABLED: {
        defaultMessage: 'Change passphrase settings to use this device',
        id: 'TR_ACCOUNT_PASSPHRASE_DISABLED',
    },
    TR_ACCOUNTS_MENU_TITLE: {
        defaultMessage: 'Accounts',
        id: 'TR_ACCOUNTS_MENU_TITLE',
    },
    TR_ACQUIRE_DEVICE: {
        defaultMessage: 'Acquire device',
        description:
            'call-to-action to use device in current window when it is used in other window',
        id: 'TR_ACQUIRE_DEVICE',
    },
    TR_ACQUIRE_DEVICE_DESCRIPTION: {
        defaultMessage:
            'Please close the tab in your browser or click the button below to acquire the device since Trezor can be only used in one session.',
        id: 'TR_ACQUIRE_DEVICE_DESCRIPTION',
    },
    TR_ACQUIRE_DEVICE_TITLE: {
        defaultMessage: 'Trezor is being used in a browser',
        id: 'TR_ACQUIRE_DEVICE_TITLE',
    },
    TR_ACTIVATE_ALL: {
        defaultMessage: 'Activate all',
        id: 'TR_ACTIVATE_ALL',
    },
    TR_ADD_ACCOUNT: {
        defaultMessage: 'Add account',
        id: 'TR_ADD_ACCOUNT',
    },
    TR_ADD_WALLET: {
        defaultMessage: 'Add wallet',
        id: 'TR_ADD_WALLET',
    },
    TR_ADDITIONAL_SECURITY_FEATURES: {
        defaultMessage: 'Additional security features are waiting to be done.',
        id: 'TR_ADDITIONAL_SECURITY_FEATURES',
    },
    // TR_ADD_RECIPIENT: {
    //         defaultMessage: 'Add recipient',
    //         id: 'TR_ADD_RECIPIENT',
    // },
    TR_ADDRESS: {
        defaultMessage: 'Address',
        description: 'Used as label for receive/send address input',
        id: 'TR_ADDRESS',
    },
    TR_ADDRESS_IS_NOT_SET: {
        defaultMessage: 'Address is not set',
        id: 'TR_ADDRESS_IS_NOT_SET',
    },
    TR_ADDRESS_IS_NOT_VALID: {
        defaultMessage: 'Address is not valid',
        id: 'TR_ADDRESS_IS_NOT_VALID',
    },
    TR_ADDRESS_MODAL_BTC_DESCRIPTION: {
        defaultMessage:
            'Try to always use a fresh address as a prerequisite to keep your transactions and accounts untrackable by anyone else than you.',
        id: 'TR_ADDRESS_MODAL_BTC_DESCRIPTION',
    },
    TR_ADDRESS_MODAL_CHECK_ON_TREZOR: {
        defaultMessage: 'Check on your Trezor now',
        id: 'TR_ADDRESS_MODAL_CHECK_ON_TREZOR',
    },
    TR_ADDRESS_MODAL_CHECK_ON_TREZOR_DESC: {
        defaultMessage:
            'For even more security you can check the receive address on your Trezor to make sure nobody hacked your Wallet.',
        id: 'TR_ADDRESS_MODAL_CHECK_ON_TREZOR_DESC',
    },
    TR_ADDRESS_MODAL_CLIPBOARD: {
        defaultMessage: 'Copy address',
        id: 'TR_ADDRESS_MODAL_CLIPBOARD',
    },
    TR_ADDRESS_MODAL_TITLE: {
        defaultMessage: '{networkName} receive address',
        id: 'TR_ADDRESS_MODAL_TITLE',
    },
    TR_XPUB_MODAL_CLIPBOARD: {
        defaultMessage: 'Copy public key',
        id: 'TR_XPUB_MODAL_CLIPBOARD',
    },
    TR_XPUB_MODAL_TITLE: {
        defaultMessage: '{networkName} Account {accountIndex} public key (XPUB)',
        id: 'TR_XPUB_MODAL_TITLE',
    },
    TR_ADVANCED_RECOVERY: {
        defaultMessage: 'advanced recovery',
        description: 'Enter words via obfuscated pin matrix, recovery takes about 5 minutes.',
        id: 'TR_ADVANCED_RECOVERY',
    },
    TR_ADVANCED_RECOVERY_OPTION: {
        defaultMessage: 'Advanced recovery',
        description: 'Button for selecting advanced recovery option',
        id: 'TR_ADVANCED_RECOVERY_OPTION',
    },

    TR_ADVANCED_SETTINGS: {
        defaultMessage: 'Advanced settings',
        description: 'Shows advanced sending form',
        id: 'TR_ADVANCED_SETTINGS',
    },
    TR_ALLOW_ANALYTICS: {
        defaultMessage: 'Allow anonymous data storing',
        id: 'TR_ALLOW_ANALYTICS',
    },
    TR_ALLOW_ANALYTICS_DESCRIPTION: {
        defaultMessage:
            'Trezor Suite does NOT track any balance-related or personal data, all anonymously',
        id: 'TR_ALLOW_ANALYTICS_DESCRIPTION',
    },
    TR_AMOUNT: {
        defaultMessage: 'Amount',
        id: 'TR_AMOUNT',
    },
    TR_AMOUNT_IS_NOT_ENOUGH: {
        defaultMessage: 'Not enough funds',
        id: 'TR_AMOUNT_IS_NOT_ENOUGH',
    },
    TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS: {
        defaultMessage: 'Maximum {decimals} decimals allowed',
        id: 'TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS',
    },
    TR_AMOUNT_IS_NOT_NUMBER: {
        defaultMessage: 'Amount is not a number',
        id: 'TR_AMOUNT_IS_NOT_NUMBER',
    },
    TR_AMOUNT_IS_NOT_SET: {
        defaultMessage: 'Amount is not set',
        id: 'TR_AMOUNT_IS_NOT_SET',
    },
    TR_ASSETS: {
        defaultMessage: 'Assets',
        id: 'TR_ASSETS',
    },
    TR_ATTENTION_COLON_THE_LOG_CONTAINS: {
        defaultMessage:
            'Attention: The log contains your XPUBs. Anyone with your XPUBs can see your account history.',
        id: 'TR_ATTENTION_COLON_THE_LOG_CONTAINS',
    },
    TR_AUTH_CONFIRM_FAILED_RETRY: {
        defaultMessage: 'Retry',
        id: 'TR_AUTH_CONFIRM_FAILED_RETRY',
    },
    TR_AUTH_CONFIRM_FAILED_TITLE: {
        defaultMessage: 'Passphrase mismatch!',
        id: 'TR_AUTH_CONFIRM_FAILED_TITLE',
    },
    TR_AUTHENTICATING_DEVICE: {
        defaultMessage: 'Authenticating device...',
        id: 'TR_AUTHENTICATING_DEVICE',
    },
    TR_BACK: {
        defaultMessage: 'Back',
        description: 'Back button',
        id: 'TR_BACK',
    },
    TR_BACKEND_CONNECT: {
        defaultMessage: 'Connect',
        id: 'TR_BACKEND_CONNECT',
    },
    TR_BACKEND_DISCONNECTED: {
        defaultMessage: 'Backend is disconnected',
        id: 'TR_BACKEND_DISCONNECTED',
    },
    TR_BACKGROUND_GALLERY: {
        defaultMessage: 'Homescreen background gallery',
        id: 'TR_BACKGROUND_GALLERY',
    },
    TR_BACKUP: {
        defaultMessage: 'Backup',
        id: 'TR_BACKUP',
    },
    TR_BACKUP_FAILED: {
        defaultMessage:
            'Backup failed and your Wallet is not backed up. You can still use it without any problems but highly recommend you following the link and see how to successfully create a backup.',
        id: 'TR_BACKUP_FAILED',
    },
    TR_BACKUP_FINISHED_BUTTON: {
        defaultMessage: 'My recovery card is safe',
        description: 'Exit button after backup is finished',
        id: 'TR_BACKUP_FINISHED_BUTTON',
    },
    TR_BACKUP_FINISHED_TEXT: {
        defaultMessage:
            'Backup is now on your recovery seed card. Once again dont lose it and keep it private!',
        description: 'Text that appears after backup is finished',
        id: 'TR_BACKUP_FINISHED_TEXT',
    },
    TR_BACKUP_RECOVERY_SEED: {
        defaultMessage: 'Backup (Recovery seed)',
        id: 'TR_BACKUP_RECOVERY_SEED',
    },
    TR_BACKUP_SUBHEADING_1: {
        defaultMessage:
            'Backup seed consisting of words is the ultimate key to your Wallet and all the important data. Trezor will generate the seed and you should write it down and store it securely.',
        description: 'Explanation what recovery seed is',
        id: 'TR_BACKUP_SUBHEADING_1',
    },
    TR_BASIC_RECOVERY: {
        defaultMessage: 'basic recovery',
        id: 'TR_BASIC_RECOVERY',
    },
    TR_BASIC_RECOVERY_OPTION: {
        defaultMessage: 'Enter words on your computer, recovery takes about 2 minutes.',
        description: 'Enter words on your computer, recovery takes about 2 minutes.',
        id: 'TR_BASIC_RECOVERY_OPTION',
    },
    TR_SELECT_CONCRETE_RECOVERY_TYPE: {
        id: 'TR_SELECT_CONCRETE_RECOVERY_TYPE',
        defaultMessage: 'Select {recoveryType}',
        description:
            '{recoveryType} stands for either TR_BASIC_RECOVERY or TR_ADVANCED_RECOVERY. Used as button description',
    },
    TR_BCH_ADDRESS_INFO: {
        defaultMessage:
            'Bitcoin Cash changed the format of addresses to cashaddr. Use external tool to convert legacy addresses to the new format. {TR_LEARN_MORE}',
        id: 'TR_BCH_ADDRESS_INFO',
    },
    TR_BEGIN: {
        defaultMessage: "Let's begin!",
        id: 'TR_BEGIN',
    },
    TR_BRIDGE_SUBHEADING: {
        defaultMessage:
            'Trezor Bridge is a communication tool to facilitate the connection between your Trezor and your internet browser.',
        description: 'Description what Trezor Bridge is',
        id: 'TR_BRIDGE_SUBHEADING',
    },
    TR_BUY: {
        defaultMessage: 'Buy',
        id: 'TR_BUY',
    },
    TR_CAMERA_NOT_RECOGNIZED: {
        defaultMessage: 'The camera was not recognized.',
        id: 'TR_CAMERA_NOT_RECOGNIZED',
    },
    TR_CAMERA_PERMISSION_DENIED: {
        defaultMessage: 'Permission to access the camera was denied.',
        id: 'TR_CAMERA_PERMISSION_DENIED',
    },
    TR_CANNOT_SEND_TO_MYSELF: {
        defaultMessage: 'Cannot send to myself',
        id: 'CANNOT_SEND_TO_MYSELF',
    },
    TR_CHANGELOG: {
        defaultMessage: 'Changelog',
        description: 'Part of the sentence: Learn more about latest version in {TR_CHANGELOG}.',
        id: 'TR_CHANGELOG',
    },
    TR_CHECK_FOR_DEVICES: {
        defaultMessage: 'Check for devices',
        id: 'TR_CHECK_FOR_DEVICES',
    },
    TR_CHECK_FOR_UPDATES: {
        defaultMessage: 'Check for updates',
        id: 'TR_CHECK_FOR_UPDATES',
    },
    TR_CHECK_PGP_SIGNATURE: {
        defaultMessage: 'Check PGP signature',
        id: 'TR_CHECK_PGP_SIGNATURE',
    },
    TR_CHECK_RECOVERY_SEED: {
        defaultMessage: 'Check recovery seed',
        id: 'TR_CHECK_RECOVERY_SEED',
    },
    TR_CHECK_SEED: {
        defaultMessage: 'Check seed',
        id: 'TR_CHECK_SEED',
    },
    TR_CHECK_YOUR_DEVICE: {
        defaultMessage: 'Check your device',
        description: 'Placeholder in seed input asking user to pay attention to his device',
        id: 'TR_CHECK_YOUR_DEVICE',
    },
    TR_CHOOSE_BETWEEN_NO_PASSPHRASE: {
        defaultMessage: 'Choose between no-passphrase or hidden wallet with passphrase.',
        id: 'TR_CHOOSE_BETWEEN_NO_PASSPHRASE',
    },
    TR_CLEAR: {
        defaultMessage: 'Clear',
        description: 'Clear form button',
        id: 'TR_CLEAR',
    },
    TR_CLOSE: {
        defaultMessage: 'Close',
        id: 'TR_CLOSE',
    },
    TR_COIN_DISCOVERY_IN_PROGRESS: {
        defaultMessage: 'Coin discovery in progress…',
        id: 'TR_COIN_DISCOVERY_IN_PROGRESS',
    },
    TR_COINS: {
        defaultMessage: 'Coins',
        id: 'TR_COINS',
    },
    TR_COINS_SETTINGS_ALSO_DEFINES: {
        defaultMessage:
            'Coins settings also defines the Discovery process when Trezor is connected. Each time you connect not remembered device, Trezor Suite needs to find out what accounts you have by going through each coin one by one. That can take between few seconds to few minutes if you allow all or too many coins.',
        id: 'TR_COINS_SETTINGS_ALSO_DEFINES',
    },
    TR_CONFIRM_ACTION_ON_YOUR: {
        defaultMessage: 'Confirm action on your "{deviceLabel}" device.',
        id: 'TR_CONFIRM_ACTION_ON_YOUR',
    },
    TR_CONFIRM_EMPTY_HIDDEN_WALLET: {
        defaultMessage: 'Confirm empty hidden wallet',
        id: 'TR_CONFIRM_EMPTY_HIDDEN_WALLET',
    },
    TR_CONFIRM_EMPTY_HIDDEN_WALLET_ON: {
        defaultMessage: 'Confirm empty hidden wallet passphrase on "{deviceLabel}" device.',
        id: 'TR_CONFIRM_EMPTY_HIDDEN_WALLET_ON',
    },
    TR_CONFIRM_PASSPHRASE: {
        defaultMessage: 'Confirm passphrase',
        id: 'TR_CONFIRM_PASSPHRASE',
    },
    TR_CONFIRM_PASSPHRASE_SOURCE: {
        defaultMessage: 'Confirm empty hidden wallet passphrase source on "{deviceLabel}" device.',
        id: 'TR_CONFIRM_PASSPHRASE_SOURCE',
    },
    TR_CONFIRM_PIN: {
        defaultMessage: 'Confirm PIN',
        id: 'TR_CONFIRM_PIN',
    },
    TR_CONFIRMED_TX: {
        defaultMessage: 'Confirmed',
        id: 'TR_CONFIRMED_TX',
    },
    TR_CONNECT_DROPBOX: {
        defaultMessage: 'Connect Dropbox',
        id: 'TR_CONNECT_DROPBOX',
    },
    TR_CONNECT_TREZOR: {
        defaultMessage: 'Connect Trezor to continue...',
        id: 'TR_CONNECT_TREZOR',
    },
    TR_CONNECT_YOUR_DEVICE: {
        defaultMessage: 'Connect your device',
        description: 'Prompt to user to connect his device.',
        id: 'TR_CONNECT_YOUR_DEVICE',
    },
    TR_CONNECT_YOUR_DEVICE_AGAIN: {
        defaultMessage: 'Connect your device again',
        description: 'Prompt to connect device.',
        id: 'TR_CONNECT_YOUR_DEVICE_AGAIN',
    },
    TR_CONNECT_YOUR_TREZOR_TO_CHECK: {
        defaultMessage: 'Connect your Trezor to verify this address',
        id: 'TR_CONNECT_YOUR_TREZOR_TO_CHECK',
    },
    TR_CONNECTED: {
        defaultMessage: 'Connected',
        description: 'Device status',
        id: 'TR_CONNECTED',
    },
    TR_CONNECTED_BOOTLOADER: {
        defaultMessage: 'Connected (bootloader mode)',
        description: 'Device status',
        id: 'TR_CONNECTED_BOOTLOADER',
    },
    TR_CONNECTED_DEVICE_IS_IN_BOOTLOADER: {
        defaultMessage: 'Connected device is in bootloader mode. Reconnect it to continue.',
        description: 'Text that indicates that user connected device in bootloader mode',
        id: 'TR_CONNECTED_DEVICE_IS_IN_BOOTLOADER',
    },
    TR_CONNECTED_NOT_INITIALIZED: {
        defaultMessage: 'Connected (not initialized)',
        description: 'Device status',
        id: 'TR_CONNECTED_NOT_INITIALIZED',
    },
    TR_CONNECTED_SEEDLESS: {
        defaultMessage: 'Connected (seedless mode)',
        description: 'Device status',
        id: 'TR_CONNECTED_SEEDLESS',
    },
    TR_CONNECTED_UPDATE_RECOMMENDED: {
        defaultMessage: 'Connected (update recommended)',
        description: 'Device status',
        id: 'TR_CONNECTED_UPDATE_RECOMMENDED',
    },
    TR_CONNECTED_UPDATE_REQUIRED: {
        defaultMessage: 'Connected (update required)',
        description: 'Device status',
        id: 'TR_CONNECTED_UPDATE_REQUIRED',
    },
    TR_CONNECTING_DOTDOTDOT: {
        defaultMessage: 'Connecting...',
        id: 'TR_CONNECTING_DOTDOTDOT',
    },
    TR_CONNECTION_STATUS: {
        defaultMessage: 'Connection Status',
        id: 'TR_CONNECTION_STATUS',
    },
    TR_CONTACT_OUR_SUPPORT_LINK: {
        defaultMessage: 'contact our support',
        description: 'Part of sentence TR_DID_YOU_PURCHASE. Link to support',
        id: 'TR_CONTACT_OUR_SUPPORT_LINK',
    },
    TR_CONTACT_SUPPORT: {
        defaultMessage: 'Contact support',
        description: 'Button to click to contact support',
        id: 'TR_CONTACT_SUPPORT',
    },
    TR_CONTINUE: {
        defaultMessage: 'Continue',
        description: 'Continue button',
        id: 'TR_CONTINUE',
    },
    TR_COPY_TO_CLIPBOARD: {
        defaultMessage: 'Copy to clipboard',
        id: 'TR_COPY_TO_CLIPBOARD',
    },
    TR_CREATE_BACKUP: {
        defaultMessage: 'Create backup',
        id: 'TR_CREATE_BACKUP',
    },
    TR_CREATE_BACKUP_IN_3_MINUTES: {
        defaultMessage: 'Create a backup in 3 minutes',
        id: 'TR_CREATE_BACKUP_IN_3_MINUTES',
    },
    TR_CURRENCY: {
        defaultMessage: 'Currency',
        id: 'TR_CURRENCY',
    },
    TR_CUSTOM_FEE: {
        defaultMessage: 'Custom',
        description: 'fee level',
        id: 'TR_CUSTOM_FEE',
    },
    TR_CUSTOM_FEE_IS_NOT_SET: {
        defaultMessage: 'Fee is not set',
        id: 'TR_CUSTOM_FEE_IS_NOT_SET',
    },
    TR_CUSTOM_FEE_IS_NOT_VALID: {
        defaultMessage: 'Fee is not valid',
        id: 'TR_CUSTOM_FEE_IS_NOT_VALID',
    },
    TR_CUSTOM_FEE_NOT_IN_RANGE: {
        defaultMessage: 'Allowed fee is between {minFee} and {maxFee}',
        id: 'TR_CUSTOM_FEE_NOT_IN_RANGE',
    },
    TR_DEACTIVATE_ALL: {
        defaultMessage: 'Deactivate all',
        id: 'TR_DEACTIVATE_ALL',
    },
    // TR_DATA: {
    //         defaultMessage: 'Data',
    //         id: 'TR_DATA',
    // },
    // TR_DATA_IS_USUALLY_USED: {
    //         defaultMessage: 'Data is usually used when you send transactions to contracts.',
    //         id: 'TR_DATA_IS_USUALLY_USED',
    // },
    TR_DESTINATION_TAG_IS_NOT_NUMBER: {
        defaultMessage: 'Destination tag is not a number',
        id: 'TR_DESTINATION_TAG_IS_NOT_NUMBER',
    },
    TR_DETECTING_BRIDGE: {
        defaultMessage: 'Detecting Trezor Bridge instalation',
        description: 'Message to show after user clicks download bridge.',
        id: 'TR_DETECTING_BRIDGE',
    },
    TR_DEVICE: {
        defaultMessage: 'Device',
        description: 'Category in Settings',
        id: 'TR_DEVICE',
    },
    TR_DEVICE_DISCONNECTED_DURING_ACTION: {
        defaultMessage: 'Device disconnected during action',
        description: 'Error message',
        id: 'TR_DEVICE_DISCONNECTED_DURING_ACTION',
    },
    TR_DEVICE_DISCONNECTED_DURING_ACTION_DESCRIPTION: {
        defaultMessage:
            'You device disconnected during action which resulted in interuption of backup process. For security reasons you need to wipe your device now and start the backup process again.',
        description: 'Error message. Instruction what to do.',
        id: 'TR_DEVICE_DISCONNECTED_DURING_ACTION_DESCRIPTION',
    },
    TR_DEVICE_FIRMWARE_VERSION: {
        defaultMessage: 'Device firmware: {firmware}.',
        description: 'Display firmware of device',
        id: 'TR_DEVICE_FIRMWARE_VERSION',
    },
    TR_DEVICE_IS_USED_IN_OTHER_WINDOW_BUTTON: {
        defaultMessage: 'Continue',
        description: '',
        id: 'TR_DEVICE_IS_USED_IN_OTHER_WINDOW_BUTTON',
    },
    TR_DEVICE_IS_USED_IN_OTHER_WINDOW_HEADING: {
        defaultMessage: 'Device is used in other window',
        description: '',
        id: 'TR_DEVICE_IS_USED_IN_OTHER_WINDOW_HEADING',
    },
    TR_DEVICE_IS_USED_IN_OTHER_WINDOW_TEXT: {
        defaultMessage:
            'This is a big no no. Please dont use device in other window. Close all other windows or tabs that might be using your Trezor device.',
        description: '',
        id: 'TR_DEVICE_IS_USED_IN_OTHER_WINDOW_TEXT',
    },
    TR_DEVICE_LABEL: {
        defaultMessage: 'Device label: {label}.',
        description: 'Display label of device',
        id: 'TR_DEVICE_LABEL',
    },
    TR_DEVICE_LABEL_IS_DISCONNECTED: {
        defaultMessage: 'Device {deviceLabel} is disconnected',
        id: 'TR_DEVICE_LABEL_IS_DISCONNECTED',
    },
    TR_DEVICE_LABEL_IS_NOT_BACKED_UP: {
        defaultMessage: 'Device {deviceLabel} is not backed up',
        id: 'TR_DEVICE_LABEL_IS_NOT_BACKED_UP',
    },
    TR_DEVICE_LABEL_IS_NOT_CONNECTED: {
        defaultMessage: 'Device {deviceLabel} is not connected',
        id: 'TR_DEVICE_LABEL_IS_NOT_CONNECTED',
    },
    TR_DEVICE_LABEL_IS_UNAVAILABLE: {
        defaultMessage: 'Device "{deviceLabel}" is unavailable',
        id: 'TR_DEVICE_LABEL_IS_UNAVAILABLE',
    },
    TR_DEVICE_NEEDS_ATTENTION: {
        defaultMessage: 'Device needs attention',
        id: 'TR_DEVICE_NEEDS_ATTENTION',
    },
    TR_DEVICE_NOT_RECOGNIZED_TRY_INSTALLING: {
        defaultMessage: 'Device not recognized? Try installing the {link}.',
        id: 'TR_DEVICE_NOT_RECOGNIZED_TRY_INSTALLING',
    },
    TR_DEVICE_SETTINGS: {
        defaultMessage: 'Device settings',
        id: 'TR_DEVICE_SETTINGS',
    },
    TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE: {
        defaultMessage: 'Wipe device',
        id: 'TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE',
    },
    TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL: {
        defaultMessage: 'Edit Label',
        id: 'TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL',
    },
    TR_DEVICE_SETTINGS_DEVICE_LABEL: {
        defaultMessage: 'Device Label',
        id: 'TR_DEVICE_SETTINGS_DEVICE_LABEL',
    },
    TR_DEVICE_SETTINGS_DISPLAY_ROTATION: {
        defaultMessage: 'Display rotation',
        id: 'TR_DEVICE_SETTINGS_DISPLAY_ROTATION',
    },
    TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS: {
        defaultMessage: 'PNG or JPG, 144 x 144 pixels',
        id: 'TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS',
    },
    TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY: {
        defaultMessage: 'Select from gallery',
        id: 'TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY',
    },
    TR_DEVICE_SETTINGS_HOMESCREEN_TITLE: {
        defaultMessage: 'Homescreen background',
        id: 'TR_DEVICE_SETTINGS_HOMESCREEN_TITLE',
    },
    TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE: {
        defaultMessage: 'Upload image',
        id: 'TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE',
    },
    TR_DEVICE_SETTINGS_PASSPHRASE_DESC: {
        defaultMessage:
            'Passphrase encryption adds an extra custom word to your recovery seed. This allows you to access new wallets, each hidden behind a particular passphrase. Your old accounts will be accessible with an empty passphrase.',
        id: 'TR_DEVICE_SETTINGS_PASSPHRASE_DESC',
    },
    TR_DEVICE_SETTINGS_PASSPHRASE_DESC_MORE: {
        defaultMessage:
            'If you forget your passphrase, your wallet is lost for good. There is no way to recover your funds.',
        id: 'TR_DEVICE_SETTINGS_PASSPHRASE_DESC_MORE',
    },
    TR_DEVICE_SETTINGS_PASSPHRASE_TITLE: {
        defaultMessage: 'Passphrase',
        id: 'TR_DEVICE_SETTINGS_PASSPHRASE_TITLE',
    },
    TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC: {
        defaultMessage:
            'Using PIN protection is highly recommended. PIN prevents unauthorized persons from stealing your funds even if they have physical access to your device.',
        id: 'TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC',
    },
    TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE: {
        defaultMessage: 'PIN protection',
        id: 'TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE',
    },
    TR_DEVICE_YOU_RECONNECTED_IS_DIFFERENT: {
        defaultMessage:
            'Device you reconnected is different from the previous device. Connect the right one.',
        description:
            'Text that indicates that user reconnected different device than he was working with before',
        id: 'TR_DEVICE_YOU_RECONNECTED_IS_DIFFERENT',
    },
    TR_DID_YOU_PURCHASE: {
        defaultMessage:
            'Please note, that device packaging including holograms have changed over time. You can check packaging details {TR_PACKAGING_LINK}. Also be sure you made your purchase from {TR_RESELLERS_LINK}. Otherwise, the device you are holding in your hands might be a counterfeit. Please {TR_CONTACT_OUR_SUPPORT_LINK}',
        description: 'Text to display when user is unhappy with his hologram.',
        id: 'TR_DID_YOU_PURCHASE',
    },
    TR_DISCONNECT_YOUR_DEVICE: {
        defaultMessage: 'Disconnect your device',
        description: 'Prompt to disconnect device.',
        id: 'TR_DISCONNECT_YOUR_DEVICE',
    },
    TR_DISCONNECTED: {
        defaultMessage: 'Disconnected',
        description: 'Device status',
        id: 'TR_DISCONNECTED',
    },
    TR_DOCUMENTATION: {
        defaultMessage: 'documentation',
        description: 'Link to trezor documentation (wiki)',
        id: 'TR_DOCUMENTATION',
    },
    TR_DOUBLE_CLICK_IT_TO_RUN_INSTALLER: {
        defaultMessage: 'Double click it to run installer',
        description: 'Instruction for installing Trezor Bridge',
        id: 'TR_DOUBLE_CLICK_IT_TO_RUN_INSTALLER',
    },
    TR_DOWNLOAD: {
        defaultMessage: 'Download',
        description: 'Download button',
        id: 'TR_DOWNLOAD',
    },
    TR_DOWNLOAD_LATEST_BRIDGE: {
        defaultMessage: 'Download latest Bridge {version}',
        id: 'TR_DOWNLOAD_LATEST_BRIDGE',
    },
    TR_EAST: {
        defaultMessage: 'East',
        id: 'TR_EAST',
    },
    TR_ENABLE_NETWORK_BUTTON: {
        defaultMessage: 'Find my {networkName} accounts',
        id: 'TR_ENABLE_NETWORK_BUTTON',
    },
    TR_ENTER_EXISTING_PASSPHRASE: {
        defaultMessage:
            'Enter existing passphrase to access existing hidden Wallet. Or enter new passphrase to create a new hidden Wallet.',
        id: 'TR_ENTER_EXISTING_PASSPHRASE',
    },
    TR_ENTER_PASSPHRASE: {
        defaultMessage: 'Enter passphrase',
        id: 'TR_ENTER_PASSPHRASE',
    },
    TR_ENTER_PASSPHRASE_ON_DEVICE: {
        defaultMessage: 'Enter passphrase on device',
        id: 'TR_ENTER_PASSPHRASE_ON_DEVICE',
    },
    TR_ENTER_PASSPHRASE_ON_DEVICE_LABEL: {
        defaultMessage: 'Enter passphrase on "{deviceLabel}" device.',
        id: 'TR_ENTER_PASSPHRASE_ON_DEVICE_LABEL',
    },
    TR_ENTER_PIN: {
        defaultMessage: 'Enter PIN',
        description: 'Button. Submit PIN',
        id: 'TR_ENTER_PIN',
    },
    TR_ENTER_SEED_WORDS_INSTRUCTION: {
        defaultMessage: 'Enter words from your seed in order displayed on your device.',
        description:
            'User is instructed to enter words from seed (backup) into the form in browser',
        id: 'TR_ENTER_SEED_WORDS_INSTRUCTION',
    },
    TR_ENTERED_PIN_NOT_CORRECT: {
        defaultMessage: 'Entered PIN for "{deviceLabel}" is not correct',
        id: 'TR_ENTERED_PIN_NOT_CORRECT',
    },
    TR_ESTIMATED_TIME: {
        defaultMessage: 'Estimated time',
        id: 'TR_ESTIMATED_TIME',
    },
    TR_ETH_DATA_NOT_HEX: {
        defaultMessage: 'Data is not hex',
        id: 'TR_ETH_DATA_NOT_HEX',
    },
    TR_ETH_GAS_LIMIT_NOT_NUMBER: {
        defaultMessage: 'Gas limit is not a number',
        id: 'TR_ETH_GAS_LIMIT_NOT_NUMBER',
    },
    TR_ETH_GAS_PRICE_NOT_NUMBER: {
        defaultMessage: 'Gas price is not a number',
        id: 'TR_ETH_GAS_PRICE_NOT_NUMBER',
    },
    TR_EXCHANGE_RATE: {
        defaultMessage: 'Exchange rate',
        id: 'TR_EXCHANGE_RATE',
    },
    TR_FAILED_BACKUP: {
        defaultMessage: 'Backup failed. This is serious.',
        id: 'TR_FAILED_BACKUP',
    },
    TR_FEE: {
        defaultMessage: 'Fee',
        description: 'Label in Send form',
        id: 'TR_FEE',
    },
    TR_FIAT_RATES_ARE_NOT_CURRENTLY: {
        defaultMessage: 'Fiat rates are not currently available.',
        id: 'TR_FIAT_RATES_ARE_NOT_CURRENTLY',
    },
    TR_FINAL_HEADING: {
        defaultMessage: 'Good job! All done',
        description: 'Heading in newsletter step',
        id: 'TR_FINAL_HEADING',
    },
    TR_FINAL_SUBHEADING: {
        defaultMessage:
            'You did it! Not only your Trezor is initialized and ready but you also increased your security level above the average user by going through all security steps. Good job!',
        id: 'TR_FINAL_SUBHEADING',
    },
    TR_FIND_OUT_MORE_INFO: {
        defaultMessage: 'Find out more info',
        id: 'TR_FIND_OUT_MORE_INFO',
    },
    TR_FINISH_ADVANCED_SECURITY: {
        defaultMessage: 'Finish advanced security',
        id: 'TR_FINISH_ADVANCED_SECURITY',
    },
    TR_FIRMWARE_HEADING: {
        defaultMessage: 'Firmware installation',
        description: 'Heading on firmware page',
        id: 'TR_FIRMWARE_HEADING',
    },
    TR_FIRMWARE_INSTALLED: {
        defaultMessage: 'Perfect. The newest firmware is installed. Time to continue',
        description: 'Message to display in case firmware is installed',
        id: 'TR_FIRMWARE_INSTALLED',
    },
    TR_FIRMWARE_INSTALLED_TEXT: {
        defaultMessage: 'This device has already installed firmware version: {version}',
        description: 'Text to display in case device has firmware installed but it is outdated',
        id: 'TR_FIRMWARE_INSTALLED_TEXT',
    },
    TR_FIRMWARE_SUBHEADING: {
        defaultMessage:
            'Your Trezor is shipped without firmware installed to ensure that you can get started with the latest features right away. The authenticity of the installed firmware is always checked during device start. If the firmware is not correctly signed by SatoshiLabs, your Trezor will display a warning.',
        description: 'Main text on firmware page for devices without firmware.',
        id: 'TR_FIRMWARE_SUBHEADING',
    },
    TR_FIRMWARE_VERSION: {
        defaultMessage: 'Firmware version',
        id: 'TR_FIRMWARE_VERSION',
    },
    TR_FIRST_SEEN: {
        defaultMessage: 'First Seen',
        id: 'TR_FIRST_SEEN',
    },
    TR_FOR_EASIER_AND_SAFER_INPUT: {
        defaultMessage:
            'For easier and safer input you can scan recipient’s address from a QR code using your computer camera.',
        id: 'TR_FOR_EASIER_AND_SAFER_INPUT',
    },
    TR_FOUND_OK_DEVICE: {
        defaultMessage: 'Found an empty device, yay! You can continue now.',
        description: 'Case when device was connected and it is in expected state (not initialized)',
        id: 'TR_FOUND_OK_DEVICE',
    },
    TR_GAS_LIMIT: {
        defaultMessage: 'Gas limit',
        id: 'TR_GAS_LIMIT',
    },
    // TR_GAS_LIMIT_REFERS_TO: {
    //         defaultMessage:
    //                 'Gas limit refers to the maximum amount of gas user is willing to spend on a particular transaction. {TR_GAS_QUOTATION}. Increasing the gas limit will not get the transaction confirmed sooner. Default value for sending {gasLimitTooltipCurrency} is {gasLimitTooltipValue}.',
    //         id: 'TR_GAS_LIMIT_REFERS_TO',
    // },
    // TR_GAS_PRICE: {
    //         defaultMessage: 'Gas price',
    //         id: 'TR_GAS_PRICE',
    // },
    // TR_GAS_PRICE_QUOTATION: {
    //         defaultMessage: 'Transaction fee = gas limit * gas price',
    //         id: 'TR_GAS_PRICE_QUOTATION',
    // },
    // TR_GAS_PRICE_REFERS_TO: {
    //         defaultMessage:
    //                 'Gas price refers to the amount of ether you are willing to pay for every unit of gas, and is usually measured in “Gwei”. {TR_GAS_PRICE_QUOTATION}. Increasing the gas price will get the transaction confirmed sooner but makes it more expensive. The recommended gas price is {recommendedGasPrice} GWEI.',
    //         id: 'TR_GAS_PRICE_REFERS_TO',
    // },
    // TR_GAS_QUOTATION: {
    //         defaultMessage: 'Transaction fee = gas limit * gas price',
    //         id: 'TR_GAS_QUOTATION',
    // },
    TR_GATHERING_INFO: {
        defaultMessage: 'Gathering information, please wait...',
        id: 'TR_GATHERING_INFO',
    },
    TR_GENERAL: {
        defaultMessage: 'General',
        description: 'Category in Settings',
        id: 'TR_GENERAL',
    },
    TR_GO_TO_EXTERNAL_WALLET: {
        defaultMessage: 'Go to external wallet',
        id: 'TR_GO_TO_EXTERNAL_WALLET',
    },
    TR_GO_TO_SECURITY: {
        defaultMessage: 'Continue to backup',
        description: 'Button in security page (start security setup)',
        id: 'TR_GO_TO_SECURITY',
    },
    TR_HELP_TREZOR_SUITE: {
        defaultMessage: 'Help Trezor Suite get better',
        id: 'TR_HELP_TREZOR_SUITE',
    },
    TR_HELP_TREZOR_SUITE_TEXT_1: {
        defaultMessage:
            'Help Trezor Suite become a better product by sending us {TR_HELP_TREZOR_SUITE_TEXT_1_FAT}.',
        id: 'TR_HELP_TREZOR_SUITE_TEXT_1',
    },
    TR_HELP_TREZOR_SUITE_TEXT_1_FAT: {
        defaultMessage: 'anonymous analytics data.',
        id: 'TR_HELP_TREZOR_SUITE_TEXT_1_FAT',
    },
    TR_HELP_TREZOR_SUITE_TEXT_2: {
        defaultMessage: 'Trezor Suite does NOT track any balance-related or personal data.',
        id: 'TR_HELP_TREZOR_SUITE_TEXT_2',
    },
    TR_HIDE_ADVANCED_OPTIONS: {
        defaultMessage: 'Hide advanced options',
        description: 'Hide advanced sending form',
        id: 'TR_HIDE_ADVANCED_OPTIONS',
    },
    TR_EJECT_WALLET: {
        defaultMessage: 'Eject wallet',
        id: 'TR_EJECT_WALLET',
    },
    TR_EJECT_WALLET_EXPLANATION: {
        defaultMessage: "Explanation what the 'eject wallet' button does",
        id: 'TR_EJECT_WALLET_EXPLANATION',
    },
    TR_HOLOGRAM_STEP_ACTION_NOT_OK: {
        defaultMessage: 'My hologram looks different',
        description: 'Button to click when hologram looks different',
        id: 'TR_HOLOGRAM_STEP_ACTION_NOT_OK',
    },
    TR_HOLOGRAM_STEP_ACTION_OK: {
        defaultMessage: 'My hologram is OK',
        description: 'Button to click in allright case',
        id: 'TR_HOLOGRAM_STEP_ACTION_OK',
    },
    TR_HOLOGRAM_STEP_HEADING: {
        defaultMessage: 'Hologram check',
        description: 'Heading on hologram step page',
        id: 'TR_HOLOGRAM_STEP_HEADING',
    },
    TR_HOLOGRAM_STEP_SUBHEADING: {
        defaultMessage: 'Please make sure hologram protecting your device is authentic',
        description: 'Subheading on hologram step page',
        id: 'TR_HOLOGRAM_STEP_SUBHEADING',
    },
    TR_HOW_PIN_WORKS: {
        defaultMessage: 'Not sure how PIN works?',
        id: 'TR_HOW_PIN_WORKS',
    },
    TR_I_UNDERSTAND_PASSPHRASE: {
        defaultMessage: 'I understand passphrase is not saved anywhere and can’t be restored.',
        id: 'TR_I_UNDERSTAND_PASSPHRASE',
    },
    TR_IF_YOUR_DEVICE_IS_EVER_LOST: {
        defaultMessage: 'If you lose or damage the device, your funds will be lost.',
        id: 'TR_IF_YOUR_DEVICE_IS_EVER_LOST',
    },
    TR_IMPORTED_ACCOUNT_HASH: {
        defaultMessage: 'Imported account #{number}',
        description: 'Used in auto-generated label for imported accounts',
        id: 'TR_IMPORTED_ACCOUNT_HASH',
    },
    TR_INCOMING: {
        defaultMessage: 'Incoming',
        id: 'TR_INCOMING',
    },
    TR_INSTALL: {
        defaultMessage: 'Install',
        description: 'Install button',
        id: 'TR_INSTALL',
    },
    TR_INSTALLING: {
        defaultMessage: 'Do not disconnect your device. Installing',
        description: 'Message that is visible when installing process is in progress.',
        id: 'TR_INSTALLING',
    },
    TR_INSTRUCTION_TO_SKIP: {
        defaultMessage:
            'You should skip setup and continue to wallet and check if you have any funds on this device.',
        description:
            'Instruction what to do when user knows the device he is holding was manipulated by him, not someone else.',
        id: 'TR_INSTRUCTION_TO_SKIP',
    },
    TR_IS_NOT_NEW_DEVICE_HEADING: {
        defaultMessage: 'Device does not appear to be that new',
        id: 'TR_IS_NOT_NEW_DEVICE_HEADING',
    },
    TR_IS_NOT_NEW_DEVICE: {
        defaultMessage:
            'According to your decision in a previous step, this was supposed to be a fresh device. But we were able to detect already installed firmware on it.',
        description:
            'Just a message that we show after user selects that he wants to setup device as a new one but we detect that it apparently is not',
        id: 'TR_IS_NOT_NEW_DEVICE',
    },
    TR_LABELING: {
        defaultMessage: 'Labeling',
        id: 'TR_LABELING',
    },
    TR_LANGUAGE: {
        defaultMessage: 'Language',
        id: 'TR_LANGUAGE',
    },
    TR_LEARN_MORE: {
        defaultMessage: 'Learn more',
        description: 'Link to Trezor wiki.',
        id: 'TR_LEARN_MORE',
    },
    TR_LEARN_MORE_LINK: {
        defaultMessage: 'Learn more.',
        description: 'Link to Trezor wiki.',
        id: 'TR_LEARN_MORE_LINK',
    },
    TR_LEGACY_ACCOUNTS: {
        defaultMessage: 'Legacy accounts',
        id: 'TR_LEGACY_ACCOUNTS',
    },
    TR_LOADING_ACCOUNT: {
        defaultMessage: 'Loading account',
        id: 'TR_LOADING_ACCOUNT',
    },
    TR_LOADING_DEVICE_DOT_DOT_DOT: {
        defaultMessage: 'Loading device...',
        id: 'TR_LOADING_DEVICE_DOT_DOT_DOT',
    },
    TR_LOADING_OTHER_ACCOUNTS: {
        defaultMessage: 'Loading other accounts...',
        id: 'TR_LOADING_OTHER_ACCOUNTS',
    },
    TR_LOADING_TRANSACTIONS: {
        defaultMessage: 'Loading transactions',
        id: 'TR_LOADING_TRANSACTIONS',
    },
    TR_LOG: {
        defaultMessage: 'Log',
        description: 'application event and error',
        id: 'TR_LOG',
    },
    TR_LOOKING_FOR_QUICK_EASY: {
        defaultMessage: 'Looking for a quick & easy way to buy BTC? We got you covered.',
        id: 'TR_LOOKING_FOR_QUICK_EASY',
    },
    TR_LTC_ADDRESS_INFO: {
        defaultMessage:
            'Litecoin changed the format of addresses. Find more info about how to convert your address on our blog. {TR_LEARN_MORE}',
        id: 'TR_LTC_ADDRESS_INFO',
    },
    TR_MARK_ALL_AS_READ: {
        defaultMessage: 'Mark all as read',
        id: 'TR_MARK_ALL_AS_READ',
    },
    TR_MAXIMUM_LENGTH_IS_9_DIGITS: {
        defaultMessage: 'Maximum length is 9 digits.',
        id: 'TR_MAXIMUM_LENGTH_IS_9_DIGITS',
    },
    TR_MESSAGE: {
        defaultMessage: 'Message',
        description: 'Used as a label for message input field in Sign and Verify form',
        id: 'TR_MESSAGE',
    },
    TR_MINED_TIME: {
        defaultMessage: 'Mined Time',
        id: 'TR_MINED_TIME',
    },
    TR_MODEL_ONE: {
        defaultMessage: 'Model one',
        description: 'Name of Trezor model 1',
        id: 'TR_MODEL_ONE',
    },
    TR_MODEL_ONE_DESC: {
        defaultMessage: 'Two buttons and a mono-chromatic screen',
        description: 'Description of Trezor model 1',
        id: 'TR_MODEL_ONE_DESC',
    },
    TR_MODEL_T: {
        defaultMessage: 'Model T',
        description: 'Name of Trezor model T',
        id: 'TR_MODEL_T',
    },
    TR_MODEL_T_DESC: {
        defaultMessage: 'Full-color touch-screen display',
        description: 'Description of Trezor model T',
        id: 'TR_MODEL_T_DESC',
    },
    TR_NAV_RECEIVE: {
        defaultMessage: 'Receive',
        description: 'Title of the navigation tab that contains the account address',
        id: 'TR_NAV_RECEIVE',
    },
    TR_NAV_SEND: {
        defaultMessage: 'Send',
        description: 'Title of the navigation tab that contains a form for sending funds',
        id: 'TR_NAV_SEND',
    },
    TR_NAV_DETAILS: {
        defaultMessage: 'Account details',
        id: 'TR_NAV_DETAILS',
    },
    TR_NAV_SIGN_AND_VERIFY: {
        defaultMessage: 'Sign & Verify',
        description:
            'Title of the navigation tab that contains a form for signing and verifying messages',
        id: 'TR_NAV_SIGN_AND_VERIFY',
    },
    TR_NAV_TRANSACTIONS: {
        defaultMessage: 'Transactions',
        description: 'Title of the navigation tab that contains tx history.',
        id: 'TR_NAV_TRANSACTIONS',
    },
    TR_NETWORK_BITCOIN: {
        defaultMessage: 'Bitcoin',
        id: 'TR_NETWORK_BITCOIN',
    },
    TR_NETWORK_BITCOIN_CASH: {
        defaultMessage: 'Bitcoin Cash',
        id: 'TR_NETWORK_BITCOIN_CASH',
    },
    TR_NETWORK_BITCOIN_GOLD: {
        defaultMessage: 'Bitcoin Gold',
        id: 'TR_NETWORK_BITCOIN_GOLD',
    },
    TR_NETWORK_BITCOIN_TESTNET: {
        defaultMessage: 'Bitcoin Testnet',
        id: 'TR_NETWORK_BITCOIN_TESTNET',
    },
    TR_NETWORK_CARDANO: {
        defaultMessage: 'Cardano',
        id: 'TR_NETWORK_CARDANO',
    },
    TR_NETWORK_DASH: {
        defaultMessage: 'Dash',
        id: 'TR_NETWORK_DASH',
    },
    TR_NETWORK_DIGIBYTE: {
        defaultMessage: 'Digibyte',
        id: 'TR_NETWORK_DIGIBYTE',
    },
    TR_NETWORK_DOGECOIN: {
        defaultMessage: 'Dogecoin',
        id: 'TR_NETWORK_DOGECOIN',
    },
    TR_NETWORK_ETHEREUM: {
        defaultMessage: 'Ethereum',
        id: 'TR_NETWORK_ETHEREUM',
    },
    TR_NETWORK_ETHEREUM_CLASSIC: {
        defaultMessage: 'Ethereum Classic',
        id: 'TR_NETWORK_ETHEREUM_CLASSIC',
    },
    TR_NETWORK_ETHEREUM_TESTNET: {
        defaultMessage: 'Ethereum Testnet',
        id: 'TR_NETWORK_ETHEREUM_TESTNET',
    },
    TR_NETWORK_LITECOIN: {
        defaultMessage: 'Litecoin',
        id: 'TR_NETWORK_LITECOIN',
    },
    TR_NETWORK_NAMECOIN: {
        defaultMessage: 'Namecoin',
        id: 'TR_NETWORK_NAMECOIN',
    },
    TR_NETWORK_NEM: {
        defaultMessage: 'NEM',
        id: 'TR_NETWORK_NEM',
    },
    TR_NETWORK_STELLAR: {
        defaultMessage: 'Stellar',
        id: 'TR_NETWORK_STELLAR',
    },
    TR_NETWORK_TEZOS: {
        defaultMessage: 'Tezos',
        id: 'TR_NETWORK_TEZOS',
    },
    TR_NETWORK_UNKNOWN: {
        defaultMessage: 'unknown',
        id: 'TR_NETWORK_UNKNOWN',
    },
    TR_NETWORK_VERTCOIN: {
        defaultMessage: 'Vertcoin',
        id: 'TR_NETWORK_VERTCOIN',
    },
    TR_NETWORK_XRP: {
        defaultMessage: 'XRP',
        id: 'TR_NETWORK_XRP',
    },
    TR_NETWORK_XRP_TESTNET: {
        defaultMessage: 'XRP Testnet',
        id: 'TR_NETWORK_XRP_TESTNET',
    },
    TR_NETWORK_ZCASH: {
        defaultMessage: 'Zcash',
        id: 'TR_NETWORK_ZCASH',
    },
    TR_NEW_COMMUNICATION_TOOL: {
        defaultMessage:
            'New communication tool to facilitate the connection between your Trezor and your internet browser.',
        id: 'TR_NEW_COMMUNICATION_TOOL',
    },
    TR_NEW_TREZOR_BRIDGE_IS_AVAILABLE: {
        defaultMessage: 'New Trezor Bridge is available.',
        id: 'TR_NEW_TREZOR_BRIDGE_IS_AVAILABLE',
    },
    TR_NEW_TREZOR_FIRMWARE_IS_AVAILABLE_DOT: {
        defaultMessage: 'New Trezor firmware is available.',
        id: 'TR_NEW_TREZOR_FIRMWARE_IS_AVAILABLE_DOT',
    },
    TR_NO_PASSPHRASE_WALLET: {
        defaultMessage: 'No-passphrase wallet',
        id: 'TR_NO_PASSPHRASE_WALLET',
    },
    // TR_CUSTOM_FEE_IS_NOT_NUMBER: {
    //         defaultMessage: 'Fee is not a number',
    //         id: 'TR_CUSTOM_FEE_IS_NOT_NUMBER',
    // },
    TR_NORTH: {
        defaultMessage: 'North',
        id: 'TR_NORTH',
    },
    TR_NUM_ACCOUNTS_FIAT_VALUE: {
        defaultMessage:
            '{accountsCount} {accountsCount, plural, one {account} other {accounts}} • {fiatValue}',
        description: 'Used as title for a wallet instance in Switch Device modal',
        id: 'TR_NUM_ACCOUNTS_FIAT_VALUE',
    },
    TR_OFFLINE: {
        defaultMessage: 'Offline',
        id: 'TR_OFFLINE',
    },
    TR_ONCE_YOU_SEND_OR_RECEIVE: {
        defaultMessage:
            'Once you send or receive your first transaction it will show up here. Until then, wanna buy some crypto? Click the button below to begin your shopping spree!',
        id: 'TR_ONCE_YOU_SEND_OR_RECEIVE',
    },
    TR_ONLINE: {
        defaultMessage: 'Online',
        id: 'TR_ONLINE',
    },
    TR_OOPS_SOMETHING_WENT_WRONG: {
        defaultMessage: 'Oops! Something went wrong!',
        id: 'TR_OOPS_SOMETHING_WENT_WRONG',
    },
    TR_OUTGOING: {
        defaultMessage: 'Outgoing',
        id: 'TR_OUTGOING',
    },
    TR_PACKAGING_LINK: {
        defaultMessage: 'here',
        description: 'Part of sentence TR_DID_YOU_PURCHASE. Link to support',
        id: 'TR_PACKAGING_LINK',
    },
    TR_PASSPHRASE_CASE_SENSITIVE: {
        defaultMessage: 'Note: Passphrase is case-sensitive.',
        id: 'PASSPHRASE_CASE_SENSITIVE',
    },
    TR_PASSPHRASE_HIDDEN_WALLET: {
        defaultMessage: 'Passphrase (hidden) wallet',
        id: 'TR_PASSPHRASE_HIDDEN_WALLET',
    },
    TR_PASSPHRASE_TOO_LONG: {
        defaultMessage: 'The passphrase length has exceed the allowed limit.',
        id: 'TR_PASSPHRASE_TOO_LONG',
    },
    TR_PASSPHRASE_WALLET: {
        defaultMessage: 'Passphrase wallet #{id}',
        id: 'TR_PASSPHRASE_WALLET',
    },
    TR_PENDING: {
        defaultMessage: 'Pending',
        description: 'Pending transaction with no confirmations',
        id: 'TR_PENDING',
    },
    TR_PIN_ERROR_TROUBLESHOOT: {
        defaultMessage:
            'Are you confused, how PIN works? You can always refer to our {TR_DOCUMENTATION}',
        description: 'Troubleshooting text after user enters second PIN incorrectly.',
        id: 'TR_PIN_ERROR_TROUBLESHOOT',
    },
    TR_PIN_HEADING_FIRST: {
        defaultMessage: 'Set new PIN',
        description: 'Heading in PIN page when entering PIN for the first time',
        id: 'TR_PIN_HEADING_FIRST',
    },
    TR_PIN_HEADING_MISMATCH: {
        defaultMessage: 'PIN mismatch',
        description: 'Heading in PIN page when PIN repeated incorrectly',
        id: 'TR_PIN_HEADING_MISMATCH',
    },
    TR_PIN_HEADING_REPEAT: {
        defaultMessage: 'Repeat PIN',
        description: 'Heading in PIN page when repeating PIN',
        id: 'TR_PIN_HEADING_REPEAT',
    },
    TR_PIN_HEADING_SUCCESS: {
        defaultMessage: 'PIN enabled',
        description: 'Heading in PIN page when PIN set',
        id: 'TR_PIN_HEADING_SUCCESS',
    },
    TR_PIN_SET_SUCCESS: {
        defaultMessage: 'Purfect! Your device is now secured by pin.',
        description: 'Longer text indicating PIN was set succesfully.',
        id: 'TR_PIN_SET_SUCCESS',
    },
    TR_PIN_SUBHEADING: {
        defaultMessage: 'Protect device from unauthorized access by using a strong pin.',
        description: 'Subheading on PIN page',
        id: 'TR_PIN_SUBHEADING',
    },
    TR_PLEASE_ALLOW_YOUR_CAMERA: {
        defaultMessage: 'Please allow your camera to be able to scan a QR code.',
        id: 'TR_PLEASE_ALLOW_YOUR_CAMERA',
    },
    TR_PLEASE_CONNECT_YOUR_DEVICE: {
        defaultMessage: 'Please connect your device to continue with the verification process',
        id: 'TR_PLEASE_CONNECT_YOUR_DEVICE',
    },
    TR_PLEASE_DISABLE_PASSPHRASE: {
        defaultMessage:
            'Please disable passphrase settings to continue with the verification process.',
        id: 'TR_PLEASE_DISABLE_PASSPHRASE',
    },
    TR_PLEASE_ENABLE_PASSPHRASE: {
        defaultMessage:
            'Please enable passphrase settings to continue with the verification process.',
        id: 'TR_PLEASE_ENABLE_PASSPHRASE',
    },
    TR_PRIMARY_FIAT: {
        defaultMessage: 'Primary FIAT currency to display',
        id: 'TR_PRIMARY_FIAT',
    },
    TR_RANDOM_SEED_WORDS_DISCLAIMER: {
        defaultMessage:
            'You might be asked to retype some words that are not part of your recovery seed.',
        description:
            'User is instructed to enter words from seed (backup) into the form in browser',
        id: 'TR_RANDOM_SEED_WORDS_DISCLAIMER',
    },
    TR_READ_MORE: {
        defaultMessage: 'Read more',
        id: 'TR_READ_MORE',
    },
    TR_RECEIVE: {
        defaultMessage: 'Receive',
        id: 'TR_RECEIVE',
    },
    TR_RECIPIENT_ADDRESS: {
        defaultMessage: 'Recipient address',
        id: 'TR_RECIPIENT_ADDRESS',
    },
    TR_RECONNECT_HEADER: {
        defaultMessage: 'Reconnect your device',
        id: 'TR_RECONNECT_HEADER',
    },
    TR_RECONNECT_TEXT: {
        defaultMessage: 'We lost connection with your device. This might mean:',
        id: 'TR_RECONNECT_TEXT',
    },
    TR_RECONNECT_TROUBLESHOOT_BRIDGE: {
        defaultMessage: 'Trezor bridge might have stopped working, try restarting',
        description: '',
        id: 'TR_RECONNECT_TROUBLESHOOT_BRIDGE',
    },
    TR_RECONNECT_TROUBLESHOOT_CABEL: {
        defaultMessage: 'Cable is broken, try another one',
        description: '',
        id: 'TR_RECONNECT_TROUBLESHOOT_CABEL',
    },
    TR_RECONNECT_TROUBLESHOOT_CONNECTION: {
        defaultMessage: 'Device is not well connected to the cable',
        description: '',
        id: 'TR_RECONNECT_TROUBLESHOOT_CONNECTION',
    },
    TR_RECOVER_SUBHEADING: {
        defaultMessage:
            'It is possible to re-create device from bip39 backup. First of all, chose number of words of your backup.',
        description: 'Subheading in recover page. Basic info about recovery',
        id: 'TR_RECOVER_SUBHEADING',
    },
    TR_RECOVER_SUBHEADING_MODEL_T: {
        defaultMessage: 'On model T the entire recovery process is doable on device.',
        description: 'Subheading in recover page. Basic info about recovery',
        id: 'TR_RECOVER_SUBHEADING_MODEL_T',
    },
    TR_RECOVERY_ERROR: {
        defaultMessage: 'Device recovery failed with error: {error}',
        description: 'Error during recovery. For example wrong word retyped or device disconnected',
        id: 'TR_RECOVERY_ERROR',
    },
    TR_RECOVERY_SEED_IS: {
        defaultMessage:
            'Recovery seed is a list of words in a specific order which store all the information needed.',
        id: 'TR_RECOVERY_SEED_IS',
    },
    TR_RECOVERY_TYPES_DESCRIPTION: {
        defaultMessage:
            'Both methods are safe. Basic recovery uses on computer input of words in randomized order. Advanced recovery uses on-screen input to load your recovery seed. {TR_LEARN_MORE_LINK}',
        description: 'There are two methods of recovery for T1. This is a short explanation text.',
        id: 'TR_RECOVERY_TYPES_DESCRIPTION',
    },
    TR_REMEMBER_ALLOWS_YOU_TO: {
        defaultMessage:
            'Remember allows you to access any wallet in watch-only mode without connected device.',
        id: 'TR_REMEMBER_ALLOWS_YOU_TO',
    },
    TR_REMEMBER_WALLET: {
        defaultMessage: 'Remember wallet',
        id: 'TR_REMEMBER_WALLET',
    },
    TR_RESELLERS_LINK: {
        defaultMessage: 'a trusted reseller',
        description:
            'Part of sentence TR_DID_YOU_PURCHASE. Link to page with trusted resellers list',
        id: 'TR_RESELLERS_LINK',
    },
    TR_RETRY: {
        defaultMessage: 'Retry',
        description: 'Retry button',
        id: 'TR_RETRY',
    },
    TR_RETRYING_DOT_DOT: {
        defaultMessage: 'Retrying...',
        id: 'TR_RETRYING_DOT_DOT',
    },
    TR_SCAN_QR_CODE: {
        defaultMessage: 'Scan QR code',
        description: 'Title for the Scan QR modal dialog',
        id: 'TR_SCAN_QR_CODE',
    },
    TR_SECURITY_HEADING: {
        defaultMessage: 'Trezor successfully initialized!',
        description: 'Heading in security page',
        id: 'TR_SECURITY_HEADING',
    },
    TR_SECURITY_SUBHEADING: {
        defaultMessage:
            'Your Trezor has been successfully initialized and is ready to be used. Your Wallet has been successfully created and is ready to be used as well. Wheeee!',
        description: 'Text in security page',
        id: 'TR_SECURITY_SUBHEADING',
    },
    TR_SEED_MANUAL_LINK: {
        defaultMessage: 'recovery seed',
        description: 'Link. Part of TR_BACKUP_SUBHEADING_1',
        id: 'TR_SEED_MANUAL_LINK',
    },
    TR_SELECT_DEVICE: {
        defaultMessage: 'Select device',
        id: 'TR_SELECT_DEVICE',
    },
    TR_SELECT_PASSPHRASE_SOURCE: {
        defaultMessage: 'Select passphrase source on "{deviceLabel}" device.',
        id: 'TR_SELECT_PASSPHRASE_SOURCE',
    },
    TR_SELECT_WALLET_TO_ACCESS: {
        defaultMessage: 'Select a wallet to access',
        id: 'TR_SELECT_WALLET_TO_ACCESS',
    },
    TR_SELECT_YOUR_DEVICE_HEADING: {
        defaultMessage: 'Select your device',
        description: 'Heading on select your device page',
        id: 'TR_SELECT_YOUR_DEVICE_HEADING',
    },
    TR_SEND: {
        defaultMessage: 'Send',
        id: 'TR_SEND',
    },
    TR_SEND_NETWORK: {
        defaultMessage: 'Send {network}',
        id: 'TR_SEND_NETWORK',
    },
    TR_SEND_NETWORK_AND_TOKENS: {
        defaultMessage: 'Send {network} and tokens',
        id: 'TR_SEND_NETWORK_AND_TOKENS',
    },
    TR_SENT_TO_SELF: {
        defaultMessage: '(Sent to self)',
        id: 'TR_SENT_TO_SELF',
    },
    // TR_SET_MAX: {
    //         defaultMessage: 'Set max',
    //         description: 'Used for setting maximum amount in Send form',
    //         id: 'TR_SET_MAX',
    // },
    TR_SET_PIN: {
        defaultMessage: 'Set pin',
        description: 'Button text',
        id: 'TR_SET_PIN',
    },
    TR_SET_UP_NEW_PIN: {
        defaultMessage: 'Set up new PIN',
        id: 'TR_SET_UP_NEW_PIN',
    },
    TR_SET_UP_STRONG_PIN_TO_PROTECT: {
        defaultMessage:
            'Set up a strong PIN to protect your device from unauthorized access. The keypad layout is displayed on your connected Trezor device.',
        id: 'TR_SET_UP_STRONG_PIN_TO_PROTECT',
    },
    TR_SETTINGS: {
        defaultMessage: 'Settings',
        id: 'TR_SETTINGS',
    },
    TR_SHOW_ADDRESS_I_WILL_TAKE_THE_RISK: {
        defaultMessage: 'Show address, I will take the risk',
        id: 'TR_SHOW_ADDRESS_I_WILL_TAKE_THE_RISK',
    },
    TR_SHOW_ADVANCED_OPTIONS: {
        defaultMessage: 'Show advanced options',
        description: 'Shows advanced sending form',
        id: 'TR_SHOW_ADVANCED_OPTIONS',
    },
    TR_SHOW_DETAILS: {
        defaultMessage: 'Show details',
        id: 'TR_SHOW_DETAILS',
    },
    TR_SHOW_DETAILS_IN_BLOCK_EXPLORER: {
        defaultMessage: 'Show details in Block Explorer',
        id: 'TR_SHOW_DETAILS_IN_BLOCK_EXPLORER',
    },
    TR_SHOW_OLDER_NEWS: {
        defaultMessage: 'Show older news',
        id: 'TR_SHOW_OLDER_NEWS',
    },
    TR_SHOW_ON_TREZOR: {
        defaultMessage: 'Show on Trezor',
        id: 'TR_SHOW_ON_TREZOR',
    },
    TR_SHOW_UNVERIFIED_ADDRESS: {
        defaultMessage: 'Show unverified address',
        id: 'TR_SHOW_UNVERIFIED_ADDRESS',
    },
    TR_SIGN: {
        defaultMessage: 'Sign',
        description: 'Sign button in Sign and Verify form',
        id: 'TR_SIGN',
    },
    TR_SIGN_MESSAGE: {
        defaultMessage: 'Sign Message',
        description: 'Header for the Sign and Verify form',
        id: 'TR_SIGN_MESSAGE',
    },
    // TODO: Toast notification
    // TR_SIGN_MESSAGE_ERROR: {
    //         defaultMessage: 'Failed to sign message',
    //         id: 'TR_SIGN_MESSAGE_ERROR',
    // },
    TR_SIGNATURE: {
        defaultMessage: 'Signature',
        description: 'Used as a label for signature input field in Sign and Verify form',
        id: 'TR_SIGNATURE',
    },
    // TODO: Toast notification
    // TR_SIGNATURE_IS_VALID: {
    //         defaultMessage: 'Signature is valid',
    //         id: 'TR_SIGNATURE_IS_VALID',
    // },
    TR_SKIP: {
        defaultMessage: 'Skip',
        description: 'Button. Skip one step',
        id: 'TR_SKIP',
    },
    TR_SKIP_ALL: {
        defaultMessage: 'Skip onboarding',
        description: 'Button. Skip the entire onboarding process.',
        id: 'TR_SKIP_ALL',
    },
    TR_SKIP_ONBOARDING_HEADING: {
        defaultMessage: 'Skipping onboarding? One more thing…',
        id: 'TR_SKIP_ONBOARDING_HEADING',
    },
    TR_SKIP_ONBOARDING_TEXT: {
        defaultMessage:
            'If your device is initialiazed and you used Wallet or Suite before, that’s great! Did you initialize Trezor yourself? You should be the one doing it. If not, it might be dangerous.',
        id: 'TR_SKIP_ONBOARDING_TEXT',
    },
    TR_SKIP_SECURITY: {
        defaultMessage: 'Skip backup and PIN',
        description: 'Button in security page (skip security setup)',
        id: 'TR_SKIP_SECURITY',
    },
    TR_SOLVE_ISSUE: {
        defaultMessage: 'Solve issue',
        id: 'TR_SOLVE_ISSUE',
    },
    TR_SOUTH: {
        defaultMessage: 'South',
        id: 'TR_SOUTH',
    },
    TR_START_AGAIN: {
        defaultMessage: 'Start again',
        description: 'Button text',
        id: 'TR_START_AGAIN',
    },
    TR_START_BACKUP: {
        defaultMessage: 'Start backup',
        description: 'Button text',
        id: 'TR_START_BACKUP',
    },
    TR_START_RECOVERY: {
        defaultMessage: 'Start recovery',
        description: 'Button.',
        id: 'TR_START_RECOVERY',
    },
    TR_START: {
        defaultMessage: 'Start',
        id: 'TR_START',
    },
    TR_STATUS: {
        defaultMessage: 'Status',
        id: 'TR_STATUS',
    },
    TR_STATUS_UNKNOWN: {
        defaultMessage: 'Status unknown',
        description: 'Device status',
        id: 'TR_STATUS_UNKNOWN',
    },
    TR_SUITE_VERSION: {
        defaultMessage: 'Suite version',
        id: 'TR_SUITE_VERSION',
    },
    TR_SUPPORT: {
        defaultMessage: 'Support',
        id: 'TR_SUPPORT',
    },
    TR_SWITCH_DEVICE: {
        defaultMessage: 'Switch Device',
        id: 'TR_SWITCH_DEVICE',
    },
    TR_TAKE_ME_BACK_TO_WALLET: {
        defaultMessage: 'Take me back to the wallet',
        id: 'TR_TAKE_ME_BACK_TO_WALLET',
    },
    TR_TESTNET_COINS: {
        defaultMessage: 'Testnet coins',
        id: 'TR_TESTNET_COINS',
    },
    TR_TESTNET_COINS_EXPLAINED: {
        defaultMessage:
            'Testnet coins dont have any value but you still may use them to learn and experiment.',
        id: 'TR_TESTNET_COINS_EXPLAINED',
    },
    TR_THE_PIN_LAYOUT_IS_DISPLAYED: {
        defaultMessage: 'The PIN layout is displayed on your Trezor.',
        id: 'TR_THE_PIN_LAYOUT_IS_DISPLAYED',
    },
    TR_THIS_HIDDEN_WALLET_IS_EMPTY: {
        defaultMessage:
            'This hidden Wallet is empty. To make sure you are in the correct Wallet, confirm Passphrase',
        id: 'TR_THIS_HIDDEN_WALLET_IS_EMPTY',
    },
    TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE: {
        defaultMessage:
            'This hidden Wallet is empty. To make sure you are in the correct Wallet, select Passphrase source.',
        id: 'TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE',
    },
    TR_THIS_IS_PLACE_TO_SEE_ALL: {
        defaultMessage:
            'This is a place to see all your devices. You can further set them up in Settings but here you can switch between devices and see their statuses.',
        id: 'TR_THIS_IS_PLACE_TO_SEE_ALL',
    },
    TR_TO_ACCESS_STANDARD_NO_PASSPHRASE: {
        defaultMessage: 'To access standard (no-passphrase) Wallet click the button below.',
        id: 'TR_TO_ACCESS_STANDARD_NO_PASSPHRASE',
    },
    TR_TO_FIND_YOUR_ACCOUNTS_AND: {
        defaultMessage:
            'To find your accounts and funds we need to perform a coin discovery which will discover all your coins.',
        id: 'TR_TO_FIND_YOUR_ACCOUNTS_AND',
    },
    TR_TO_PREVENT_PHISHING_ATTACKS_COMMA: {
        defaultMessage:
            'To prevent phishing attacks, you should verify the address on your Trezor first. {claim}',
        id: 'TR_TO_PREVENT_PHISHING_ATTACKS_COMMA',
    },
    TR_TOS_INFORMATION: {
        defaultMessage:
            'Oh, by the way, we had to pay a hell lot of money to our lawyers to create some {TR_TOS_LINK}',
        id: 'TR_HELP_TREZOR_SUITE_TEXT',
    },
    TR_TOS_LINK: {
        defaultMessage: 'Terms & Conditions.',
        id: 'TR_TOS_LINK',
    },
    TR_TOTAL_INPUT: {
        defaultMessage: 'Total Input',
        id: 'TR_TOTAL_INPUT',
    },
    TR_TOTAL_OUTPUT: {
        defaultMessage: 'Total Output',
        id: 'TR_TOTAL_OUTPUT',
    },
    TR_TOTAL_PORTFOLIO_VALUE: {
        defaultMessage: 'Total portfolio value',
        id: 'TR_TOTAL_PORTFOLIO_VALUE',
    },
    TR_TRANSACTION_DETAILS: {
        defaultMessage: 'Transaction details',
        id: 'TR_TRANSACTION_DETAILS',
    },
    TR_TRANSACTION_ID: {
        defaultMessage: 'Transaction ID',
        id: 'TR_TRANSACTION_ID',
    },
    TR_TREZOR: {
        defaultMessage: 'Trezor',
        description: 'Link in header navigation',
        id: 'TR_TREZOR',
    },
    TR_TREZOR_BRIDGE_IS_NOT_RUNNING: {
        defaultMessage: 'Trezor Bridge is not running',
        description: '',
        id: 'TR_TREZOR_BRIDGE_IS_NOT_RUNNING',
    },
    TR_TREZOR_BRIDGE_IS_RUNNING_VERSION: {
        defaultMessage: 'Trezor Bridge is running. Version: {version}',
        description: '',
        id: 'TR_TREZOR_BRIDGE_IS_RUNNING_VERSION',
    },
    TR_TRY_AGAIN: {
        defaultMessage: 'Try again',
        description: 'Try to run the process again',
        id: 'TR_TRY_AGAIN',
    },
    TR_TX_CONFIRMATIONS: {
        defaultMessage:
            '{confirmationsCount} {confirmationsCount, plural, one {confirmation} other {confirmations}}',
        id: 'TR_TX_CONFIRMATIONS',
    },
    TR_TX_CURRENT_VALUE: {
        defaultMessage: 'Current Value',
        id: 'TR_TX_CURRENT_VALUE',
    },
    TR_TX_FEE: {
        defaultMessage: 'Fee',
        id: 'TR_TX_FEE',
    },
    TR_TX_HISTORICAL_VALUE_DATE: {
        defaultMessage: 'Historical Value ({date})',
        id: 'TR_TX_HISTORICAL_VALUE_DATE',
    },
    TR_TX_TYPE: {
        defaultMessage: 'Type',
        id: 'TR_TX_TYPE',
    },
    TR_UNAVAILABLE: {
        defaultMessage: 'Unavailable',
        description: 'Device status',
        id: 'TR_UNAVAILABLE',
    },
    TR_UNCONFIRMED_TX: {
        defaultMessage: 'Unconfirmed',
        id: 'TR_UNCONFIRMED_TX',
    },
    TR_UNDISCOVERED_WALLET: {
        defaultMessage: 'Undiscovered wallet',
        id: 'TR_UNDISCOVERED_WALLET',
    },
    TR_UNKNOWN: {
        defaultMessage: 'Unknown',
        id: 'TR_UNKNOWN',
    },
    TR_UNKNOWN_CONFIRMATION_TIME: {
        defaultMessage: 'unknown',
        id: 'TR_UNKNOWN_CONFIRMATION_TIME',
    },
    TR_UNKNOWN_TRANSACTION: {
        defaultMessage: 'Unknown transaction',
        id: 'TR_UNKNOWN_TRANSACTION',
    },
    TR_UNKNOWN_ERROR_SEE_CONSOLE: {
        defaultMessage: 'Unknown error. See console logs for details.',
        id: 'TR_UNKNOWN_ERROR_SEE_CONSOLE',
    },
    TR_UNLOCK: {
        defaultMessage: 'Unlock',
        id: 'TR_UNLOCK',
    },
    TR_UNREADABLE: {
        defaultMessage: 'Unreadable',
        description: 'Device status',
        id: 'TR_UNREADABLE',
    },
    TR_UNACQUIRED: {
        defaultMessage: 'Unrecognized device',
        description: 'Device status',
        id: 'TR_UNACQUIRED',
    },
    TR_UNVERIFIED_ADDRESS_COMMA_CONNECT: {
        defaultMessage: 'Unverified address, connect your Trezor to verify it',
        id: 'TR_UNVERIFIED_ADDRESS_COMMA_CONNECT',
    },
    TR_UNVERIFIED_ADDRESS_COMMA_SHOW: {
        defaultMessage: 'Unverified address, show on Trezor.',
        id: 'TR_UNVERIFIED_ADDRESS_COMMA_SHOW',
    },
    TR_UPLOAD_IMAGE: {
        defaultMessage: 'Upload Image',
        id: 'TR_UPLOAD_IMAGE',
    },
    TR_USED_IN_ANOTHER_WINDOW: {
        defaultMessage: 'Used in other window',
        description: 'Device status',
        id: 'TR_USED_IN_ANOTHER_WINDOW',
    },
    TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE: {
        defaultMessage: 'It is a brand new device, just unpacked',
        description: 'Option to click when troubleshooting initialized device.',
        id: 'TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE',
    },
    TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE_INSTRUCTIONS: {
        defaultMessage:
            'In that case you should immediately contact Trezor support with detailed information on your purchase and refrain from using this device.',
        description: 'What to do if device is already initialized but not by user.',
        id: 'TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE_INSTRUCTIONS',
    },
    TR_USER_HAS_WORKED_WITH_THIS_DEVICE: {
        defaultMessage: 'I have worked with it before',
        description: 'Option to click when troubleshooting initialized device.',
        id: 'TR_USER_HAS_WORKED_WITH_THIS_DEVICE',
    },
    TR_VALUES: {
        defaultMessage: 'Values',
        id: 'TR_VALUES',
    },
    TR_VERIFY: {
        defaultMessage: 'Verify',
        description: 'Verify button in Sign and Verify form',
        id: 'TR_VERIFY',
    },
    TR_VERIFY_MESSAGE: {
        defaultMessage: 'Verify Message',
        description: 'Header for the Sign and Verify form',
        id: 'TR_VERIFY_MESSAGE',
    },
    // TODO: Toast notification
    // TR_VERIFY_MESSAGE_ERROR: {
    //         defaultMessage: 'Failed to verify message',
    //         id: 'TR_VERIFY_MESSAGE_ERROR',
    // },
    // TR_VERIFY_MESSAGE_SUCCESS: {
    //         defaultMessage: 'Message has been successfully verified',
    //         id: 'TR_VERIFY_MESSAGE_SUCCESS',
    // },
    // TR_VERIFYING_ADDRESS_ERROR: {
    //         defaultMessage: 'Verifying address error',
    //         id: 'TR_VERIFYING_ADDRESS_ERROR',
    // },
    TR_WAIT_FOR_FILE_TO_DOWNLOAD: {
        defaultMessage: 'Wait for file to download',
        description: 'Instruction for installing Trezor Bridge',
        id: 'TR_WAIT_FOR_FILE_TO_DOWNLOAD',
    },
    TR_WAIT_FOR_REBOOT: {
        defaultMessage: 'Wait for your device to reboot',
        description: 'Info what is happening with users device.',
        id: 'TR_WAIT_FOR_REBOOT',
    },
    TR_WALLET_DUPLICATE_DESC: {
        defaultMessage: 'The hidden wallet that you are trying to create already exists',
        id: 'TR_WALLET_DUPLICATE_DESC',
    },
    TR_WALLET_DUPLICATE_RETRY: {
        defaultMessage: 'Try again with different passphrase',
        id: 'TR_WALLET_DUPLICATE_RETRY',
    },
    TR_WALLET_DUPLICATE_SWITCH: {
        defaultMessage: 'Switch to existing wallet',
        id: 'TR_WALLET_DUPLICATE_SWITCH',
    },
    TR_WALLET_DUPLICATE_TITLE: {
        defaultMessage: 'Passphrase duplicated',
        id: 'TR_WALLET_DUPLICATE_TITLE',
    },
    TR_WAS_USED_IN_ANOTHER_WINDOW: {
        defaultMessage: 'Reload session',
        description: 'Device status',
        id: 'TR_WAS_USED_IN_ANOTHER_WINDOW',
    },
    TR_WELCOME_MODAL_HEADING: {
        defaultMessage: 'Welcome to Trezor Suite!',
        id: 'TR_WELCOME_MODAL_HEADING',
    },
    TR_WELCOME_MODAL_TEXT: {
        defaultMessage: 'The one place for all your crypto matters.',
        id: 'TR_WELCOME_MODAL_TEXT',
    },
    TR_WELCOME_TO_TREZOR: {
        defaultMessage: 'First-time user or an ol’ Trezor fella?',
        id: 'TR_WELCOME_TO_TREZOR',
    },
    TR_WELCOME_TO_TREZOR_TEXT: {
        defaultMessage: 'Choose your path and let the Trezor Force be with you!.',
        id: 'TR_WELCOME_TO_TREZOR_TEXT',
    },
    TR_WEST: {
        defaultMessage: 'West',
        id: 'TR_WEST',
    },
    TR_WHAT_IS_PASSPHRASE: {
        defaultMessage: 'What is passphrase',
        id: 'TR_WHAT_IS_PASSPHRASE',
    },
    TR_WHAT_TO_DO_NOW: {
        defaultMessage: 'What to do now',
        id: 'TR_WHAT_TO_DO_NOW',
    },
    TR_WHATS_NEW: {
        defaultMessage: "What's new",
        id: 'TR_WHATS_NEW',
    },
    TR_WIPING_YOUR_DEVICE: {
        defaultMessage:
            'Wiping the device removes all its information. Only wipe your device if you have your device if you have your recovery seed at hand or there are no funds stored on this device.',
        id: 'TR_WIPING_YOUR_DEVICE',
    },
    TR_WORDS: {
        defaultMessage: '{count} words',
        description: 'Number of words. For example: 12 words',
        id: 'TR_WORDS',
    },
    TR_XRP_DESTINATION_TAG: {
        defaultMessage: 'Destination tag',
        id: 'TR_XRP_DESTINATION_TAG',
    },
    TR_XRP_RESERVE_INFO: {
        defaultMessage:
            'Ripple addresses require a minimum balance of {minBalance} XRP to activate and maintain the account. {TR_LEARN_MORE}',
        id: 'TR_XRP_RESERVE_INFO',
    },
    // TR_XRP_DESTINATION_TAG_EXPLAINED: {
    //         defaultMessage:
    //                 'Destination tag is an arbitrary number which serves as a unique identifier of your transaction. Some services may require this to process your transaction.',
    //         id: 'TR_XRP_DESTINATION_TAG_EXPLAINED',
    // },
    TR_YOU_WERE_DISCONNECTED_DOT: {
        defaultMessage: 'You were disconnected.',
        id: 'TR_YOU_WERE_DISCONNECTED_DOT',
    },
    TR_YOUR_CURRENT_FIRMWARE: {
        defaultMessage: 'Your current firmware version is {version}',
        id: 'TR_YOUR_CURRENT_FIRMWARE',
    },
    TR_YOUR_CURRENT_VERSION: {
        defaultMessage: 'Your current Suite version is 1.2.0',
        id: 'TR_YOUR_CURRENT_VERSION',
    },
    TR_YOUR_TREZOR_IS_NOT_BACKED_UP: {
        defaultMessage: 'Your Trezor is not backed up.',
        id: 'TR_YOUR_TREZOR_IS_NOT_BACKED_UP',
    },
    TR_YOUR_WALLET_IS_READY_WHAT: {
        defaultMessage: 'Your Wallet is ready. What to do now?',
        id: 'TR_YOUR_WALLET_IS_READY_WHAT',
    },
    TR_MODAL_CONFIRM_TX_TITLE: {
        id: 'TR_MODAL_CONFIRM_TX_TITLE',
        defaultMessage: 'Confirm transaction',
    },
    TR_MODAL_CONFIRM_TX_BUTTON: {
        id: 'TR_MODAL_CONFIRM_TX_BUTTON',
        defaultMessage: 'Confirm transaction',
    },
    TR_ADDRESS_FROM: {
        id: 'TR_ADDRESS_FROM',
        defaultMessage: 'From',
    },
    TR_EDIT: {
        id: 'TR_EDIT',
        defaultMessage: 'Edit',
    },
    TR_GAS_PRICE: {
        id: 'TR_GAS_PRICE',
        defaultMessage: 'Gas price',
    },
    TR_SEND_REVIEW_TRANSACTION: {
        id: 'TR_SEND_REVIEW_TRANSACTION',
        defaultMessage: 'Review Transaction',
    },
    TR_TO: {
        id: 'TR_TO',
        defaultMessage: 'To',
    },
    TR_RECIPIENT_ADDRESS_TOOLTIP: {
        id: 'TR_RECIPIENT_ADDRESS_TOOLTIP',
        defaultMessage: 'TR_RECIPIENT_ADDRESS_TOOLTIP',
    },
    TR_SEND_DATA_TOOLTIP: {
        id: 'TR_SEND_DATA_TOOLTIP',
        defaultMessage: 'TR_SEND_DATA_TOOLTIP',
    },
    TR_SEND_GAS_LIMIT_TOOLTIP: {
        id: 'TR_SEND_GAS_LIMIT_TOOLTIP',
        defaultMessage: 'TR_SEND_GAS_LIMIT_TOOLTIP',
    },
    TR_SEND_GAS_PRICE_TOOLTIP: {
        id: 'TR_SEND_GAS_PRICE_TOOLTIP',
        defaultMessage: 'TR_SEND_GAS_PRICE_TOOLTIP',
    },
    TR_XRP_DESTINATION_TAG_TOOLTIP: {
        id: 'TR_XRP_DESTINATION_TAG_TOOLTIP',
        defaultMessage: 'TR_XRP_DESTINATION_TAG_TOOLTIP',
    },
    TR_SEND_FEE_TOOLTIP: {
        id: 'TR_SEND_FEE_TOOLTIP',
        defaultMessage: 'TR_SEND_FEE_TOOLTIP',
    },
    TR_SEND_AMOUNT_TOOLTIP: {
        id: 'TR_SEND_AMOUNT_TOOLTIP',
        defaultMessage: 'TR_SEND_AMOUNT_TOOLTIP',
    },
    TR_PIN_MISMATCH_HEADING: {
        id: 'TR_PIN_MISMATCH_HEADING',
        defaultMessage: 'Pin mismatch',
    },
    TR_PIN_MISMATCH_TEXT: {
        id: 'TR_PIN_MISMATCH_TEXT',
        defaultMessage: 'Pin mismatch text',
    },
    TR_SHOW_LOG: {
        id: 'TR_SHOW_LOG',
        defaultMessage: 'Show log',
    },
    TR_ACCOUNT_DETAILS_HEADER: {
        id: 'TR_ACCOUNT_DETAILS_HEADER',
        defaultMessage: 'Account Details',
    },
    TR_ACCOUNT_DETAILS_TYPE_HEADER: {
        id: 'TR_ACCOUNT_DETAILS_TYPE_HEADER',
        defaultMessage: 'Account type',
    },
    TR_ACCOUNT_DETAILS_TYPE_BECH32: {
        id: 'TR_ACCOUNT_DETAILS_TYPE_BECH32',
        defaultMessage:
            'Bech32 uses the most modern addresses for smallest transaction fees. Be aware that it may not be compatible with old bitcoin services.',
    },
    TR_ACCOUNT_DETAILS_TYPE_P2SH: {
        id: 'TR_ACCOUNT_DETAILS_TYPE_P2SH',
        defaultMessage:
            'Pay to script hash (P2SH) is an advanced type of transaction used in Bitcoin and other similar crypto currencies. Unlike P2PKH, it allows sender to commit funds to a hash of an arbitrary valid script.',
    },
    TR_ACCOUNT_DETAILS_TYPE_P2PKH: {
        id: 'TR_ACCOUNT_DETAILS_TYPE_P2PKH',
        defaultMessage:
            'Legacy Pay-to-Public-Key-Hash (P2PKH) is the basic type of transaction used in Bitcoin and other similar crypto currencies.',
    },
    TR_ACCOUNT_DETAILS_XPUB_HEADER: {
        id: 'TR_ACCOUNT_DETAILS_XPUB_HEADER',
        defaultMessage: 'Public key (XPUB)',
    },
    TR_ACCOUNT_DETAILS_XPUB: {
        id: 'TR_ACCOUNT_DETAILS_XPUB',
        defaultMessage:
            'Be careful with your account public key (XPUB). When you expose your public key to a third party, you allow them to see your entire transaction history.',
    },
    TR_ACCOUNT_DETAILS_XPUB_BUTTON: {
        id: 'TR_ACCOUNT_DETAILS_XPUB_BUTTON',
        defaultMessage: 'Show public key',
    },
    TR_ACCOUNT_TYPE_NORMAL: {
        id: 'TR_ACCOUNT_TYPE_NORMAL',
        defaultMessage: 'Normal',
    },
    TR_ACCOUNT_TYPE_SEGWIT: {
        id: 'TR_ACCOUNT_TYPE_SEGWIT',
        defaultMessage: 'SegWit',
    },
    TR_ACCOUNT_TYPE_LEGACY: {
        id: 'TR_ACCOUNT_TYPE_LEGACY',
        defaultMessage: 'Legacy',
    },
    TR_ACCOUNT_TYPE_BECH32: {
        id: 'TR_ACCOUNT_TYPE_BECH32',
        defaultMessage: 'Bech32',
    },
    TR_ACCOUNT_TYPE_P2SH: {
        id: 'TR_ACCOUNT_TYPE_P2SH',
        defaultMessage: 'P2SH',
    },
    TR_ACCOUNT_TYPE_P2PKH: {
        id: 'TR_ACCOUNT_TYPE_P2PKH',
        defaultMessage: 'P2PKH',
    },
    TOAST_ACQUIRE_ERROR: {
        id: 'TOAST_ACQUIRE_ERROR',
        defaultMessage: 'Acquire error {error}',
    },
    TOAST_AUTH_FAILED: {
        id: 'TOAST_AUTH_FAILED',
        defaultMessage: 'Authorization error: {error}',
    },
    TOAST_AUTH_CONFIRM_ERROR: {
        id: 'TOAST_AUTH_CONFIRM_ERROR',
        defaultMessage: 'Passphrase confirmation error: {error}',
    },
    TOAST_AUTH_CONFIRM_ERROR_DEFAULT: {
        id: 'TOAST_AUTH_CONFIRM_ERROR_DEFAULT',
        defaultMessage: 'Invalid passphrase',
    },
    TOAST_DISCOVERY_ERROR: {
        id: 'TOAST_DISCOVERY_ERROR',
        defaultMessage: 'Account discovery error {error}',
    },
    TOAST_BACKUP_FAILED: {
        id: 'TOAST_BACKUP_FAILED',
        defaultMessage: 'Backup failed',
    },
    TOAST_BACKUP_SUCCESS: {
        id: 'TOAST_BACKUP_SUCCESS',
        defaultMessage: 'Backup success',
    },
    TOAST_SETTINGS_APPLIED: {
        id: 'TOAST_SETTINGS_APPLIED',
        defaultMessage: 'Settings applied',
    },
    TOAST_PIN_CHANGED: {
        id: 'TOAST_PIN_CHANGED',
        defaultMessage: 'Pin changed',
    },
    TOAST_DEVICE_WIPED: {
        id: 'TOAST_DEVICE_WIPED',
        defaultMessage: 'Device wiped',
    },
    TOAST_COPY_TO_CLIPBOARD: {
        id: 'TOAST_COPY_TO_CLIPBOARD',
        defaultMessage: 'Copied to clipboard',
    },
    TOAST_TX_SENT: {
        id: 'TOAST_TX_SENT',
        defaultMessage: '{amount} sent from {account}',
    },
    TOAST_TX_RECEIVED: {
        id: 'TOAST_TX_RECEIVED',
        defaultMessage: '{amount} received on {account}',
    },
    TOAST_TX_CONFIRMED: {
        id: 'TOAST_TX_CONFIRMED',
        defaultMessage: 'Transaction {amount} on {account} successfully confirmed',
    },
    TOAST_TX_BUTTON: {
        id: 'TOAST_TX_BUTTON',
        defaultMessage: 'View details',
    },
    TOAST_SIGN_TX_ERROR: {
        id: 'TOAST_SIGN_TX_ERROR',
        defaultMessage: 'Sign transaction error: {error}',
    },
    TOAST_VERIFY_ADDRESS_ERROR: {
        id: 'TOAST_VERIFY_ADDRESS_ERROR',
        defaultMessage: 'Verify address error: {error}',
    },
    TOAST_SIGN_MESSAGE_ERROR: {
        id: 'TOAST_SIGN_MESSAGE_ERROR',
        defaultMessage: 'Sign message error: {error}',
    },
    TOAST_VERIFY_MESSAGE_ERROR: {
        id: 'TOAST_VERIFY_MESSAGE_ERROR',
        defaultMessage: 'Verify message error: {error}',
    },
    TOAST_GENERIC_ERROR: {
        id: 'TOAST_GENERIC_ERROR',
        defaultMessage: 'Error: {error}',
    },
    TR_RECIPIENT: {
        id: 'TR_RECIPIENT',
        defaultMessage: 'Recipient',
    },
    TR_SCAN: {
        id: 'TR_SCAN',
        defaultMessage: 'Scan',
    },
    TR_REMOVE: {
        id: 'TR_REMOVE',
        defaultMessage: 'Remove',
    },
    LOCKTIME_TITLE: {
        id: 'LOCKTIME_TITLE',
        defaultMessage: 'Add Locktime',
    },
    LOCKTIME_DESCRIPTION: {
        id: 'LOCKTIME_DESCRIPTION',
        defaultMessage: 'Allows you to postpone the transaction by set value (time or block)',
    },
    REPLACE_BY_FEE_TITLE: {
        id: 'REPLACE_BY_FEE_TITLE',
        defaultMessage: 'Replace by fee (RBF)',
    },
    REPLACE_BY_FEE_DESCRIPTION: {
        id: 'REPLACE_BY_FEE_DESCRIPTION',
        defaultMessage:
            'RBF allows to bump fee later in case you want the transaction to be mined faster',
    },
    REFRESH: {
        id: 'REFRESH',
        defaultMessage: 'Refresh',
    },
    NOTIFICATIONS_TITLE: {
        id: 'NOTIFICATIONS_TITLE',
        defaultMessage: 'Notifications',
    },
    NOTIFICATIONS_EMPTY_TITLE: {
        id: 'NOTIFICATIONS_EMPTY_TITLE',
        defaultMessage: 'No notifications to show',
    },
    NOTIFICATIONS_EMPTY_DESC: {
        id: 'NOTIFICATIONS_EMPTY_DESC',
        defaultMessage:
            'Here you will see all important notifications once they happen. For now, there’s nothing to see.',
    },
    LABELING_ACCOUNT: {
        id: 'LABELING_ACCOUNT',
        defaultMessage: 'Account #{index}',
    },
    LABELING_ACCOUNT_WITH_TYPE: {
        id: 'LABELING_ACCOUNT_WITH_TYPE',
        defaultMessage: 'Account #{index} ({type})',
    },
    TR_DISCREET_TOOLTIP: {
        id: 'TR_DISCREET_TOOLTIP',
        defaultMessage: '[FIX THIS TEXT] This is a descreeeet mode',
    },
    TX_CONFIRMATIONS_EXPLAIN: {
        id: 'TX_CONFIRMATIONS_EXPLAIN',
        defaultMessage: 'TODO TODO TODO ExPlAnAtIoN',
    },
    TR_LAST_UPDATE: {
        id: 'TR_LAST_UPDATE',
        defaultMessage: 'Last update: {value}',
    },
    TR_LIVE: {
        id: 'TR_LIVE',
        defaultMessage: 'Live',
    },
    TR_NUMBER_OF_TRANSACTIONS: {
        id: 'TR_NUMBER_OF_TRANSACTIONS',
        defaultMessage: 'Number of transactions',
    },
    TR_N_TRANSACTIONS: {
        id: 'TR_N_TRANSACTIONS',
        defaultMessage: '{value} {value, plural, one {transaction} other {transactions}}',
    },
    TR_TREZOR_BRIDGE_DOWNLOAD: {
        id: 'TR_TREZOR_BRIDGE_DOWNLOAD',
        defaultMessage: 'Trezor Bridge Download',
    },
    TR_CURRENTLY_INSTALLED_TREZOR: {
        id: 'TR_CURRENTLY_INSTALLED_TREZOR',
        defaultMessage: 'Currently installed: Trezor Bridge {version}',
    },
    EVENT_DEVICE_CONNECT: {
        id: 'EVENT_DEVICE_CONNECT',
        defaultMessage: 'Device {label} connected',
    },
    EVENT_DEVICE_CONNECT_UNACQUIRED: {
        id: 'EVENT_DEVICE_CONNECT_UNACQUIRED',
        defaultMessage: '{label} connected',
    },
    EVENT_WALLET_CREATED: {
        id: 'EVENT_WALLET_CREATED',
        defaultMessage: '{walletLabel} created',
    },
    TR_WIPE_DEVICE_HEADING: {
        id: 'TR_WIPE_DEVICE_HEADING',
        defaultMessage: 'Before you wipe your device…',
    },
    TR_WIPE_DEVICE_TEXT: {
        id: 'TR_WIPE_DEVICE_TEXT',
        defaultMessage:
            'Wiping the device removes all its content. Only wipe your device if you have your recovery seed with you or when there are no assets on the device.',
    },
    TR_WIPE_DEVICE_CHECKBOX_1_TITLE: {
        id: 'TR_WIPE_DEVICE_CHECKBOX_1_TITLE',
        defaultMessage: 'I understand this action deletes all data on the device',
    },
    TR_WIPE_DEVICE_CHECKBOX_1_DESCRIPTION: {
        id: 'TR_WIPE_DEVICE_CHECKBOX_1_DESCRIPTION',
        defaultMessage:
            'Device will be completely wiped. All data and history will be deleted. You will need a recovery seed to recover your wallet.',
    },
    TR_WIPE_DEVICE_CHECKBOX_2_TITLE: {
        id: 'TR_WIPE_DEVICE_CHECKBOX_2_TITLE',
        defaultMessage: 'I understand this action does not affect my funds',
    },
    TR_WIPE_DEVICE_CHECKBOX_2_DESCRIPTION: {
        id: 'TR_WIPE_DEVICE_CHECKBOX_2_DESCRIPTION',
        defaultMessage:
            'Your assets are safe only if you have created a recovery seed. Make sure you have your seed or you know where you keep it.',
    },
    TR_CANCEL: {
        id: 'TR_CANCEL',
        defaultMessage: 'Cancel',
    },
    TR_SEND_DATA: {
        id: 'TR_SEND_DATA',
        defaultMessage: 'Data',
    },
    TR_FOLLOW_INSTRUCTIONS_ON_DEVICE: {
        id: 'TR_FOLLOW_INSTRUCTIONS_ON_DEVICE',
        defaultMessage: 'Follow instructions on your device',
    },
    TR_ADVANCED_RECOVERY_TEXT: {
        id: 'TR_ADVANCED_RECOVERY_TEXT',
        defaultMessage:
            'Words need to be entered according to the matrix on device but clicking on buttons below.',
    },
    TR_ADVANCED_RECOVERY_NOT_SURE: {
        id: 'TR_ADVANCED_RECOVERY_NOT_SURE',
        defaultMessage: 'Not sure how advanced method works?',
    },
    TR_CHECK_RECOVERY_SEED_DESC_T1: {
        id: 'TR_CHECK_RECOVERY_SEED_DESC_T1',
        defaultMessage:
            'Your wallet backup, the recovery seed, is entered on your computer (host) and your device shows which word to type. You will also be asked to enter words not in your seed, that is a security meassure to ensure nobody can read what key is being pressed.',
    },
    TR_SELECT_NUMBER_OF_WORDS: {
        id: 'TR_SELECT_NUMBER_OF_WORDS',
        defaultMessage: 'Select number of words in your seed.',
    },
    TR_YOU_EITHER_HAVE_T1: {
        id: 'TR_YOU_EITHER_HAVE_T1',
        defaultMessage: 'You either have a seed containing 12, 18 or 24 words. ',
    },
    TR_YOU_EITHER_HAVE_T2: {
        id: 'TR_YOU_EITHER_HAVE_T2',
        defaultMessage: 'You either have a seed containing 12, 18, 20, 24, 33 words. ',
    },
    TR_ENTER_ALL_WORDS_IN_CORRECT: {
        id: 'TR_ENTER_ALL_WORDS_IN_CORRECT',
        defaultMessage: 'Enter all words in the correct order',
    },
    TR_ON_YOUR_COMPUTER_ENTER: {
        id: 'TR_ON_YOUR_COMPUTER_ENTER',
        defaultMessage:
            'On your computer enter each word carefully according to the order showed on device.',
    },
    TR_CHECK_RECOVERY_SEED_DESC_T2: {
        id: 'TR_CHECK_RECOVERY_SEED_DESC_T2',
        defaultMessage:
            'Your wallet backup, the recovery seed, is entered entirely on the Trezor Model T, through the device screen. We avoid passing any of your sensitive information to a potentially insecure computer or web browser.',
    },
    TR_USING_TOUCHSCREEN: {
        id: 'TR_USING_TOUCHSCREEN',
        defaultMessage:
            'Using the touchscreen display you enter all the words in the correct order until completed.',
    },
    TR_CHOSE_RECOVERY_TYPE: {
        id: 'TR_CHOSE_RECOVERY_TYPE',
        defaultMessage: 'Chose recovery type',
    },
    TR_ALL_THE_WORDS: {
        id: 'TR_ALL_THE_WORDS',
        defaultMessage:
            'All the words are entered only on the device as a extra security feature. Please enter all the words in the correct order carefully.',
    },
    TR_SEED_CHECK_SUCCESS_TITLE: {
        id: 'TR_SEED_CHECK_SUCCESS_TITLE',
        defaultMessage: 'Backup seed successfully checked!',
    },
    TR_SEED_CHECK_SUCCESS_DESC: {
        id: 'TR_SEED_CHECK_SUCCESS_DESC',
        defaultMessage:
            'Your seed is valid and has just been successfully checked. Please take great care of it and/or hide it back where you are goint to find it.',
    },
    TR_SEED_CHECK_FAIL_TITLE: {
        id: 'TR_SEED_CHECK_FAIL_TITLE',
        defaultMessage: 'Seed check failed',
    },
    TR_WORD_DOES_NOT_EXIST: {
        id: 'TR_WORD_DOES_NOT_EXIST',
        defaultMessage: 'Word "{word}" does not exist in bip39 word list.',
        description:
            'In recovery or dry run, appears when user types a string that is not a substring of any word included in bip39 word list.',
    },
    TR_BACKSPACE: {
        id: 'TR_BACKSPACE',
        defaultMessage: 'Backspace',
        description: 'Keyboard key',
    },
    TR_DRY_RUN_CHECK_ITEM_TITLE: {
        id: 'TR_DRY_RUN_CHECK_ITEM_TITLE',
        defaultMessage: 'I understand this is only check and it won’t affect my seed',
    },
    TR_DRY_RUN_CHECK_ITEM_DESCRIPTION: {
        id: 'TR_DRY_RUN_CHECK_ITEM_DESCRIPTION',
        defaultMessage:
            'To learn more about why and how to do a backup seed, please visit our blog post where we explain the process.',
    },
    TR_WHAT_IS_DRY_RUN: {
        id: 'TR_WHAT_IS_DRY_RUN',
        defaultMessage: 'what is dry run',
    },
    TR_ACCOUNT_TYPE: {
        id: 'TR_ACCOUNT_TYPE',
        defaultMessage: 'Account Type',
    },
    TR_CRYPTOCURRENCY: {
        id: 'TR_CRYPTOCURRENCY',
        defaultMessage: 'Cryptocurrency',
    },
    TR_COIN_SETTINGS: {
        id: 'TR_COIN_SETTINGS',
        defaultMessage: 'Coin settings',
    },
    FW_CAPABILITY_NO_CAPABILITY: {
        id: 'FW_CAPABILITY_NO_CAPABILITY',
        defaultMessage: 'Not supported',
        description: 'Firmware with missing capability (eg: LTC on Bitcoin-only FW, XRP on T1...)',
    },
    FW_CAPABILITY_NO_CAPABILITY_DESC: {
        id: 'FW_CAPABILITY_NO_CAPABILITY_DESC',
        defaultMessage: 'Firmware does not have capability to work with {networkName}',
    },
    FW_CAPABILITY_NO_SUPPORT: {
        id: 'FW_CAPABILITY_NO_SUPPORT',
        defaultMessage: 'Not supported',
        description:
            'Similar to missing capability but tested on different level (coin info is missing in trezor-connect)',
    },
    FW_CAPABILITY_UPDATE_REQUIRED: {
        id: 'FW_CAPABILITY_UPDATE_REQUIRED',
        defaultMessage: 'Update required',
        description: 'Firmware is too OLD use this coin',
    },
    FW_CAPABILITY_UPDATE_REQUIRED_DESC: {
        id: 'FW_CAPABILITY_UPDATE_REQUIRED_DESC',
        defaultMessage: 'Firmware needs to be updated to work with {networkName}',
    },
    FW_CAPABILITY_CONNECT_OUTDATED: {
        id: 'FW_CAPABILITY_CONNECT_OUTDATED',
        defaultMessage: 'Application update required',
        description: 'Firmware is too NEW use this coin (trezor-connect is outdated)',
    },
    MODAL_ADD_ACCOUNT_TITLE: {
        id: 'MODAL_ADD_ACCOUNT_TITLE',
        defaultMessage: 'Add new account',
    },
    MODAL_ADD_ACCOUNT_DESC: {
        id: 'MODAL_ADD_ACCOUNT_DESC',
        defaultMessage:
            'Explanation how account works and some other info that is useful for a new user and does not annoy hard core user.',
    },
    MODAL_ADD_ACCOUNT_NETWORK_MAINNET: {
        id: 'MODAL_ADD_ACCOUNT_NETWORK_MAINNET',
        defaultMessage: 'Main networks',
    },
    MODAL_ADD_ACCOUNT_NETWORK_TESTNET: {
        id: 'MODAL_ADD_ACCOUNT_NETWORK_TESTNET',
        defaultMessage: 'Testnet networks',
    },
    MODAL_ADD_ACCOUNT_NETWORK_EXTERNAL: {
        id: 'MODAL_ADD_ACCOUNT_NETWORK_EXTERNAL',
        defaultMessage: 'External networks',
    },
    MODAL_ADD_ACCOUNT_NEM_WALLET: {
        id: 'MODAL_ADD_ACCOUNT_NEM_WALLET',
        defaultMessage: 'NEM wallet',
    },
    MODAL_ADD_ACCOUNT_STELLAR_WALLET: {
        id: 'MODAL_ADD_ACCOUNT_STELLAR_WALLET',
        defaultMessage: 'Stellar wallet',
    },
    MODAL_ADD_ACCOUNT_CARDANO_WALLET: {
        id: 'MODAL_ADD_ACCOUNT_CARDANO_WALLET',
        defaultMessage: 'Cardano wallet',
    },
    MODAL_ADD_ACCOUNT_TEZOS_WALLET: {
        id: 'MODAL_ADD_ACCOUNT_TEZOS_WALLET',
        defaultMessage: 'Tezos wallet',
    },
    MODAL_ADD_ACCOUNT_NETWORK_EXTERNAL_DESC: {
        id: 'MODAL_ADD_ACCOUNT_NETWORK_EXTERNAL_DESC',
        defaultMessage:
            'This coin is only accessible via an external wallet. It is supported by Trezor but not by Trezor Suite app.',
    },
    MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY: {
        id: 'MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY',
        defaultMessage: 'Previous account is empty',
    },
    MODAL_ADD_ACCOUNT_LIMIT_EXCEEDED: {
        id: 'MODAL_ADD_ACCOUNT_LIMIT_EXCEEDED',
        defaultMessage: 'Account index is greater than 10',
    },
    TR_SELECT_MODEL: {
        id: 'TR_SELECT_MODEL',
        defaultMessage: 'Select {model}',
        descrition: '{model} is translation -eiter TR_MODEL_T or TR_MODEL_ONE',
    },
    TR_MODELS_DESC: {
        id: 'TR_MODELS_DESC',
        defaultMessage:
            'Trezor One features two buttons and a monochromatic screen, Trezor T is the high-end model featuring touch-screen display.',
    },
    TR_INSTALL_BTC_ONLY: {
        id: 'TR_INSTALL_BTC_ONLY',
        defaultMessage: 'Install bitcoin-only firmware',
    },
    TR_INSTALL_FULL: {
        id: 'TR_INSTALL_FULL',
        defaultMessage: 'Install full-featured firmware',
    },
    TR_DEVICE_IN_RECOVERY_MODE: {
        id: 'TR_DEVICE_IN_RECOVERY_MODE',
        defaultMessage: 'Your device is in recovery mode.',
    },
    TR_SUITE_STORAGE: {
        id: 'TR_SUITE_STORAGE',
        defaultMessage: 'Suite Storage',
    },
    TR_CLEAR_STORAGE: {
        id: 'TR_CLEAR_STORAGE',
        defaultMessage: 'Clear storage',
    },
    TR_STORAGE_CLEARED: {
        id: 'TR_STORAGE_CLEARED',
        defaultMessage: 'Storage cleared!',
    },
    TR_CLEAR_STORAGE_DESCRIPTION: {
        id: 'TR_CLEAR_STORAGE_DESCRIPTION',
        defaultMessage:
            'If you are experiencing problems, clearing the storage is a good first step to try to resolve the issue. During this process the app will restart itself.',
    },
    TR_CHOOSE_WALLET: {
        id: 'TR_CHOOSE_WALLET',
        defaultMessage: 'Choose wallet',
    },
    TR_TO_ACCESS_OTHER_WALLETS: {
        id: 'TR_TO_ACCESS_OTHER_WALLETS',
        defaultMessage: 'To access other wallets please connect your device.',
    },
    TR_EJECT_HEADING: {
        id: 'TR_EJECT_HEADING',
        defaultMessage: 'Eject',
        description: 'Heading above col with "eject wallet" buttons in switch wallets modal',
    },
    TR_REMEMBER_HEADING: {
        id: 'TR_REMEMBER_HEADING',
        defaultMessage: 'Remember',
        description: 'Heading above col with "remember wallet" buttons in switch wallets modal',
    },
    TR_SKIP_ONBOARDING: {
        id: 'TR_SKIP_ONBOARDING',
        defaultMessage: 'Skip onboarding',
    },
    TR_MY_DEVICE_IS_INITIALIZED: {
        id: 'TR_MY_DEVICE_IS_INITIALIZED',
        defaultMessage: 'My device is initialized and I used Wallet or Suite before',
    },
    TR_I_HAVE_INITIALIZED_DEVICE: {
        id: 'TR_I_HAVE_INITIALIZED_DEVICE',
        defaultMessage: 'I have initialized device',
    },
    TR_BEGIN_ONBOARDING: {
        id: 'TR_BEGIN_ONBOARDING',
        defaultMessage: 'Begin onboarding',
    },
    TR_I_WANT_TO_BE_GUIDED_THROUGH: {
        id: 'TR_I_WANT_TO_BE_GUIDED_THROUGH',
        defaultMessage: 'I want to be guided through onboarding process',
    },
    TR_IM_NEW_TO_ALL_THIS: {
        id: 'TR_IM_NEW_TO_ALL_THIS',
        defaultMessage: "I'm new to all this",
    },
    RECEIVE_TITLE: {
        id: 'RECEIVE_TITLE',
        defaultMessage: 'Receive {symbol}',
    },
    RECEIVE_DESC_BITCOIN: {
        id: 'RECEIVE_DESC_BITCOIN',
        defaultMessage:
            'To receive any funds you need to get a fresh receive address. It is advised to always use a fresh one as this prevents anyone else to track your transactions. You can reuse an address but we recommend not doing it unless it is necessary.',
    },
    RECEIVE_DESC_ETHEREUM: {
        id: 'RECEIVE_DESC_ETHEREUM',
        defaultMessage: 'Use this address to receive tokens as well.',
    },
    RECEIVE_ADDRESS_FRESH: {
        id: 'RECEIVE_ADDRESS_FRESH',
        defaultMessage: 'Fresh address',
    },
    RECEIVE_ADDRESS: {
        id: 'RECEIVE_ADDRESS',
        defaultMessage: 'Fresh address',
        description: 'Alternative title for alt-coins',
    },
    RECEIVE_ADDRESS_REVEAL: {
        id: 'RECEIVE_ADDRESS_REVEAL',
        defaultMessage: 'Reveal full address',
    },
    RECEIVE_ADDRESS_LIMIT_EXCEEDED: {
        id: 'RECEIVE_ADDRESS_LIMIT_EXCEEDED',
        defaultMessage: 'Limit exceeded...',
    },
    RECEIVE_TABLE_PATH: {
        id: 'RECEIVE_TABLE_PATH',
        defaultMessage: 'Path',
    },
    RECEIVE_TABLE_ADDRESS: {
        id: 'RECEIVE_TABLE_ADDRESS',
        defaultMessage: 'Address',
    },
    RECEIVE_TABLE_RECEIVED: {
        id: 'RECEIVE_TABLE_RECEIVED',
        defaultMessage: 'Total received',
    },
    RECEIVE_TABLE_NOT_USED: {
        id: 'RECEIVE_TABLE_NOT_USED',
        defaultMessage: 'Not used yet',
    },
    TR_SHOW_MORE: {
        defaultMessage: 'Show more',
        description: 'Show more used address',
        id: 'TR_SHOW_MORE',
    },
    TR_SHOW_LESS: {
        defaultMessage: 'Show less',
        description: 'Show less used address',
        id: 'TR_SHOW_LESS',
    },
} as const);

export default definedMessages;
