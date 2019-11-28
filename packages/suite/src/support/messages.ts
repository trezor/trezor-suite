import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    TR_CANNOT_SEND_TO_MYSELF: {
        defaultMessage: 'Cannot send to myself',
        id: 'CANNOT_SEND_TO_MYSELF',
    },
    TR_ACCOUNT_HASH: {
        defaultMessage: 'Account #{number}',
        description: 'Used in auto-generated account label',
        id: 'TR_ACCOUNT_HASH',
    },
    TR_ADD_FRESH_ADDRESS: {
        defaultMessage: 'Add fresh address',
        id: 'TR_ADD_FRESH_ADDRESS',
    },
    TR_ADD_MORE_COINS: {
        defaultMessage: 'Add more coins',
        id: 'TR_ADD_MORE_COINS',
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
    TR_APPLICATION_SETTINGS: {
        defaultMessage: 'Application settings',
        id: 'TR_APPLICATION_SETTINGS',
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
    TR_BACKUP_HEADING: {
        defaultMessage: 'Create or recover',
        description: 'Heading in start page',
        id: 'TR_BACKUP_HEADING',
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
    TR_BTC: {
        defaultMessage: 'Transfer cost in XRP drops',
        id: 'TR_XRP_TRANSFER_COST',
    },
    TR_CALCULATING_DOT_DOT: {
        defaultMessage: 'Calculating...',
        description:
            'Used when calculating gas limit based on data input in ethereum advanced send form',
        id: 'TR_CALCULATING_DOT_DOT',
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
    TR_CHECK_PGP_SIGNATURE: {
        defaultMessage: 'Check PGP signature',
        id: 'TR_CHECK_PGP_SIGNATURE',
    },
    TR_CLEAR: {
        defaultMessage: 'Clear',
        description: 'Clear form button',
        id: 'TR_CLEAR',
    },
    TR_CLICK_HERE_TO_USE_THEM: {
        defaultMessage: 'Click here to use them',
        description: 'Button to use recommended updated fees.',
        id: 'TR_CLICK_HERE_TO_USE_THEM',
    },
    TR_CLOSE: {
        defaultMessage: 'Close',
        id: 'TR_CLOSE',
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
    TR_CUSTOM_FEE_IS_NOT_VALID: {
        defaultMessage: 'Fee is not a number',
        id: 'TR_CUSTOM_FEE_IS_NOT_NUMBER',
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
    TR_DEVICE_IS_NOT_CONNECTED: {
        defaultMessage: 'Device is not connected',
        id: 'TR_DEVICE_IS_NOT_CONNECTED',
    },
    TR_DEVICE_IS_UNAVAILABLE: {
        defaultMessage: 'Device is unavailable',
        id: 'TR_DEVICE_IS_UNAVAILABLE',
    },
    TR_DEVICE_LABEL_ACCOUNT_HASH: {
        defaultMessage: '{deviceLabel} Account #{number}',
        description: 'Used in auto-generated account label',
        id: 'TR_DEVICE_LABEL_ACCOUNT_HASH',
    },
    TR_DEVICE_LABEL_IS_UNAVAILABLE: {
        defaultMessage: 'Device "{deviceLabel}" is unavailable',
        id: 'TR_DEVICE_LABEL_IS_UNAVAILABLE',
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
    TR_DONT_UPGRADE_BRIDGE: {
        defaultMessage: "No, I don't want to upgrade Bridge now",
        id: 'TR_DONT_UPGRADE_BRIDGE',
    },
    TR_DOWNLOAD_LATEST_BRIDGE: {
        defaultMessage: 'Download latest Bridge {version}',
        id: 'TR_DOWNLOAD_LATEST_BRIDGE',
    },
    TR_FEE: {
        defaultMessage: 'Fee',
        description: 'Label in Send form',
        id: 'TR_FEE',
    },
    TR_FORGET_DEVICE: {
        defaultMessage: 'Forget device',
        id: 'TR_FORGET_DEVICE',
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
    TR_GET_STARTED: {
        defaultMessage: 'Get started',
        description: 'Button on welcome page',
        id: 'TR_GET_STARTED',
    },
    TR_GO_TO_HIDDEN_WALLET: {
        defaultMessage: 'Go to your hidden wallet',
        id: 'TR_GO_TO_HIDDEN_WALLET',
    },
    TR_GO_TO_STANDARD_WALLET: {
        defaultMessage: 'Go to your standard wallet',
        id: 'TR_GO_TO_STANDARD_WALLET',
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
    TR_HIGH_FEE: {
        defaultMessage: 'High',
        description: 'fee level',
        id: 'TR_HIGH_FEE',
    },
    TR_I_HAVE_READ_INSTRUCTIONS: {
        defaultMessage: 'I have read the instructions and agree',
        description: 'Checkbox text',
        id: 'TR_I_HAVE_READ_INSTRUCTIONS',
    },
    TR_I_WILL_DO_THAT_LATER: {
        defaultMessage: 'I’ll do that later.',
        id: 'TR_I_WILL_DO_THAT_LATER',
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
    TR_LEARN_MORE_ABOUT_LATEST_VERSION: {
        defaultMessage: 'Learn more about latest version in {TR_CHANGELOG}.',
        id: 'TR_LEARN_MORE_ABOUT_LATEST_VERSION',
    },
    TR_LOADING_ACCOUNTS: {
        defaultMessage: 'Loading accounts',
        id: 'TR_LOADING_ACCOUNTS',
    },
    TR_LOADING_DOT_DOT_DOT: {
        defaultMessage: 'Loading...',
        id: 'TR_LOADING_DOT_DOT_DOT',
    },
    TR_LOADING_TRANSACTIONS: {
        defaultMessage: 'Loading transactions',
        id: 'TR_LOADING_TRANSACTIONS',
    },
    TR_LOCAL_CURRENCY: {
        defaultMessage: 'Local currency',
        id: 'TR_LOCAL_CURRENCY',
    },
    TR_LOOKS_LIKE_IT_IS_DEVICE_LABEL: {
        defaultMessage:
            'Looks like it is {deviceLabel} Account #{number} address of {network} network',
        description: 'Example: Looks like it is My Trezor Account #1 address of ETH network',
        id: 'TR_LOOKS_LIKE_IT_IS_DEVICE_LABEL',
    },
    TR_LOW_FEE: {
        defaultMessage: 'Low',
        description: 'fee level',
        id: 'TR_LOW_FEE',
    },
    TR_MESSAGE: {
        defaultMessage: 'Message',
        description: 'Used as a label for message input field in Sign and Verify form',
        id: 'TR_MESSAGE',
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
        id: 'TR_RECEIVE_NETWORK_UNKNOWN',
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
    TR_NO_TRANSACTIONS: {
        defaultMessage: 'No Transactions :(',
        id: 'TR_NO_TRANSACTIONS',
    },
    TR_NORMAL_FEE: {
        defaultMessage: 'Normal',
        description: 'fee level',
        id: 'TR_NORMAL_FEE',
    },
    TR_PENDING: {
        defaultMessage: 'Pending',
        description: 'Pending transaction with no confirmations',
        id: 'TR_PENDING',
    },
    TR_PLEASE_SELECT_YOUR: {
        defaultMessage: 'Please select your coin',
        description: 'Title of the dashboard component if coin was not selected',
        id: 'TR_PLEASE_SELECT_YOUR',
    },
    TR_PLEASE_SELECT_YOUR_EMPTY: {
        defaultMessage: 'Please select your coin in {TR_SELECT_COINS_LINK}',
        description: 'Title of the dashboard component if coin was not selected',
        id: 'TR_PLEASE_SELECT_YOUR_EMPTY',
    },
    TR_PREVIOUS_ADDRESSES: {
        defaultMessage: 'Previous addresses',
        id: 'TR_PREVIOUS_ADDRESSES',
    },
    TR_QR_CODE: {
        defaultMessage: 'QR Code',
        id: 'TR_QR_CODE',
    },
    TR_RECEIVE_NETWORK: {
        defaultMessage: 'Receive {network}',
        id: 'TR_RECEIVE_NETWORK',
    },
    TR_RECEIVE_NETWORK_AND_TOKENS: {
        defaultMessage: 'Receive {network} and tokens',
        id: 'TR_RECEIVE_NETWORK_AND_TOKENS',
    },
    TR_RECOMMENDED_FEES_UPDATED: {
        defaultMessage: 'Recommended fees updated.',
        id: 'TR_RECOMMENDED_FEES_UPDATED',
    },
    TR_SATOSHILABS_CANNOT_BE_HELD_RESPONSIBLE: {
        defaultMessage:
            'SatoshiLabs cannot be held responsible for security liabilities or financial losses resulting from not following security instructions described here.',
        description: 'Liability disclaimer.',
        id: 'TR_SATOSHILABS_CANNOT_BE_HELD_RESPONSIBLE',
    },
    TR_SEED_IS_MORE_IMPORTANT_THAN_YOUR_DEVICE: {
        defaultMessage: 'Seed is more important than your device',
        description: 'Instruction what user should never do with his seed.',
        id: 'TR_SEED_IS_MORE_IMPORTANT_THAN_YOUR_DEVICE',
    },
    TR_SEED_MANUAL_LINK: {
        defaultMessage: 'recovery seed',
        description: 'Link. Part of TR_BACKUP_SUBHEADING_1',
        id: 'TR_SEED_MANUAL_LINK',
    },
    TR_SELECT_COINS_LINK: {
        defaultMessage: 'application settings',
        id: 'TR_SELECT_COINS_LINK',
    },
    TR_SEND: {
        defaultMessage: 'Send {amount}',
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
    TR_SET_DEFAULT: {
        defaultMessage: 'Set default',
        id: 'TR_SET_DEFAULT',
    },
    TR_SET_MAX: {
        defaultMessage: 'Set max',
        description: 'Used for setting maximum amount in Send form',
        id: 'TR_SET_MAX',
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
    TR_SHOW_PREVIOUS_ADDRESSES: {
        defaultMessage: 'Show previous addresses',
        id: 'TR_SHOW_PREVIOUS_ADDRESSES',
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
    TR_SIGNATURE: {
        defaultMessage: 'Signature',
        description: 'Used as a label for signature input field in Sign and Verify form',
        id: 'TR_SIGNATURE',
    },
    TR_START_BACKUP: {
        defaultMessage: 'Start backup',
        description: 'Button text',
        id: 'TR_START_BACKUP',
    },
    TR_TAKE_ME_BACK_TO_WALLET: {
        defaultMessage: 'Take me back to the wallet',
        id: 'TR_TAKE_ME_BACK_TO_WALLET',
    },
    TR_TAKE_ME_TO_BITCOIN_WALLET: {
        defaultMessage: 'Take me to the Bitcoin wallet',
        id: 'TR_TAKE_ME_TO_BITCOIN_WALLET',
    },
    TR_THE_ACCOUNT_BALANCE_IS_HIDDEN: {
        defaultMessage: 'The account balance is hidden.',
        id: 'TR_THE_ACCOUNT_BALANCE_IS_HIDDEN',
    },
    TR_THE_CHANGES_ARE_SAVED: {
        defaultMessage: 'The changes are saved automatically as they are made',
        id: 'TR_THE_CHANGES_ARE_SAVED',
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
    TR_UNKNOWN_TRANSACTION: {
        defaultMessage: '(Unknown transaction)',
        id: 'TR_UNKNOWN_TRANSACTION',
    },
    TR_UPGRADE_FOR_THE_NEWEST_FEATURES_DOT: {
        defaultMessage: 'Upgrade for the newest features.',
        id: 'TR_UPGRADE_FOR_THE_NEWEST_FEATURES_DOT',
    },
    TR_USE_WALLET_NOW: {
        defaultMessage: 'Use wallet now',
        description: 'Button on welcome page, use can take shorcut directly to wallet',
        id: 'TR_USE_WALLET_NOW',
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
    TR_VERSION_IS_LOADING: {
        defaultMessage: 'Version is loading',
        id: 'TR_VERSION_IS_LOADING',
    },
    TR_VISIBLE_COINS: {
        defaultMessage: 'Visible coins',
        id: 'TR_VISIBLE_COINS',
    },
    TR_VISIBLE_COINS_EXPLAINED: {
        defaultMessage:
            'Select the coins you wish to see in the wallet interface. You will be able to change your preferences later.',
        id: 'TR_VISIBLE_COINS_EXPLAINED',
    },
    TR_VISIBLE_TESTNET_COINS: {
        defaultMessage: 'Visible testnet coins',
        id: 'TR_VISIBLE_TESTNET_COINS',
    },
    TR_VISIBLE_TESTNET_COINS_EXPLAINED: {
        defaultMessage:
            'Testnet coins dont have any value but you still may use them to learn and experiment.',
        id: 'TR_VISIBLE_TESTNET_COINS_EXPLAINED',
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
    TR_WIPE_DEVICE_AND_START_AGAIN: {
        defaultMessage: 'Wipe device and start again',
        description: 'Button text',
        id: 'TR_WIPE_DEVICE_AND_START_AGAIN',
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
    TR_YOU_WILL_GAIN_ACCESS: {
        defaultMessage: 'You will gain access to receiving & sending selected coin',
        description: 'Content of the dashboard component if coin was not selected',
        id: 'TR_YOU_WILL_GAIN_ACCESS',
    },
    TR_YOUR_TREZOR_IS_NOT_BACKED_UP: {
        defaultMessage: 'Your Trezor is not backed up',
        id: 'TR_YOUR_TREZOR_IS_NOT_BACKED_UP',
    },
    TR_DEVICE_USED_IN_OTHER: {
        id: 'TR_DEVICE_USED_IN_OTHER',
        defaultMessage: 'Device is used in other window',
    },
    TR_USE_YOUR_DEVICE_IN_THIS_WINDOW: {
        id: 'TR_USE_YOUR_DEVICE_IN_THIS_WINDOW',
        defaultMessage: 'Do you want to use your device in this window?',
    },
    TR_ACQUIRE_DEVICE: {
        id: 'TR_ACQUIRE_DEVICE',
        defaultMessage: 'Acquire device',
        description:
            'call-to-action to use device in current window when it is used in other window',
    },
    TR_SELECT_YOUR_DEVICE_HEADING: {
        id: 'TR_SELECT_YOUR_DEVICE_HEADING',
        defaultMessage: 'Select your device',
        description: 'Heading on select your device page',
    },
    TR_MODEL_ONE: {
        id: 'TR_MODEL_ONE',
        defaultMessage: 'Model one',
        description: 'Name of Trezor model 1',
    },
    TR_MODEL_T: {
        id: 'TR_MODEL_T',
        defaultMessage: 'Model T',
        description: 'Name of Trezor model T',
    }, 
    TR_DO_NOT_UPLOAD_INSTRUCTION: {
        id: 'TR_DO_NOT_UPLOAD_INSTRUCTION',
        defaultMessage: 'Do not upload words on the internet',w
        description: 'Instruction what user should never do with his seed.',
    },
    TR_HIDE_TO_SAFE_PLACE_INSTRUCTION: {
        id: 'TR_HIDE_TO_SAFE_PLACE_INSTRUCTION',
        defaultMessage: 'Hide them somewhere safe',
        description: 'Instruction what user should do with his seed.',
    },
    TR_DO_NOT_SAFE_IN_COMPUTER_INSTRUCTION: {
        id: 'TR_DO_NOT_SAFE_IN_COMPUTER_INSTRUCTION',
        defaultMessage: 'Do not write it into a computer',
        description: 'Instruction what user should never do with his seed.',
    },
    TR_DO_NOT_TAKE_PHOTO_INSTRUCTION: {
        id: 'TR_DO_NOT_TAKE_PHOTO_INSTRUCTION',
        defaultMessage: 'Do not take a photo of your recovery seed',
        description: 'Instruction what user should never do with his seed.',
    },
});

export default definedMessages;
