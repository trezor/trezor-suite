import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    CANNOT_SEND_TO_MYSELF: {
        defaultMessage: 'Cannot send to myself',
        id: 'CANNOT_SEND_TO_MYSELF',
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
    TR_ADD_ACCOUNT: {
        defaultMessage: 'Add account',
        id: 'TR_ADD_ACCOUNT',
    },
    TR_ADD_FRESH_ADDRESS: {
        defaultMessage: 'Add fresh address',
        id: 'TR_ADD_FRESH_ADDRESS',
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
    TR_ATTENTION_COLON_THE_LOG_CONTAINS: {
        defaultMessage:
            'Attention: The log contains your XPUBs. Anyone with your XPUBs can see your account history.',
        id: 'TR_ATTENTION_COLON_THE_LOG_CONTAINS',
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
    TR_BACKUP_SUBHEADING_1: {
        defaultMessage:
            'Backup seed consisting of words is the ultimate key to your Wallet and all the important data. Trezor will generate the seed and you should write it down and store it securely.',
        description: 'Explanation what recovery seed is',
        id: 'TR_BACKUP_SUBHEADING_1',
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
    TR_BRIDGE_SUBHEADING: {
        defaultMessage:
            'Trezor Bridge is a communication tool to facilitate the connection between your Trezor and your internet browser.',
        description: 'Description what Trezor Bridge is',
        id: 'TR_BRIDGE_SUBHEADING',
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
    TR_CARDANO_WALLET: {
        defaultMessage: 'Cardano wallet',
        id: 'TR_CARDANO_WALLET',
    },
    TR_CHANGE_PASSPHRASE_SETTINGS_TO_USE: {
        defaultMessage: 'Change passphrase settings to use this device',
        id: 'TR_CHANGE_PASSPHRASE_SETTINGS_TO_USE',
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
    TR_CHECK_PGP_SIGNATURE: {
        defaultMessage: 'Check PGP signature',
        id: 'TR_CHECK_PGP_SIGNATURE',
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
    TR_CONFIRM_ACTION_ON_YOUR: {
        defaultMessage: 'Confirm action on your "{deviceLabel}" device.',
        id: 'TR_CONFIRM_ACTION_ON_YOUR',
    },
    TR_CONFIRM_TRANSACTION_ON: {
        defaultMessage: 'Confirm transaction on "{deviceLabel}" device',
        id: 'TR_CONFIRM_TRANSACTION_ON',
    },
    TR_CONNECT_TO_BACKEND: {
        defaultMessage: 'Connect',
        id: 'TR_CONNECT_TO_BACKEND',
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
    TR_CREATE_BACKUP_IN_3_MINUTES: {
        defaultMessage: 'Create a backup in 3 minutes',
        id: 'TR_CREATE_BACKUP_IN_3_MINUTES',
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
    TR_CUSTOM_FEE_NOT_IN_RANGE: {
        defaultMessage: 'Allowed fee is between {minFee} and {maxFee}',
        id: 'TR_CUSTOM_FEE_NOT_IN_RANGE',
    },
    TR_DATA: {
        defaultMessage: 'Data',
        id: 'TR_DATA',
    },
    TR_DATA_IS_USUALLY_USED: {
        defaultMessage: 'Data is usually used when you send transactions to contracts.',
        id: 'TR_DATA_IS_USUALLY_USED',
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
    TR_ENABLE_NETWORK_BUTTON: {
        defaultMessage: 'Find my {networkName} accounts',
        id: 'TR_ENABLE_NETWORK_BUTTON',
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
    TR_CONFIRM_PIN: {
        defaultMessage: 'Confirm PIN',
        id: 'TR_CONFIRM_PIN',
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
        defaultMessage:
            'You did it! Not only your Trezor is initialized and ready but you also increased your security level above the average user by going through all security steps. Good job!',
        id: 'TR_FINAL_SUBHEADING',
    },
    TR_FIND_OUT_MORE_INFO: {
        defaultMessage: 'Find out more info',
        id: 'TR_FIND_OUT_MORE_INFO',
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
    TR_FIRST_PIN_ENTERED: {
        defaultMessage:
            'Good. You entered a new pin. But to make sure you did not make mistake, please enter it again. Look at your device now, numbers are now different.',
        description: 'Text describing what happens after user enters PIN for the first time.',
        id: 'TR_FIRST_PIN_ENTERED',
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
    TR_GET_ONE: {
        defaultMessage: 'Get one',
        description: 'Part of the sentence: Dont have a Trezor? Get one',
        id: 'TR_GET_ONE',
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
    TR_HOLOGRAM_STEP_SUBHEADING: {
        defaultMessage: 'Please make sure hologram protecting your device is authentic',
        description: 'Subheading on hologram step page',
        id: 'TR_HOLOGRAM_STEP_SUBHEADING',
    },
    TR_HOLOGRAM_STEP_HEADING: {
        defaultMessage: 'Hologram check',
        description: 'Heading on hologram step page',
        id: 'TR_HOLOGRAM_STEP_HEADING',
    },
    TR_HOW_PIN_WORKS: {
        defaultMessage: 'Not sure how PIN works?',
        id: 'TR_HOW_PIN_WORKS',
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
    TR_LEARN_MORE_ABOUT_LATEST_VERSION: {
        defaultMessage: 'Learn more about latest version in {TR_CHANGELOG}.',
        id: 'TR_LEARN_MORE_ABOUT_LATEST_VERSION',
    },
    TR_LEARN_MORE_LINK: {
        defaultMessage: 'Learn more.',
        description: 'Link to Trezor wiki.',
        id: 'TR_LEARN_MORE_LINK',
    },
    TR_LEARN_MORE: {
        defaultMessage: 'Learn more',
        description: 'Link to Trezor wiki.',
        id: 'TR_LEARN_MORE',
    },
    TR_UPLOAD_IMAGE: {
        id: 'TR_UPLOAD_IMAGE',
        defaultMessage: 'Upload Image',
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
    TR_AUTH_CONFIRM_FAILED_TITLE: {
        defaultMessage: 'Passphrase mismatch!',
        id: 'TR_AUTH_CONFIRM_FAILED_TITLE',
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
    TR_LOADING_TRANSACTIONS: {
        defaultMessage: 'Loading transactions',
        id: 'TR_LOADING_TRANSACTIONS',
    },
    TR_LOG: {
        defaultMessage: 'Log',
        description: 'application event and error',
        id: 'TR_LOG',
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
    TR_OOPS_SOMETHING_WENT_WRONG: {
        defaultMessage: 'Oops! Something went wrong!',
        id: 'TR_OOPS_SOMETHING_WENT_WRONG',
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
    TR_RECEIVE_NETWORK: {
        defaultMessage: 'Receive {network}',
        id: 'TR_RECEIVE_NETWORK',
    },
    TR_RECEIVE_NETWORK_AND_TOKENS: {
        defaultMessage: 'Receive {network} and tokens',
        id: 'TR_RECEIVE_NETWORK_AND_TOKENS',
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
    TR_RECOVERY_TYPES_DESCRIPTION: {
        defaultMessage:
            'Both methods are safe. Basic recovery uses on computer input of words in randomized order. Advanced recovery uses on-screen input to load your recovery seed. {TR_LEARN_MORE_LINK}',
        description: 'There are two methods of recovery for T1. This is a short explanation text.',
        id: 'TR_RECOVERY_TYPES_DESCRIPTION',
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
    TR_SEE_FULL_TRANSACTION_HISTORY: {
        defaultMessage: 'See full transaction history',
        id: 'TR_SEE_FULL_TRANSACTION_HISTORY',
    },
    TR_SEED_MANUAL_LINK: {
        defaultMessage: 'recovery seed',
        description: 'Link. Part of TR_BACKUP_SUBHEADING_1',
        id: 'TR_SEED_MANUAL_LINK',
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
    TR_SHOW_ADDRESS_I_WILL_TAKE_THE_RISK: {
        defaultMessage: 'Show address, I will take the risk',
        id: 'TR_SHOW_ADDRESS_I_WILL_TAKE_THE_RISK',
    },
    TR_SHOW_DETAILS: {
        defaultMessage: 'Show details',
        id: 'TR_SHOW_DETAILS',
    },
    TR_SHOW_FULL_ADDRESS: {
        defaultMessage: 'Show full address',
        id: 'TR_SHOW_FULL_ADDRESS',
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
        defaultMessage: 'Skip backup and PIN',
        description: 'Button in security page (skip security setup)',
        id: 'TR_SKIP_SECURITY',
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
    TR_TAKE_ME_BACK_TO_WALLET: {
        defaultMessage: 'Take me back to the wallet',
        id: 'TR_TAKE_ME_BACK_TO_WALLET',
    },
    TR_TERMS: {
        defaultMessage: 'Terms',
        description: 'As in Terms and Conditions, In the bottom footer',
        id: 'TR_TERMS',
    },
    TR_TEZOS_WALLET: {
        defaultMessage: 'Tezos wallet',
        id: 'TR_TEZOS_WALLET',
    },
    TR_THE_ACCOUNT_BALANCE_IS_HIDDEN: {
        defaultMessage: 'The account balance is hidden.',
        id: 'TR_THE_ACCOUNT_BALANCE_IS_HIDDEN',
    },
    TR_THE_PIN_LAYOUT_IS_DISPLAYED: {
        defaultMessage: 'The PIN layout is displayed on your Trezor.',
        id: 'TR_THE_PIN_LAYOUT_IS_DISPLAYED',
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
    TR_COINS: {
        defaultMessage: 'Coins',
        id: 'TR_COINS',
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
    TR_FOR_EASIER_AND_SAFER_INPUT: {
        id: 'TR_FOR_EASIER_AND_SAFER_INPUT',
        defaultMessage:
            'For easier and safer input you can scan recipient’s address from a QR code using your computer camera.',
    },
    TR_PLEASE_ALLOW_YOUR_CAMERA: {
        id: 'TR_PLEASE_ALLOW_YOUR_CAMERA',
        defaultMessage: 'Please allow your camera to be able to scan a QR code.',
    },
    TR_CONFIRM_ADDRESS_ON_TREZOR: {
        id: 'TR_CONFIRM_ADDRESS_ON_TREZOR',
        defaultMessage: 'Confirm address on Trezor',
    },
    TR_PLEASE_COMPARE_YOUR_ADDRESS: {
        id: 'TR_PLEASE_COMPARE_YOUR_ADDRESS',
        defaultMessage: 'Please compare your address on device with address shown bellow',
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
        defaultMessage: 'First-time user or an ol’ Trezor fella?',
        id: 'TR_WELCOME_TO_TREZOR',
    },
    TR_WELCOME_TO_TREZOR_TEXT: {
        defaultMessage: 'Choose your path and let the Trezor Force be with you!.',
        id: 'TR_WELCOME_TO_TREZOR_TEXT',
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
    TR_XRP_DESTINATION_TAG_EXPLAINED: {
        defaultMessage:
            'Destination tag is an arbitrary number which serves as a unique identifier of your transaction. Some services may require this to process your transaction.',
        id: 'TR_XRP_DESTINATION_TAG_EXPLAINED',
    },
    TR_YOU_WERE_DISCONNECTED_DOT: {
        defaultMessage: 'You were disconnected.',
        id: 'TR_YOU_WERE_DISCONNECTED_DOT',
    },
    TR_YOU_WILL_BE_REDIRECTED_TO_EXTERNAL: {
        defaultMessage: 'You will be redirected to external wallet',
        id: 'TR_YOU_WILL_BE_REDIRECTED_TO_EXTERNAL',
    },
    TR_YOUR_TREZOR_IS_NOT_BACKED_UP: {
        defaultMessage: 'Your Trezor is not backed up',
        id: 'TR_YOUR_TREZOR_IS_NOT_BACKED_UP',
    },
    TR_SWITCH_DEVICE: {
        id: 'TR_SWITCH_DEVICE',
        defaultMessage: 'Switch Device',
    },
    TR_THIS_IS_PLACE_TO_SEE_ALL: {
        id: 'TR_THIS_IS_PLACE_TO_SEE_ALL',
        defaultMessage:
            'This is a place to see all your devices. You can further set them up in Settings but here you can switch between devices and see their statuses.',
    },
    TR_FORGET: {
        id: 'TR_FORGET',
        defaultMessage: 'Forget',
    },
    TR_UNDISCOVERED_WALLET: {
        id: 'TR_UNDISCOVERED_WALLET',
        defaultMessage: 'Undiscovered wallet',
    },
    TR_NUM_ACCOUNTS_NUM_COINS_FIAT_VALUE: {
        id: 'TR_NUM_ACCOUNTS_NUM_COINS_FIAT_VALUE',
        defaultMessage:
            '{accountsCount} {accountsCount, plural, one {account} other {accounts}} - {coinsCount} {coinsCount, plural, one {coin} other {coins}} - {fiatValue}',
        description: 'Used as title for a wallet instance in Switch Device modal',
    },
    TR_ADD_HIDDEN_WALLET: {
        id: 'TR_ADD_HIDDEN_WALLET',
        defaultMessage: 'Add hidden wallet',
    },
    TR_BACKGROUND_GALLERY: {
        id: 'TR_BACKGROUND_GALLERY',
        defaultMessage: 'Homescreen background gallery',
    },
    TR_BACKUP: {
        id: 'TR_BACKUP',
        defaultMessage: 'Backup',
    },
    TR_BACKUP_RECOVERY_SEED: {
        id: 'TR_BACKUP_RECOVERY_SEED',
        defaultMessage: 'Backup (Recovery seed)',
    },
    TR_RECOVERY_SEED_IS: {
        id: 'TR_RECOVERY_SEED_IS',
        defaultMessage:
            'Recovery seed is a list of words in a specific order which store all the information needed.',
    },
    TR_CREATE_BACKUP: {
        id: 'TR_CREATE_BACKUP',
        defaultMessage: 'Create backup',
    },
    TR_CHECK_RECOVERY_SEED: {
        id: 'TR_CHECK_RECOVERY_SEED',
        defaultMessage: 'Check recovery seed',
    },
    TR_CHECK_SEED: {
        id: 'TR_CHECK_SEED',
        defaultMessage: 'Check seed',
    },
    TR_FIRMWARE_VERSION: {
        id: 'TR_FIRMWARE_VERSION',
        defaultMessage: 'Firmware version',
    },
    TR_YOUR_CURRENT_FIRMWARE: {
        id: 'TR_YOUR_CURRENT_FIRMWARE',
        defaultMessage: 'Your current firmware version is {version}',
    },
    TR_WIPING_YOUR_DEVICE: {
        id: 'TR_WIPING_YOUR_DEVICE',
        defaultMessage:
            'Wiping the device removes all its information. Only wipe your device if you have your device if you have your recovery seed at hand or there are no funds stored on this device.',
    },
    TR_CURRENCY: {
        id: 'TR_CURRENCY',
        defaultMessage: 'Currency',
    },
    TR_PRIMARY_FIAT: {
        id: 'TR_PRIMARY_FIAT',
        defaultMessage: 'Primary FIAT currency to display',
    },
    TR_LABELING: {
        id: 'TR_LABELING',
        defaultMessage: 'Labeling',
    },
    TR_CONNECT_DROPBOX: {
        id: 'TR_CONNECT_DROPBOX',
        defaultMessage: 'Connect Dropbox',
    },
    TR_SUITE_VERSION: {
        id: 'TR_SUITE_VERSION',
        defaultMessage: 'Suite version',
    },
    TR_YOUR_CURRENT_VERSION: {
        id: 'TR_YOUR_CURRENT_VERSION',
        defaultMessage: 'Your current Suite version is 1.2.0',
    },
    TR_CHECK_FOR_UPDATES: {
        id: 'TR_CHECK_FOR_UPDATES',
        defaultMessage: 'Check for updates',
    },
    TR_3RD_PARTY_WALLETS: {
        id: 'TR_3RD_PARTY_WALLETS',
        defaultMessage: '3rd party wallets',
    },
    TR_3RD_PARTY_WALLETS_DESC: {
        id: 'TR_3RD_PARTY_WALLETS_DESC',
        defaultMessage:
            'These coins are supported by Trezor but only in 3rd party wallets. These coins cannot be managed by Trezor Suite or Wallet.',
    },
    TR_SETTINGS: {
        id: 'TR_SETTINGS',
        defaultMessage: 'Settings',
    },
    TR_BACKUP_FAILED: {
        id: 'TR_BACKUP_FAILED',
        defaultMessage:
            'Backup failed and your Wallet is not backed up. You can still use it without any problems but highly recommend you following the link and see how to successfully create a backup.',
    },
    TR_LANGUAGE: {
        id: 'TR_LANGUAGE',
        defaultMessage: 'Language',
    },
    TR_WHAT_TO_DO_NOW: {
        id: 'TR_WHAT_TO_DO_NOW',
        defaultMessage: 'What to do now',
    },
    TR_DONT_HAVE_A_TREZOR: {
        defaultMessage: "Don't have a Trezor? {getOne}",
        id: 'TR_DONT_HAVE_A_TREZOR',
    },
    TR_NETWORK_UNKNOWN: {
        defaultMessage: 'unknown',
        id: 'TR_NETWORK_UNKNOWN',
    },
    TR_USER_HAS_WORKED_WITH_THIS_DEVICE: {
        defaultMessage: 'I have worked with it before',
        description: 'Option to click when troubleshooting initialized device.',
        id: 'TR_USER_HAS_WORKED_WITH_THIS_DEVICE',
    },
    TR_CUSTOM_FEE_IS_NOT_NUMBER: {
        defaultMessage: 'Fee is not a number',
        id: 'TR_CUSTOM_FEE_IS_NOT_NUMBER',
    },
    TR_TOKENS: {
        defaultMessage: 'Tokens',
        id: 'TR_TOKENS',
    },
    TR_NORTH: {
        id: 'TR_NORTH',
        defaultMessage: 'North',
    },
    TR_EAST: {
        id: 'TR_EAST',
        defaultMessage: 'East',
    },
    TR_SOUTH: {
        id: 'TR_SOUTH',
        defaultMessage: 'South',
    },
    TR_WEST: {
        id: 'TR_WEST',
        defaultMessage: 'West',
    },
    TR_GENERAL: {
        id: 'TR_GENERAL',
        defaultMessage: 'General',
        description: 'Category in Settings',
    },
    TR_DEVICE: {
        id: 'TR_DEVICE',
        defaultMessage: 'Device',
        description: 'Category in Settings',
    },
    TR_WALLET: {
        id: 'TR_WALLET',
        defaultMessage: 'Wallet',
        description: 'Category in Settings',
    },
    TR_SUPPORT: {
        id: 'TR_SUPPORT',
        defaultMessage: 'Support',
    },
    TR_COINS_SETTINGS_ALSO_DEFINES: {
        id: 'TR_COINS_SETTINGS_ALSO_DEFINES',
        defaultMessage:
            'Coins settings also defines the Discovery process when Trezor is connected. Each time you connect not remembered device, Trezor Suite needs to find out what accounts you have by going through each coin one by one. That can take between few seconds to few minutes if you allow all or too many coins.',
    },
    TR_DEACTIVATE_ALL: {
        id: 'TR_DEACTIVATE_ALL',
        defaultMessage: 'Deactivate all',
    },
    TR_ACTIVATE_ALL: {
        id: 'TR_ACTIVATE_ALL',
        defaultMessage: 'Activate all',
    },
    TR_TOTAL_PORTFOLIO_VALUE: {
        id: 'TR_TOTAL_PORTFOLIO_VALUE',
        defaultMessage: 'Total portfolio value',
    },
    TR_RECEIVE: {
        id: 'TR_RECEIVE',
        defaultMessage: 'Receive',
    },
    TR_BUY: {
        id: 'TR_BUY',
        defaultMessage: 'Buy',
    },
    TR_YOUR_WALLET_IS_READY_WHAT: {
        id: 'TR_YOUR_WALLET_IS_READY_WHAT',
        defaultMessage: 'Your Wallet is ready. What to do now?',
    },
    TR_ADDITIONAL_SECURITY_FEATURES: {
        id: 'TR_ADDITIONAL_SECURITY_FEATURES',
        defaultMessage: 'Additional security features are waiting to be done.',
    },
    TR_FINISH_ADVANCED_SECURITY: {
        id: 'TR_FINISH_ADVANCED_SECURITY',
        defaultMessage: 'Finish advanced security',
    },
    TR_LOOKING_FOR_QUICK_EASY: {
        id: 'TR_LOOKING_FOR_QUICK_EASY',
        defaultMessage: 'Looking for a quick & easy way to buy BTC? We got you covered.',
    },
    TR_ASSETS: {
        id: 'TR_ASSETS',
        defaultMessage: 'Assets',
    },
    TR_VALUES: {
        id: 'TR_VALUES',
        defaultMessage: 'Values',
    },
    TR_EXCHANGE_RATE: {
        id: 'TR_EXCHANGE_RATE',
        defaultMessage: 'Exchange rate',
    },
    TR_CONNECTION_STATUS: {
        id: 'TR_CONNECTION_STATUS',
        defaultMessage: 'Connection Status',
    },
    TR_ONLINE: {
        id: 'TR_ONLINE',
        defaultMessage: 'Online',
    },
    TR_CONNECTING_DOTDOTDOT: {
        id: 'TR_CONNECTING_DOTDOTDOT',
        defaultMessage: 'Connecting...',
    },
    TR_OFFLINE: {
        id: 'TR_OFFLINE',
        defaultMessage: 'Offline',
    },
    TR_MARK_ALL_AS_READ: {
        id: 'TR_MARK_ALL_AS_READ',
        defaultMessage: 'Mark all as read',
    },
    TR_WHATS_NEW: {
        id: 'TR_WHATS_NEW',
        defaultMessage: "What's new",
    },
    TR_READ_MORE: {
        id: 'TR_READ_MORE',
        defaultMessage: 'Read more',
    },
    TR_SHOW_OLDER_NEWS: {
        id: 'TR_SHOW_OLDER_NEWS',
        defaultMessage: 'Show older news',
    },
    TR_CHECK_FOR_DEVICES: {
        defaultMessage: 'Check for devices',
        id: 'TR_CHECK_FOR_DEVICES',
    },
    TR_ACQUIRE_DEVICE_TITLE: {
        defaultMessage: 'Trezor is being used in a browser',
        id: 'TR_ACQUIRE_DEVICE_TITLE',
    },
    TR_ACQUIRE_DEVICE_DESCRIPTION: {
        defaultMessage:
            'Please close the tab in your browser or click the button below to acquire the device since Trezor can be only used in one session.',
        id: 'TR_ACQUIRE_DEVICE_DESCRIPTION',
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
    TR_ALLOW_ANALYTICS: {
        defaultMessage: 'Allow anonymous data storing',
        id: 'TR_ALLOW_ANALYTICS',
    },
    TR_ALLOW_ANALYTICS_DESCRIPTION: {
        defaultMessage:
            'Trezor Suite does NOT track any balance-related or personal data, all anonymously',
        id: 'TR_ALLOW_ANALYTICS_DESCRIPTION',
    },
});

export default definedMessages;
