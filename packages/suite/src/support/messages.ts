import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_3RD_PARTY_WALLETS: {
        defaultMessage: '3rd party wallets',
        id: 'TR_3RD_PARTY_WALLETS',
    },
    TR_3RD_PARTY_WALLETS_DESC: {
        defaultMessage:
            'These coins are supported by Trezor but only in 3rd party wallets. These coins cannot be managed by Trezor Suite or Wallet.',
        id: 'TR_3RD_PARTY_WALLETS_DESC',
    },
    TR_ACCOUNT_DOES_NOT_EXIST: {
        defaultMessage: 'Account does not exist',
        id: 'TR_ACCOUNT_DOES_NOT_EXIST',
    },
    TR_ACCOUNT_HASH: {
        defaultMessage: 'Account #{number}',
        description: 'Used in auto-generated account label',
        id: 'TR_ACCOUNT_HASH',
    },
    TR_ACQUIRE_DEVICE: {
        defaultMessage: 'Acquire device',
        description:
            'call-to-action to use device in current window when it is used in other window',
        id: 'TR_ACQUIRE_DEVICE',
    },
    TR_ACTIVATE_ALL: {
        defaultMessage: 'Activate all',
        id: 'TR_ACTIVATE_ALL',
    },
    TR_ADD_ACCOUNT: {
        defaultMessage: 'Add account',
        id: 'TR_ADD_ACCOUNT',
    },
    TR_ADD_FRESH_ADDRESS: {
        defaultMessage: 'Add fresh address',
        id: 'TR_ADD_FRESH_ADDRESS',
    },
    TR_ADD_HIDDEN_WALLET: {
        defaultMessage: 'Add hidden wallet',
        id: 'TR_ADD_HIDDEN_WALLET',
    },
    TR_ADD_MORE_COINS: {
        defaultMessage: 'Add more coins',
        id: 'TR_ADD_MORE_COINS',
    },
    TR_ADD_NEW_ACCOUNT: {
        defaultMessage: 'Add new account',
        id: 'TR_ADD_NEW_ACCOUNT',
    },
    TR_ADD_RECIPIENT: {
        defaultMessage: 'Add recipient',
        id: 'TR_ADD_RECIPIENT',
    },
    TR_ADDITIONAL_SECURITY_FEATURES: {
        defaultMessage: 'Additional security features are waiting to be done.',
        id: 'TR_ADDITIONAL_SECURITY_FEATURES',
    },
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
    TR_ADVANCED_RECOVERY_OPTION: {
        defaultMessage: 'Advanced recovery (5 minutes)',
        description: 'Button for selecting advanced recovery option',
        id: 'TR_ADVANCED_RECOVERY_OPTION',
    },
    TR_ADVANCED_SETTINGS: {
        defaultMessage: 'Advanced settings',
        description: 'Shows advanced sending form',
        id: 'TR_ADVANCED_SETTINGS',
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
    TR_AND: {
        defaultMessage: 'and',
        id: 'TR_AND',
    },
    TR_ANOTHER_CABLE_INSTRUCTION: {
        defaultMessage: 'Try using another cable',
        description: 'Troubleshooting instruction',
        id: 'TR_ANOTHER_CABLE_INSTRUCTION',
    },
    TR_ASKED_ENTER_YOUR_PASSPHRASE_TO_UNLOCK: {
        defaultMessage: 'You will be asked to enter your passphrase to unlock your hidden wallet.',
        id: 'TR_ASKED_ENTER_YOUR_PASSPHRASE_TO_UNLOCK',
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
    TR_AUTH_CONFIRM_FAILED_MESSAGE: {
        defaultMessage:
            'Passphrase entered on the first step does not match with passphrase confirmation.',
        id: 'TR_AUTH_CONFIRM_FAILED_MESSAGE',
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
            'Your {TR_SEED_MANUAL_LINK} is the backup key to all your cryptocurrencies and applications.',
        description: 'Explanation what recovery seed is',
        id: 'TR_BACKUP_SUBHEADING_1',
    },
    TR_BACKUP_SUBHEADING_2: {
        defaultMessage:
            'Your recovery seed can only be displayed once. Never make a digital copy of your recovery seed and never upload it online. Keep your recovery seed in a safe place.',
        description: 'Explanation what recovery seed is',
        id: 'TR_BACKUP_SUBHEADING_2',
    },
    TR_BALANCE: {
        defaultMessage: 'Balance',
        id: 'TR_BALANCE',
    },
    TR_BASIC_RECOVERY_OPTION: {
        defaultMessage: 'Basic recovery (2 minutes)',
        description: 'Button for selecting basic recovery option',
        id: 'TR_BASIC_RECOVERY_OPTION',
    },
    TR_BOOKMARK_HEADING: {
        defaultMessage: 'Browser bookmark',
        description: 'Heading in bookmark step',
        id: 'TR_BOOKMARK_HEADING',
    },
    TR_BOOKMARK_SUBHEADING: {
        defaultMessage:
            'Protect yourself against {TR_PHISHING_ATTACKS}. Bookmark Trezor Wallet (wallet.trezor.io) to avoid visiting fake sites.',
        description: 'Heading in bookmark step',
        id: 'TR_BOOKMARK_SUBHEADING',
    },
    TR_BRIDGE_SUBHEADING: {
        defaultMessage:
            'Trezor Bridge is a communication tool to facilitate the connection between your Trezor and your internet browser.',
        description: 'Description what Trezor Bridge is',
        id: 'TR_BRIDGE_SUBHEADING',
    },
    TR_BTC: {
        defaultMessage: 'Transfer cost in XRP drops',
        id: 'TR_XRP_TRANSFER_COST',
    },
    TR_BUY: {
        defaultMessage: 'Buy',
        id: 'TR_BUY',
    },
    TR_CALCULATING_DOT_DOT: {
        defaultMessage: 'Calculating...',
        description:
            'Used when calculating gas limit based on data input in ethereum advanced send form',
        id: 'TR_CALCULATING_DOT_DOT',
    },
    TR_CAMERA_NOT_RECOGNIZED: {
        defaultMessage: 'The camera was not recognized.',
        id: 'TR_CAMERA_NOT_RECOGNIZED',
    },
    TR_CAMERA_PERMISSION_DENIED: {
        defaultMessage: 'Permission to access the camera was denied.',
        id: 'TR_CAMERA_PERMISSION_DENIED',
    },
    TR_CANCEL: {
        defaultMessage: 'Cancel',
        id: 'TR_CANCEL',
    },
    TR_CANNOT_SEND_TO_MYSELF: {
        defaultMessage: 'Cannot send to myself',
        id: 'TR_CANNOT_SEND_TO_MYSELF',
    },
    TR_CARDANO_WALLET: {
        defaultMessage: 'Cardano wallet',
        id: 'TR_CARDANO_WALLET',
    },
    TR_CHANGE_PASSPHRASE_SETTINGS_TO_USE: {
        defaultMessage: 'Change passphrase settings to use this device',
        id: 'TR_CHANGE_PASSPHRASE_SETTINGS_TO_USE',
    },
    TR_CHANGE_WALLET_TYPE_FOR: {
        defaultMessage: 'Change wallet type for {deviceLabel}',
        id: 'TR_CHANGE_WALLET_TYPE_FOR',
    },
    TR_CHANGELOG: {
        defaultMessage: 'Changelog',
        description: 'Part of the sentence: Learn more about latest version in {TR_CHANGELOG}.',
        id: 'TR_CHANGELOG',
    },
    TR_CHECK_ADDRESS_ON_TREZOR: {
        defaultMessage: 'Check address on Trezor',
        id: 'TR_CHECK_ADDRESS_ON_TREZOR',
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
    TR_CLEAR: {
        defaultMessage: 'Clear',
        description: 'Clear form button',
        id: 'TR_CLEAR',
    },
    TR_CLONE: {
        defaultMessage: 'Clone "{deviceLabel}"?',
        id: 'TR_CLONE',
    },
    TR_CLOSE: {
        defaultMessage: 'Close',
        id: 'TR_CLOSE',
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
    TR_COMPLETE_ACTION_ON_DEVICE: {
        defaultMessage: 'Complete the action on "{deviceLabel}" device',
        id: 'TR_COMPLETE_ACTION_ON_DEVICE',
    },
    TR_CONFIRM_ACTION_ON_YOUR: {
        defaultMessage: 'Confirm action on your "{deviceLabel}" device.',
        id: 'TR_CONFIRM_ACTION_ON_YOUR',
    },
    TR_CONFIRM_ADDRESS_ON_TREZOR: {
        defaultMessage: 'Confirm address on Trezor',
        id: 'TR_CONFIRM_ADDRESS_ON_TREZOR',
    },
    TR_CONFIRM_TRANSACTION_ON: {
        defaultMessage: 'Confirm transaction on "{deviceLabel}" device',
        id: 'TR_CONFIRM_TRANSACTION_ON',
    },
    TR_CONNECT_DROPBOX: {
        defaultMessage: 'Connect Dropbox',
        id: 'TR_CONNECT_DROPBOX',
    },
    TR_CONNECT_TO_BACKEND: {
        defaultMessage: 'Connect',
        id: 'TR_CONNECT_TO_BACKEND',
    },
    TR_CONNECT_TO_DISCOVER: {
        defaultMessage: 'Connect to discover',
        id: 'TR_CONNECT_TO_DISCOVER',
    },
    TR_CONNECT_TREZOR: {
        defaultMessage: 'Connect Trezor to continue...',
        id: 'TR_CONNECT_TREZOR',
    },
    TR_CONNECT_TREZOR_TO_CONTINUE: {
        defaultMessage: 'Connect Trezor to continue',
        id: 'TR_CONNECT_TREZOR_TO_CONTINUE',
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
    TR_CONTACT_TREZOR_SUPPORT_LINK: {
        defaultMessage: 'contact Trezor support.',
        description:
            'Full sentences: If nothing helps, contact Trezor support. See TR_LAST_RESORT_INSTRUCTION',
        id: 'TR_CONTACT_TREZOR_SUPPORT_LINK',
    },
    TR_CONTINUE: {
        defaultMessage: 'Continue',
        description: 'Continue button',
        id: 'TR_CONTINUE',
    },
    TR_CONTINUE_TO_ACCESS_STANDARD_WALLET: {
        defaultMessage: 'Continue to access your standard wallet.',
        id: 'TR_CONTINUE_TO_ACCESS_STANDARD_WALLET',
    },
    TR_CONTRIBUTION: {
        defaultMessage: 'contribution',
        description: 'Part of the sentence: We thank our translators for their contribution',
        id: 'TR_CONTRIBUTION',
    },
    TR_COPIED: {
        defaultMessage: 'Copied!',
        id: 'TR_COPIED',
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
    TR_CREATE_INSTANCE: {
        defaultMessage: 'Create hidden wallet',
        description: 'Create button',
        id: 'TR_CREATE_INSTANCE',
    },
    TR_CREATE_NEW_INSTANCE: {
        defaultMessage: 'Create new instance',
        id: 'TR_CREATE_NEW_INSTANCE',
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
    TR_CUSTOM_FEE_IS_NOT_NUMBER: {
        defaultMessage: 'Fee is not a number',
        id: 'TR_CUSTOM_FEE_IS_NOT_NUMBER',
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
    TR_DASHBOARD: {
        defaultMessage: 'Dashboard',
        description: 'Category in Settings',
        id: 'TR_DASHBOARD',
    },
    TR_DATA: {
        defaultMessage: 'Data',
        id: 'TR_DATA',
    },
    TR_DATA_IS_USUALLY_USED: {
        defaultMessage: 'Data is usually used when you send transactions to contracts.',
        id: 'TR_DATA_IS_USUALLY_USED',
    },
    TR_DEACTIVATE_ALL: {
        defaultMessage: 'Deactivate all',
        id: 'TR_DEACTIVATE_ALL',
    },
    TR_DESTINATION_TAG_IS_NOT_NUMBER: {
        defaultMessage: 'Destination tag is not a number',
        id: 'TR_DESTINATION_TAG_IS_NOT_NUMBER',
    },
    TR_DETAILS_ARE_SHOWN_ON: {
        defaultMessage: 'Details are shown on display',
        id: 'TR_DETAILS_ARE_SHOWN_ON',
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
    TR_DEVICE_IN_BOOTLOADER_MODE_INSTRUCTIONS: {
        defaultMessage:
            'Device is connected in bootloader mode. Plug out the USB cable and connect device again.',
        description: 'Instructions what to do if device is in bootloader mode',
        id: 'TR_DEVICE_IN_BOOTLOADER_MODE_INSTRUCTIONS',
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
    TR_DEVICE_SETTINGS_TITLE: {
        defaultMessage: 'Device Settings',
        id: 'TR_DEVICE_SETTINGS_TITLE',
    },
    TR_DEVICE_USED_IN_OTHER: {
        defaultMessage: 'Device is used in other window',
        id: 'TR_DEVICE_USED_IN_OTHER',
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
    TR_DISCONNECT_DEVICE_HEADER: {
        defaultMessage: 'Disconnect {label} device',
        id: 'TR_DISCONNECT_DEVICE_HEADER',
    },
    TR_DISCONNECT_DEVICE_TEXT: {
        defaultMessage:
            'Your device is wiped and might be safely sold on ebay. No one will ever be able to steal your funds.',
        id: 'TR_DISCONNECT_DEVICE_TEXT',
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
    TR_DO_NOT_SAFE_IN_COMPUTER_INSTRUCTION: {
        defaultMessage: 'Do not write it into a computer',
        description: 'Instruction what user should never do with his seed.',
        id: 'TR_DO_NOT_SAFE_IN_COMPUTER_INSTRUCTION',
    },
    TR_DO_NOT_TAKE_PHOTO_INSTRUCTION: {
        defaultMessage: 'Do not take a photo of your recovery seed',
        description: 'Instruction what user should never do with his seed.',
        id: 'TR_DO_NOT_TAKE_PHOTO_INSTRUCTION',
    },
    TR_DO_NOT_UPLOAD_INSTRUCTION: {
        defaultMessage: 'Do not upload words on the internet',
        description: 'Instruction what user should never do with his seed.',
        id: 'TR_DO_NOT_UPLOAD_INSTRUCTION',
    },
    TR_DOCUMENTATION: {
        defaultMessage: 'documentation',
        description: 'Link to trezor documentation (wiki)',
        id: 'TR_DOCUMENTATION',
    },
    TR_DONT_FORGET: {
        defaultMessage: "Don't forget",
        description: 'Button in remember/forget dialog',
        id: 'TR_DONT_FORGET',
    },
    TR_DONT_HAVE_A_TREZOR: {
        defaultMessage: "Don't have a Trezor? {getOne}",
        id: 'TR_DONT_HAVE_A_TREZOR',
    },
    TR_DONT_UPGRADE_BRIDGE: {
        defaultMessage: "No, I don't want to upgrade Bridge now",
        id: 'TR_DONT_UPGRADE_BRIDGE',
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
    TR_EMAIL_SKIPPED: {
        defaultMessage:
            'You chose not to provide your email. This is Ok. If you want, you might still follow us on socials:',
        description: 'Displayed after user skips contact email',
        id: 'TR_EMAIL_SKIPPED',
    },
    TR_ENABLE_NETWORK_BUTTON: {
        defaultMessage: 'Find my {networkName} accounts',
        id: 'TR_ENABLE_NETWORK_BUTTON',
    },
    TR_ENTER_PASSPHRASE: {
        defaultMessage: 'Enter',
        id: 'TR_ENTER_PASSPHRASE',
    },
    TR_ENTER_PIN: {
        defaultMessage: 'Enter PIN',
        description: 'Button. Submit PIN',
        id: 'TR_ENTER_PIN',
    },
    TR_ENTER_PIN_HEADING: {
        defaultMessage: 'Enter PIN',
        description: '',
        id: 'TR_ENTER_PIN_HEADING',
    },
    TR_ENTER_PIN_TEXT: {
        defaultMessage:
            'Your device gets locked anytime you disconnect it. You now need to enter your PIN to continue.',
        description: '',
        id: 'TR_ENTER_PIN_TEXT',
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
    TR_EXCHANGE_RATES_BY: {
        defaultMessage: 'Exchange rates by {service}',
        id: 'TR_EXCHANGE_RATES_BY',
    },
    TR_FEE: {
        defaultMessage: 'Fee',
        description: 'Label in Send form',
        id: 'TR_FEE',
    },
    TR_FEE_LABEL: {
        defaultMessage: 'Fee',
        description: 'Label above the fee used for transaction',
        id: 'TR_FEE_LABEL',
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
        defaultMessage: 'Now you are ready to enjoy bleeding edge security with Trezor.',
        description: 'Subheading in newsletter step',
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
        defaultMessage: 'Get the latest firmware',
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
    TR_FIRST_PIN_ENTERED: {
        defaultMessage:
            'Good. You entered a new pin. But to make sure you did not make mistake, please enter it again. Look at your device now, numbers are now different.',
        description: 'Text describing what happens after user enters PIN for the first time.',
        id: 'TR_FIRST_PIN_ENTERED',
    },
    TR_FOR_EASIER_AND_SAFER_INPUT: {
        defaultMessage:
            'For easier and safer input you can scan recipient’s address from a QR code using your computer camera.',
        id: 'TR_FOR_EASIER_AND_SAFER_INPUT',
    },
    TR_FORGET: {
        defaultMessage: 'Forget',
        id: 'TR_FORGET',
    },
    TR_FORGET_DEVICE: {
        defaultMessage: 'Forget device',
        id: 'TR_FORGET_DEVICE',
    },
    TR_FORGET_LABEL: {
        defaultMessage: 'Forget {deviceLabel}?',
        id: 'TR_FORGET_LABEL',
    },
    TR_FORGETTING_ONLY_REMOVES_THE_DEVICE_FROM: {
        defaultMessage:
            'Forgetting only removes the device from the list on the left, your coins are still safe and you can access them by reconnecting your Trezor again.',
        id: 'TR_FORGETTING_ONLY_REMOVES_THE_DEVICE_FROM',
    },
    TR_FOUND_OK_DEVICE: {
        defaultMessage: 'Found an empty device, yay! You can continue now.',
        description: 'Case when device was connected and it is in expected state (not initialized)',
        id: 'TR_FOUND_OK_DEVICE',
    },
    TR_FRESH_ADDRESS: {
        defaultMessage: 'Fresh address',
        id: 'TR_FRESH_ADDRESS',
    },
    TR_GAS_LIMIT: {
        defaultMessage: 'Gas limit',
        id: 'TR_GAS_LIMIT',
    },
    TR_GAS_LIMIT_REFERS_TO: {
        defaultMessage:
            'Gas limit refers to the maximum amount of gas user is willing to spend on a particular transaction. {TR_GAS_QUOTATION}. Increasing the gas limit will not get the transaction confirmed sooner. Default value for sending {gasLimitTooltipCurrency} is {gasLimitTooltipValue}.',
        id: 'TR_GAS_LIMIT_REFERS_TO',
    },
    TR_GAS_PRICE: {
        defaultMessage: 'Gas price',
        id: 'TR_GAS_PRICE',
    },
    TR_GAS_PRICE_QUOTATION: {
        defaultMessage: 'Transaction fee = gas limit * gas price',
        id: 'TR_GAS_PRICE_QUOTATION',
    },
    TR_GAS_PRICE_REFERS_TO: {
        defaultMessage:
            'Gas price refers to the amount of ether you are willing to pay for every unit of gas, and is usually measured in “Gwei”. {TR_GAS_PRICE_QUOTATION}. Increasing the gas price will get the transaction confirmed sooner but makes it more expensive. The recommended gas price is {recommendedGasPrice} GWEI.',
        id: 'TR_GAS_PRICE_REFERS_TO',
    },
    TR_GAS_QUOTATION: {
        defaultMessage: 'Transaction fee = gas limit * gas price',
        id: 'TR_GAS_QUOTATION',
    },
    TR_GATHERING_INFO: {
        defaultMessage: 'Gathering information, please wait...',
        id: 'TR_GATHERING_INFO',
    },
    TR_GENERAL: {
        defaultMessage: 'General',
        description: 'Category in Settings',
        id: 'TR_GENERAL',
    },
    TR_GET_ONE: {
        defaultMessage: 'Get one',
        description: 'Part of the sentence: Dont have a Trezor? Get one',
        id: 'TR_GET_ONE',
    },
    TR_GO_TO_EXTERNAL_WALLET: {
        defaultMessage: 'Go to external wallet',
        id: 'TR_GO_TO_EXTERNAL_WALLET',
    },
    TR_GO_TO_HIDDEN_WALLET: {
        defaultMessage: 'Go to your hidden wallet',
        id: 'TR_GO_TO_HIDDEN_WALLET',
    },
    TR_GO_TO_SECURITY: {
        defaultMessage: 'Take me to security (recommended)',
        description: 'Button in security page (start security setup)',
        id: 'TR_GO_TO_SECURITY',
    },
    TR_GO_TO_STANDARD_WALLET: {
        defaultMessage: 'Go to your standard wallet',
        id: 'TR_GO_TO_STANDARD_WALLET',
    },
    TR_HIDDEN_WALLET: {
        defaultMessage: 'Hidden wallet',
        id: 'TR_HIDDEN_WALLET',
    },
    TR_HIDE_ADVANCED_OPTIONS: {
        defaultMessage: 'Hide advanced options',
        description: 'Hide advanced sending form',
        id: 'TR_HIDE_ADVANCED_OPTIONS',
    },
    TR_HIDE_BALANCE: {
        defaultMessage: 'Hide balance',
        id: 'TR_HIDE_BALANCE',
    },
    TR_HIDE_BALANCE_EXPLAINED: {
        defaultMessage:
            "Hides your account balance so you don't have to worry about anyone looking over your shoulder.",
        id: 'TR_HIDE_BALANCE_EXPLAINED',
    },
    TR_HIDE_PREVIOUS_ADDRESSES: {
        defaultMessage: 'Hide previous addresses',
        id: 'TR_HIDE_PREVIOUS_ADDRESSES',
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
    TR_I_HAVE_READ_INSTRUCTIONS: {
        defaultMessage: 'I have read the instructions and agree',
        description: 'Checkbox text',
        id: 'TR_I_HAVE_READ_INSTRUCTIONS',
    },
    TR_IF_WRONG_PASSPHRASE: {
        defaultMessage:
            'If you enter a wrong passphrase, you will not unlock the desired hidden wallet.',
        id: 'TR_IF_WRONG_PASSPHRASE',
    },
    TR_IF_YOUR_DEVICE_IS_EVER_LOST: {
        defaultMessage:
            'If your device is ever lost or damaged, your funds will be lost. Backup your device first, to protect your coins against such events.',
        id: 'TR_IF_YOUR_DEVICE_IS_EVER_LOST',
    },
    TR_IMPORTED_ACCOUNT_HASH: {
        defaultMessage: 'Imported account #{number}',
        description: 'Used in auto-generated label for imported accounts',
        id: 'TR_IMPORTED_ACCOUNT_HASH',
    },
    TR_INITIALIZING_ACCOUNTS: {
        defaultMessage: 'Initializing accounts',
        id: 'TR_INITIALIZING_ACCOUNTS',
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
    TR_INSTANCE_NAME: {
        defaultMessage: 'Instance name',
        id: 'TR_INSTANCE_NAME',
    },
    TR_INSTANCE_NAME_IN_USE: {
        defaultMessage: 'Instance name is already in use',
        id: 'TR_INSTANCE_NAME_IN_USE',
    },
    TR_INSTRUCTION_TO_SKIP: {
        defaultMessage:
            'You should skip setup and continue to wallet and check if you have any funds on this device.',
        description:
            'Instruction what to do when user knows the device he is holding was manipulated by him, not someone else.',
        id: 'TR_INSTRUCTION_TO_SKIP',
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
    TR_LAST_RESORT_INSTRUCTION: {
        defaultMessage: 'If nothing helps, {ContactSupportLink}',
        description: 'Troubleshooting instruction. See TR_CONTACT_TREZOR_SUPPORT_LINK',
        id: 'TR_LAST_RESORT_INSTRUCTION',
    },
    TR_LEARN_MORE: {
        defaultMessage: 'Learn more',
        description: 'Link to Trezor wiki.',
        id: 'TR_LEARN_MORE',
    },
    TR_LEARN_MORE_ABOUT_LATEST_VERSION: {
        defaultMessage: 'Learn more about latest version in {TR_CHANGELOG}.',
        id: 'TR_LEARN_MORE_ABOUT_LATEST_VERSION',
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
    TR_LOADING_ACCOUNTS: {
        defaultMessage: 'Loading accounts',
        id: 'TR_LOADING_ACCOUNTS',
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
    TR_MAKE_SURE_IT_IS_WELL_CONNECTED: {
        defaultMessage: 'Make sure your device is well connected to avoid communication failures.',
        description: 'Instruction for connecting device.',
        id: 'TR_MAKE_SURE_IT_IS_WELL_CONNECTED',
    },
    TR_MARK_ALL_AS_READ: {
        defaultMessage: 'Mark all as read',
        id: 'TR_MARK_ALL_AS_READ',
    },
    TR_MESSAGE: {
        defaultMessage: 'Message',
        description: 'Used as a label for message input field in Sign and Verify form',
        id: 'TR_MESSAGE',
    },
    TR_MINIMUM_ACCOUNT_RESERVE_REQUIRED: {
        defaultMessage: 'Minimum account reserve required',
        id: 'TR_MINIMUM_ACCOUNT_RESERVE_REQUIRED',
    },
    TR_MODEL_ONE: {
        defaultMessage: 'Model one',
        description: 'Name of Trezor model 1',
        id: 'TR_MODEL_ONE',
    },
    TR_MODEL_T: {
        defaultMessage: 'Model T',
        description: 'Name of Trezor model T',
        id: 'TR_MODEL_T',
    },
    TR_MORE_WORDS_TO_ENTER: {
        defaultMessage: '{count} words to enter.',
        description: 'How many words will user need to enter before recovery is finished.',
        id: 'TR_MORE_WORDS_TO_ENTER',
    },
    TR_NAME_BORING: {
        defaultMessage: 'Nah.. too boring, chose a different label',
        description: 'User shouldnt use My Trezor (default name) as their new custom name',
        id: 'TR_NAME_BORING',
    },
    TR_NAME_CHANGED_TEXT: {
        defaultMessage:
            'Excellent, your device has a custom name now. It will be visible on your device display from now on.',
        description: 'Text to display after user has changed label.',
        id: 'TR_NAME_CHANGED_TEXT',
    },
    TR_NAME_HEADING: {
        defaultMessage: 'Name your device',
        description: 'Heading in name step',
        id: 'TR_NAME_HEADING',
    },
    TR_NAME_HEADING_CHANGED: {
        defaultMessage: 'Hi, {label}',
        description: 'Subheading in name step after user changes label, so lets welcome him!',
        id: 'TR_NAME_HEADING_CHANGED',
    },
    TR_NAME_OK: {
        defaultMessage: 'Cool name',
        description: 'Validation message in label input',
        id: 'TR_NAME_OK',
    },
    TR_NAME_ONLY_ASCII: {
        defaultMessage: 'Name can contain only basic letters',
        description: 'Validation message in label input',
        id: 'TR_NAME_ONLY_ASCII',
    },
    TR_NAME_SUBHEADING: {
        defaultMessage: 'Personalize your device with your own name.',
        description: 'Subheading in name step',
        id: 'TR_NAME_SUBHEADING',
    },
    TR_NAME_TOO_LONG: {
        defaultMessage: 'Name is too long',
        description: 'Validation message in label input',
        id: 'TR_NAME_TOO_LONG',
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
    TR_NEM_WALLET: {
        defaultMessage: 'NEM wallet',
        id: 'TR_NEM_WALLET',
    },
    TR_NETWORK_AND_TOKENS: {
        defaultMessage: '{network} and tokens',
        id: 'TR_NETWORK_AND_TOKENS',
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
    TR_NETWORK_TYPE_LEGACY: {
        defaultMessage: 'legacy',
        id: 'TR_NETWORK_TYPE_LEGACY',
    },
    TR_NETWORK_TYPE_SEGWIT: {
        defaultMessage: 'segwit',
        id: 'TR_NETWORK_TYPE_SEGWIT',
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
    TR_NEWSLETTER_HEADING: {
        defaultMessage: 'Stay in touch',
        description: 'Heading in newsletter step',
        id: 'TR_NEWSLETTER_HEADING',
    },
    TR_NEWSLETTER_SUBHEADING: {
        defaultMessage: 'Receive information on important security updates',
        description: 'Subheading in newsletter step',
        id: 'TR_NEWSLETTER_SUBHEADING',
    },
    TR_NO_TRANSACTIONS: {
        defaultMessage: 'No Transactions :(',
        id: 'TR_NO_TRANSACTIONS',
    },
    TR_NORTH: {
        defaultMessage: 'North',
        id: 'TR_NORTH',
    },
    TR_NTH_WORD: {
        defaultMessage: '{number}. word',
        description: 'Ordinal number. For example: 1. word',
        id: 'TR_NTH_WORD',
    },
    TR_NUM_ACCOUNTS_NUM_COINS_FIAT_VALUE: {
        defaultMessage:
            '{accountsCount} {accountsCount, plural, one {account} other {accounts}} - {coinsCount} {coinsCount, plural, one {coin} other {coins}} - {fiatValue}',
        description: 'Used as title for a wallet instance in Switch Device modal',
        id: 'TR_NUM_ACCOUNTS_NUM_COINS_FIAT_VALUE',
    },
    TR_OFFLINE: {
        defaultMessage: 'Offline',
        id: 'TR_OFFLINE',
    },
    TR_ONLINE: {
        defaultMessage: 'Online',
        id: 'TR_ONLINE',
    },
    TR_OOPS_SOMETHING_WENT_WRONG: {
        defaultMessage: 'Oops! Something went wrong!',
        id: 'TR_OOPS_SOMETHING_WENT_WRONG',
    },
    TR_PACKAGING_LINK: {
        defaultMessage: 'here',
        description: 'Part of sentence TR_DID_YOU_PURCHASE. Link to support',
        id: 'TR_PACKAGING_LINK',
    },
    TR_PASSPHRASE_BLANK: {
        defaultMessage: 'Leave passphrase blank to access your default wallet',
        id: 'PASSPHRASE_BLANK',
    },
    TR_PASSPHRASE_CASE_SENSITIVE: {
        defaultMessage: 'Note: Passphrase is case-sensitive.',
        id: 'PASSPHRASE_CASE_SENSITIVE',
    },
    TR_PASSPHRASE_DO_NOT_MATCH: {
        defaultMessage: 'Passphrases do not match!',
        id: 'PASSPHRASE_DO_NOT_MATCH',
    },
    TR_PASSPHRASE_IS_OPTIONAL_FEATURE: {
        defaultMessage:
            'Passphrase is an optional feature of the Trezor device that is recommended for advanced users only. It is a word or a sentence of your choice. Its main purpose is to access a hidden wallet.',
        id: 'TR_PASSPHRASE_IS_OPTIONAL_FEATURE',
    },
    TR_PASSPHRASE_LABEL: {
        defaultMessage: 'Enter "{deviceLabel}" passphrase',
        id: 'TR_PASSPHRASE_LABEL',
    },
    TR_PENDING: {
        defaultMessage: 'Pending',
        description: 'Pending transaction with no confirmations',
        id: 'TR_PENDING',
    },
    TR_PHISHING_ATTACKS: {
        defaultMessage: 'phishing attacks',
        description:
            'Term, type of hacker attack trying to fool user to enter his sensitive data into a fake site.',
        id: 'TR_PHISHING_ATTACKS',
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
    TR_PLEASE_COMPARE_YOUR_ADDRESS: {
        defaultMessage: 'Please compare your address on device with address shown bellow',
        id: 'TR_PLEASE_COMPARE_YOUR_ADDRESS',
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
    TR_PLEASE_RELOAD_THE_PAGE_DOT: {
        defaultMessage: 'Please check your Internet connection and reload the page.',
        id: 'TR_PLEASE_RELOAD_THE_PAGE_DOT',
    },
    TR_PREVIOUS_ADDRESSES: {
        defaultMessage: 'Previous addresses',
        id: 'TR_PREVIOUS_ADDRESSES',
    },
    TR_PRIMARY_FIAT: {
        defaultMessage: 'Primary FIAT currency to display',
        id: 'TR_PRIMARY_FIAT',
    },
    TR_QR_CODE: {
        defaultMessage: 'QR Code',
        id: 'TR_QR_CODE',
    },
    TR_RANDOM_SEED_WORDS_DISCLAIMER: {
        defaultMessage:
            'Please note, that to maximaze security, your device will ask you to enter {count} fake words that are not part of your seed.',
        description:
            'User is instructed to enter words from seed (backup) into the form in browser',
        id: 'TR_RANDOM_SEED_WORDS_DISCLAIMER',
    },
    TR_RATE: {
        defaultMessage: 'Rate',
        id: 'TR_RATE',
    },
    TR_READ_MORE: {
        defaultMessage: 'Read more',
        id: 'TR_READ_MORE',
    },
    TR_RECEIVE: {
        defaultMessage: 'Receive',
        id: 'TR_RECEIVE',
    },
    TR_RECEIVE_NETWORK: {
        defaultMessage: 'Receive {network}',
        id: 'TR_RECEIVE_NETWORK',
    },
    TR_RECEIVE_NETWORK_AND_TOKENS: {
        defaultMessage: 'Receive {network} and tokens',
        id: 'TR_RECEIVE_NETWORK_AND_TOKENS',
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
    TR_REFRESH_INSTRUCTION: {
        defaultMessage: 'Refresh your internet browser window',
        description: 'Troubleshooting instruction',
        id: 'TR_REFRESH_INSTRUCTION',
    },
    TR_REMEMBER_DEVICE: {
        defaultMessage: 'Remember device',
        id: 'TR_REMEMBER_DEVICE',
    },
    TR_REQUEST_INSTANCE_DESCRIPTION: {
        defaultMessage:
            'Passphrase is an optional feature of the Trezor device that is recommended for advanced users only. It is a word or a sentence of your choice. Its main purpose is to access a hidden wallet.',
        id: 'TR_REQUEST_INSTANCE_DESCRIPTION',
    },
    TR_REQUEST_INSTANCE_HEADER: {
        defaultMessage: 'Create hidden wallet with name "{deviceLabel}"?',
        description: 'Create virtual device with passphrase',
        id: 'TR_REQUEST_INSTANCE_HEADER',
    },
    TR_RESELLERS_LINK: {
        defaultMessage: 'a trusted reseller',
        description:
            'Part of sentence TR_DID_YOU_PURCHASE. Link to page with trusted resellers list',
        id: 'TR_RESELLERS_LINK',
    },
    TR_RESERVE: {
        defaultMessage: 'Reserve',
        description: 'Label for minimal XRP account reserve',
        id: 'TR_RESERVE',
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
    TR_RIPPLE_ADDRESSES_REQUIRE_MINIMUM_BALANCE: {
        defaultMessage:
            'Ripple addresses require a minimum balance of {minBalance} XRP to activate and maintain the account. {TR_LEARN_MORE}',
        id: 'TR_RIPPLE_ADDRESSES_REQUIRE_MINIMUM_BALANCE',
    },
    TR_SATOSHILABS_CANNOT_BE_HELD_RESPONSIBLE: {
        defaultMessage:
            'SatoshiLabs cannot be held responsible for security liabilities or financial losses resulting from not following security instructions described here.',
        description: 'Liability disclaimer.',
        id: 'TR_SATOSHILABS_CANNOT_BE_HELD_RESPONSIBLE',
    },
    TR_SCAN_QR_CODE: {
        defaultMessage: 'Scan QR code',
        description: 'Title for the Scan QR modal dialog',
        id: 'TR_SCAN_QR_CODE',
    },
    TR_SEARCHING_FOR_YOUR_DEVICE: {
        defaultMessage: 'Searching for your device',
        description: 'Indication that we app does not see connected device yet.',
        id: 'TR_SEARCHING_FOR_YOUR_DEVICE',
    },
    TR_SEARCHING_TAKES_TOO_LONG: {
        defaultMessage: 'Searching for your device takes too long, you might want to try to:',
        description:
            'Message to display when device is not detected after a decent period of time.',
        id: 'TR_SEARCHING_TAKES_TOO_LONG',
    },
    TR_SECURITY_HEADING: {
        defaultMessage: 'Basic setup is done, but...',
        description: 'Heading in security page',
        id: 'TR_SECURITY_HEADING',
    },
    TR_SECURITY_SUBHEADING: {
        defaultMessage:
            'Good job, your wallet is ready. But we strongly recommend you to spend few more minutes and improve your security.',
        description: 'Text in security page',
        id: 'TR_SECURITY_SUBHEADING',
    },
    TR_SEE_FULL_TRANSACTION_HISTORY: {
        defaultMessage: 'See full transaction history',
        id: 'TR_SEE_FULL_TRANSACTION_HISTORY',
    },
    TR_SEED_MANUAL_LINK: {
        defaultMessage: 'recovery seed',
        description: 'Link. Part of TR_BACKUP_SUBHEADING_1',
        id: 'TR_SEED_MANUAL_LINK',
    },
    TR_SELECT_WALLET_TYPE_FOR: {
        defaultMessage: 'Select wallet type for {deviceLabel}',
        id: 'TR_SELECT_WALLET_TYPE_FOR',
    },
    TR_SELECT_YOUR_DEVICE_HEADING: {
        defaultMessage: 'Select your device',
        description: 'Heading on select your device page',
        id: 'TR_SELECT_YOUR_DEVICE_HEADING',
    },
    TR_SEND: {
        defaultMessage: 'Send {amount}',
        id: 'TR_SEND',
    },
    TR_SEND_ERROR: {
        defaultMessage: 'Send {network}',
        id: 'TR_SEND_ERROR',
    },
    TR_SEND_LABEL: {
        defaultMessage: 'Send',
        description: 'Label for amount to be send',
        id: 'TR_SEND_LABEL',
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
    TR_SET_DEFAULT: {
        defaultMessage: 'Set default',
        id: 'TR_SET_DEFAULT',
    },
    TR_SET_MAX: {
        defaultMessage: 'Set max',
        description: 'Used for setting maximum amount in Send form',
        id: 'TR_SET_MAX',
    },
    TR_SET_PIN: {
        defaultMessage: 'Set pin',
        description: 'Button text',
        id: 'TR_SET_PIN',
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
    TR_SHOW_FULL_ADDRESS: {
        defaultMessage: 'Show full address',
        id: 'TR_SHOW_FULL_ADDRESS',
    },
    TR_SHOW_OLDER_NEWS: {
        defaultMessage: 'Show older news',
        id: 'TR_SHOW_OLDER_NEWS',
    },
    TR_SHOW_ON_TREZOR: {
        defaultMessage: 'Show on Trezor',
        id: 'TR_SHOW_ON_TREZOR',
    },
    TR_SHOW_PASSPHRASE: {
        defaultMessage: 'Show passphrase',
        id: 'SHOW_PASSPHRASE',
    },
    TR_SHOW_PREVIOUS_ADDRESSES: {
        defaultMessage: 'Show previous addresses',
        id: 'TR_SHOW_PREVIOUS_ADDRESSES',
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
    TR_SIGN_MESSAGE_ERROR: {
        defaultMessage: 'Failed to sign message',
        id: 'TR_SIGN_MESSAGE_ERROR',
    },
    TR_SIGNATURE: {
        defaultMessage: 'Signature',
        description: 'Used as a label for signature input field in Sign and Verify form',
        id: 'TR_SIGNATURE',
    },
    TR_SIGNATURE_IS_VALID: {
        defaultMessage: 'Signature is valid',
        id: 'TR_SIGNATURE_IS_VALID',
    },
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
    TR_SKIP_SECURITY: {
        defaultMessage: 'Skip for now',
        description: 'Button in security page (skip security setup)',
        id: 'TR_SKIP_SECURITY',
    },
    TR_SOUTH: {
        defaultMessage: 'South',
        id: 'TR_SOUTH',
    },
    TR_STANDARD_WALLET: {
        defaultMessage: 'Standard wallet',
        id: 'TR_STANDARD_WALLET',
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
    TR_STATUS_UNKNOWN: {
        defaultMessage: 'Status unknown',
        description: 'Device status',
        id: 'TR_STATUS_UNKNOWN',
    },
    TR_STELLAR_WALLET: {
        defaultMessage: 'Stellar wallet',
        id: 'TR_STELLAR_WALLET',
    },
    TR_SUBMIT: {
        defaultMessage: 'Submit',
        description: 'Button text',
        id: 'TR_SUBMIT',
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
    TR_TERMS: {
        defaultMessage: 'Terms',
        description: 'As in Terms and Conditions, In the bottom footer',
        id: 'TR_TERMS',
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
    TR_TEZOS_WALLET: {
        defaultMessage: 'Tezos wallet',
        id: 'TR_TEZOS_WALLET',
    },
    TR_THANK_YOU_FOR_EMAIL: {
        defaultMessage:
            'Thank you for providing your email. To complete subscription, please click on the link we sent to your email. You can also follow us on socials:',
        description: 'Displayed after user submits contact email',
        id: 'TR_THANK_YOU_FOR_EMAIL',
    },
    TR_THE_ACCOUNT_BALANCE_IS_HIDDEN: {
        defaultMessage: 'The account balance is hidden.',
        id: 'TR_THE_ACCOUNT_BALANCE_IS_HIDDEN',
    },
    TR_THE_PIN_LAYOUT_IS_DISPLAYED: {
        defaultMessage: 'The PIN layout is displayed on your Trezor.',
        id: 'TR_THE_PIN_LAYOUT_IS_DISPLAYED',
    },
    TR_THIS_IS_PLACE_TO_SEE_ALL: {
        defaultMessage:
            'This is a place to see all your devices. You can further set them up in Settings but here you can switch between devices and see their statuses.',
        id: 'TR_THIS_IS_PLACE_TO_SEE_ALL',
    },
    TR_THIS_WILL_CREATE_NEW_INSTANCE: {
        defaultMessage:
            'This will create new instance of device which can be used with different passphrase',
        id: 'TR_THIS_WILL_CREATE_NEW_INSTANCE',
    },
    TR_TO_LABEL: {
        defaultMessage: 'To',
        description: "Label for recepeint's address",
        id: 'TR_TO_LABEL',
    },
    TR_TO_PREVENT_PHISHING_ATTACKS_COMMA: {
        defaultMessage:
            'To prevent phishing attacks, you should verify the address on your Trezor first. {claim}',
        id: 'TR_TO_PREVENT_PHISHING_ATTACKS_COMMA',
    },
    TR_TOKENS: {
        defaultMessage: 'Tokens',
        id: 'TR_TOKENS',
    },
    TR_TOTAL_PORTFOLIO_VALUE: {
        defaultMessage: 'Total portfolio value',
        id: 'TR_TOTAL_PORTFOLIO_VALUE',
    },
    TR_TOTAL_RECEIVED: {
        defaultMessage: 'Total received: {amount}',
        id: 'TR_TOTAL_RECEIVED',
    },
    TR_TRANSACTIONS: {
        defaultMessage: '{network} Transactions',
        id: 'TR_TRANSACTIONS',
    },
    TR_TRANSACTIONS_AND_TOKENS: {
        defaultMessage: '{network} and tokens transactions',
        id: 'TR_TRANSACTIONS_AND_TOKENS',
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
    TR_UNAVAILABLE: {
        defaultMessage: 'Unavailable',
        description: 'Device status',
        id: 'TR_UNAVAILABLE',
    },
    TR_UNDISCOVERED_WALLET: {
        defaultMessage: 'Undiscovered wallet',
        id: 'TR_UNDISCOVERED_WALLET',
    },
    TR_UNKNOWN_TRANSACTION: {
        defaultMessage: '(Unknown transaction)',
        id: 'TR_UNKNOWN_TRANSACTION',
    },
    TR_UNKOWN_ERROR_SEE_CONSOLE: {
        defaultMessage: 'Unknown error. See console logs for details.',
        id: 'TR_UNKOWN_ERROR_SEE_CONSOLE',
    },
    TR_UNREADABLE: {
        defaultMessage: 'Unreadable',
        description: 'Device status',
        id: 'TR_UNREADABLE',
    },
    TR_UNVERIFIED_ADDRESS_COMMA_CONNECT: {
        defaultMessage: 'Unverified address, connect your Trezor to verify it',
        id: 'TR_UNVERIFIED_ADDRESS_COMMA_CONNECT',
    },
    TR_UNVERIFIED_ADDRESS_COMMA_SHOW: {
        defaultMessage: 'Unverified address, show on Trezor.',
        id: 'TR_UNVERIFIED_ADDRESS_COMMA_SHOW',
    },
    TR_UPGRADE_FOR_THE_NEWEST_FEATURES_DOT: {
        defaultMessage: 'Upgrade for the newest features.',
        id: 'TR_UPGRADE_FOR_THE_NEWEST_FEATURES_DOT',
    },
    TR_UPLOAD_IMAGE: {
        defaultMessage: 'Upload Image',
        id: 'TR_UPLOAD_IMAGE',
    },
    TR_USE_THE_KEYBOARD_SHORTCUT: {
        defaultMessage: 'Use the keyboard shortcut:',
        description: 'We want user to pres Ctrl + D',
        id: 'TR_USE_THE_KEYBOARD_SHORTCUT',
    },
    TR_USE_YOUR_DEVICE_IN_THIS_WINDOW: {
        defaultMessage: 'Do you want to use your device in this window?',
        id: 'TR_USE_YOUR_DEVICE_IN_THIS_WINDOW',
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
    TR_VERIFY_MESSAGE_ERROR: {
        defaultMessage: 'Failed to verify message',
        id: 'TR_VERIFY_MESSAGE_ERROR',
    },
    TR_VERIFY_MESSAGE_SUCCESS: {
        defaultMessage: 'Message has been successfully verified',
        id: 'TR_VERIFY_MESSAGE_SUCCESS',
    },
    TR_VERIFYING_ADDRESS_ERROR: {
        defaultMessage: 'Verifying address error',
        id: 'TR_VERIFYING_ADDRESS_ERROR',
    },
    TR_VERSION_IS_LOADING: {
        defaultMessage: 'Version is loading',
        id: 'TR_VERSION_IS_LOADING',
    },
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
    TR_WALLET: {
        defaultMessage: 'Wallet',
        description: 'Category in Settings',
        id: 'TR_WALLET',
    },
    TR_WAS_USED_IN_ANOTHER_WINDOW: {
        defaultMessage: 'Reload session',
        description: 'Device status',
        id: 'TR_WAS_USED_IN_ANOTHER_WINDOW',
    },
    TR_WE_THANK_OUR_TRANSLATORS: {
        defaultMessage: 'We thank our translators for their {TR_CONTRIBUTION}',
        id: 'TR_WE_THANK_OUR_TRANSLATORS',
    },
    TR_WELCOME_TO_TREZOR: {
        defaultMessage: 'Welcome to Trezor',
        description: 'Welcome message on welcome page, heading.',
        id: 'TR_WELCOME_TO_TREZOR',
    },
    TR_WELCOME_TO_TREZOR_TEXT: {
        defaultMessage: 'Let us take you through a short setup.',
        description: 'Welcome message on welcome page, longer text.',
        id: 'TR_WELCOME_TO_TREZOR_TEXT',
    },
    TR_WEST: {
        defaultMessage: 'West',
        id: 'TR_WEST',
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
    TR_WOULD_YOU_LIKE_TREZOR_WALLET_TO: {
        defaultMessage:
            'Would you like Trezor Wallet to forget your {deviceCount, plural, one {device} other {devices}} or to remember {deviceCount, plural, one {it} other {them}}, so that it is still visible even while disconnected?',
        id: 'TR_WOULD_YOU_LIKE_TREZOR_WALLET_TO',
    },
    TR_WRONG_EMAIL_FORMAT: {
        defaultMessage: 'Wrong email format',
        description: 'Validation text displayed under email input',
        id: 'TR_WRONG_EMAIL_FORMAT',
    },
    TR_XRP_DESTINATION_TAG: {
        defaultMessage: 'Destination tag',
        id: 'TR_XRP_DESTINATION_TAG',
    },
    TR_XRP_DESTINATION_TAG_EXPLAINED: {
        defaultMessage:
            'Destination tag is an arbitrary number which serves as a unique identifier of your transaction. Some services may require this to process your transaction.',
        id: 'TR_XRP_DESTINATION_TAG_EXPLAINED',
    },
    TR_XRP_TRANSFER_COST: {
        defaultMessage: 'Transfer cost in XRP drops',
        id: 'TR_XRP_TRANSFER_COST',
    },
    TR_YOU_WERE_DISCONNECTED_DOT: {
        defaultMessage: 'You were disconnected.',
        id: 'TR_YOU_WERE_DISCONNECTED_DOT',
    },
    TR_YOU_WILL_BE_REDIRECTED_TO_EXTERNAL: {
        defaultMessage: 'You will be redirected to external wallet',
        id: 'TR_YOU_WILL_BE_REDIRECTED_TO_EXTERNAL',
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
        defaultMessage: 'Your Trezor is not backed up',
        id: 'TR_YOUR_TREZOR_IS_NOT_BACKED_UP',
    },
    TR_YOUR_WALLET_IS_READY_WHAT: {
        defaultMessage: 'Your Wallet is ready. What to do now?',
        id: 'TR_YOUR_WALLET_IS_READY_WHAT',
    },
});

export default definedMessages;
