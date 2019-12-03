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
        defaultMessage: 'Do not upload words on the internet',
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
    TR_ACQUIRE_DEVICE_ERROR: {
        id: 'TR_ACQUIRE_DEVICE_ERROR',
        defaultMessage: 'Acquire device error',
    },
    TR_AUTHENTICATION_ERROR: {
        id: 'TR_AUTHENTICATION_ERROR',
        defaultMessage: 'Authentication error',
    },
    TR_ACCOUNT_DISCOVERY_ERROR: {
        id: 'TR_ACCOUNT_DISCOVERY_ERROR',
        defaultMessage: 'Account discovery error',
        description: 'Error during account discovery',
    },
    TR_TRANSACTION_ERROR: {
        id: 'TR_TRANSACTION_ERROR',
        defaultMessage: 'Transaction error',
        description: 'Error during signing a transaction',
    },
    TR_TRANSACTION_SUCCESS: {
        id: 'TR_TRANSACTION_SUCCESS',
        defaultMessage: 'Transaction has been sent successfully',
    },
    TR_SEE_TRANSACTION_DETAILS: {
        id: 'TR_SEE_TRANSACTION_DETAILS',
        defaultMessage: 'See transaction details',
    },
    TR_VERIFYING_ADDRESS_ERROR: {
        id: 'TR_VERIFYING_ADDRESS_ERROR',
        defaultMessage: 'Verifying address error',
    },
    TR_SIGN_MESSAGE_ERROR: {
        id: 'TR_SIGN_MESSAGE_ERROR',
        defaultMessage: 'Failed to sign message',
    },
    TR_VERIFY_MESSAGE_ERROR: {
        id: 'TR_VERIFY_MESSAGE_ERROR',
        defaultMessage: 'Failed to verify message',
    },
    TR_VERIFY_MESSAGE_SUCCESS: {
        id: 'TR_VERIFY_MESSAGE_SUCCESS',
        defaultMessage: 'Message has been successfully verified',
    },
    TR_SIGNATURE_IS_VALID: {
        id: 'TR_SIGNATURE_IS_VALID',
        defaultMessage: 'Signature is valid',
    },
    TR_CONTINUE: {
        id: 'TR_CONTINUE',
        defaultMessage: 'Continue',
        description: 'Continue button',
    },
    TR_BACK: {
        id: 'TR_BACK',
        defaultMessage: 'Back',
        description: 'Back button',
    },
    TR_SKIP_ALL: {
        id: 'TR_SKIP_ALL',
        defaultMessage: 'Skip onboarding',
        description: 'Button. Skip the entire onboarding process.',
    },
    TR_SKIP: {
        id: 'TR_SKIP',
        defaultMessage: 'Skip',
        description: 'Button. Skip one step',
    },
    TR_CONTACT_SUPPORT: {
        id: 'TR_CONTACT_SUPPORT',
        defaultMessage: 'Contact support',
        description: 'Button to click to contact support',
    },
    TR_RETRY: {
        id: 'TR_RETRY',
        defaultMessage: 'Retry',
        description: 'Retry button',
    },
    TR_CONNECT_YOUR_DEVICE: {
        id: 'TR_CONNECT_YOUR_DEVICE',
        defaultMessage: 'Connect your device',
        description: 'Prompt to user to connect his device.',
    },
    TR_SUBMIT: {
        id: 'TR_SUBMIT',
        defaultMessage: 'Submit',
        description: 'Button text',
    },
    TR_WIPE_DEVICE: {
        id: 'TR_RETRY_BACKUP',
        defaultMessage: 'Retry backup',
        description: 'Button',
    },
    TR_RESET_DEVICE: {
        id: 'TR_RESET_DEVICE',
        defaultMessage: 'Reset device',
        description: 'Button.',
    },
    TR_LEARN_MORE_LINK: {
        id: 'TR_LEARN_MORE_LINK',
        defaultMessage: 'Learn more.',
        description: 'Link to Trezor wiki.',
    },
    TR_ENTER_PIN: {
        id: 'TR_ENTER_PIN',
        defaultMessage: 'Enter PIN',
        description: 'Button. Submit PIN',
    },
    TR_CANCEL: {
        id: 'TR_CANCEL',
        defaultMessage: 'Cancel',
    },
    TR_TRY_AGAIN: {
        id: 'TR_TRY_AGAIN',
        defaultMessage: 'Try again',
        description: 'Try to run the process again',
    },
    TR_IS_NOT_NEW_DEVICE: {
        id: 'TR_IS_NOT_NEW_DEVICE',
        defaultMessage:
            'According to your decision in a previous step, this was supposed to be a fresh device. But we were able to detect already installed firmware on it.',
        description:
            'Just a message that we show after user selects that he wants to setup device as a new one but we detect that it apparently is not',
    },
    TR_DEVICE_YOU_RECONNECTED_IS_DIFFERENT: {
        id: 'TR_DEVICE_YOU_RECONNECTED_IS_DIFFERENT',
        defaultMessage:
            'Device you reconnected is different from the previous device. Connect the right one.',
        description:
            'Text that indicates that user reconnected different device than he was working with before',
    },
    TR_RECONNECT_HEADER: {
        id: 'TR_RECONNECT_HEADER',
        defaultMessage: 'Reconnect your device',
    },
    TR_RECONNECT_TEXT: {
        id: 'TR_RECONNECT_TEXT',
        defaultMessage: 'We lost connection with your device. This might mean:',
    },
    TR_RECONNECT_TROUBLESHOOT_CABEL: {
        id: 'TR_RECONNECT_TROUBLESHOOT_CABEL',
        defaultMessage: 'Cable is broken, try another one',
        description: '',
    },
    TR_RECONNECT_TROUBLESHOOT_CONNECTION: {
        id: 'TR_RECONNECT_TROUBLESHOOT_CONNECTION',
        defaultMessage: 'Device is not well connected to the cable',
        description: '',
    },
    TR_RECONNECT_TROUBLESHOOT_BRIDGE: {
        id: 'TR_RECONNECT_TROUBLESHOOT_BRIDGE',
        defaultMessage: 'Trezor bridge might have stopped working, try restarting',
        description: '',
    },
    TR_DEVICE_LABEL_IS_NOT_CONNECTED: {
        id: 'TR_DEVICE_LABEL_IS_NOT_CONNECTED',
        defaultMessage: 'Device {deviceLabel} is not connected',
    },
    TR_DEVICE_LABEL_IS_NOT_BACKED_UP: {
        id: 'TR_DEVICE_LABEL_IS_NOT_BACKED_UP',
        defaultMessage: 'Device {deviceLabel} is not backed up',
    },
    TR_PLEASE_CONNECT_YOUR_DEVICE: {
        id: 'TR_PLEASE_CONNECT_YOUR_DEVICE',
        defaultMessage: 'Please connect your device to continue with the verification process',
    },
    TR_PLEASE_ENABLE_PASSPHRASE: {
        id: 'TR_PLEASE_ENABLE_PASSPHRASE',
        defaultMessage:
            'Please enable passphrase settings to continue with the verification process.',
    },
    TR_PLEASE_DISABLE_PASSPHRASE: {
        id: 'TR_PLEASE_DISABLE_PASSPHRASE',
        defaultMessage:
            'Please disable passphrase settings to continue with the verification process.',
    },
    TR_SHOW_UNVERIFIED_ADDRESS: {
        id: 'TR_SHOW_UNVERIFIED_ADDRESS',
        defaultMessage: 'Show unverified address',
    },
    TR_TO_PREVENT_PHISHING_ATTACKS_COMMA: {
        id: 'TR_TO_PREVENT_PHISHING_ATTACKS_COMMA',
        defaultMessage:
            'To prevent phishing attacks, you should verify the address on your Trezor first. {claim}',
    },
    TR_CREATE_NEW_INSTANCE: {
        id: 'TR_CREATE_NEW_INSTANCE',
        defaultMessage: 'Create new instance',
    },
    TR_INSTANCE_NAME_IN_USE: {
        id: 'TR_INSTANCE_NAME_IN_USE',
        defaultMessage: 'Instance name is already in use',
    },
    TR_INSTANCE_NAME: {
        id: 'TR_INSTANCE_NAME',
        defaultMessage: 'Instance name',
    },
    TR_THIS_WILL_CREATE_NEW_INSTANCE: {
        id: 'TR_THIS_WILL_CREATE_NEW_INSTANCE',
        defaultMessage:
            'This will create new instance of device which can be used with different passphrase',
    },
    TR_CLONE: {
        id: 'TR_CLONE',
        defaultMessage: 'Clone "{deviceLabel}"?',
    },
    TR_DONT_FORGET: {
        id: 'TR_DONT_FORGET',
        defaultMessage: "Don't forget",
        description: 'Button in remember/forget dialog',
    },
    TR_FORGETTING_ONLY_REMOVES_THE_DEVICE_FROM: {
        id: 'TR_FORGETTING_ONLY_REMOVES_THE_DEVICE_FROM',
        defaultMessage:
            'Forgetting only removes the device from the list on the left, your coins are still safe and you can access them by reconnecting your Trezor again.',
    },
    TR_FORGET_LABEL: {
        id: 'TR_FORGET_LABEL',
        defaultMessage: 'Forget {deviceLabel}?',
    },
    TR_PASSPHRASE_LABEL: {
        id: 'TR_PASSPHRASE_LABEL',
        defaultMessage: 'Enter "{deviceLabel}" passphrase',
    },
    TR_COMPLETE_ACTION_ON_DEVICE: {
        id: 'TR_COMPLETE_ACTION_ON_DEVICE',
        defaultMessage: 'Complete the action on "{deviceLabel}" device',
    },
    TR_PASSPHRASE_CASE_SENSITIVE: {
        id: 'PASSPHRASE_CASE_SENSITIVE',
        defaultMessage: 'Note: Passphrase is case-sensitive.',
    },
    TR_PASSPHRASE_BLANK: {
        id: 'PASSPHRASE_BLANK',
        defaultMessage: 'Leave passphrase blank to access your default wallet',
    },
    TR_PASSPHRASE_DO_NOT_MATCH: {
        id: 'PASSPHRASE_DO_NOT_MATCH',
        defaultMessage: 'Passphrases do not match!',
    },
    TR_SHOW_PASSPHRASE: {
        id: 'SHOW_PASSPHRASE',
        defaultMessage: 'Show passphrase',
    },
    TR_ENTER_PASSPHRASE: {
        id: 'TR_ENTER_PASSPHRASE',
        defaultMessage: 'Enter',
    },
    TR_THE_PIN_LAYOUT_IS_DISPLAYED: {
        id: 'TR_THE_PIN_LAYOUT_IS_DISPLAYED',
        defaultMessage: 'The PIN layout is displayed on your Trezor.',
    },
    TR_HOW_PIN_WORKS: {
        id: 'TR_HOW_PIN_WORKS',
        defaultMessage: 'Not sure how PIN works?',
    },
    TR_REQUEST_INSTANCE_HEADER: {
        id: 'TR_REQUEST_INSTANCE_HEADER',
        defaultMessage: 'Create hidden wallet with name "{deviceLabel}"?',
        description: 'Create virtual device with passphrase',
    },
    TR_REQUEST_INSTANCE_DESCRIPTION: {
        id: 'TR_REQUEST_INSTANCE_DESCRIPTION',
        defaultMessage:
            'Passphrase is an optional feature of the Trezor device that is recommended for advanced users only. It is a word or a sentence of your choice. Its main purpose is to access a hidden wallet.',
    },
    TR_CREATE_INSTANCE: {
        id: 'TR_CREATE_INSTANCE',
        defaultMessage: 'Create hidden wallet',
        description: 'Create button',
    },
    TR_SELECT_WALLET_TYPE_FOR: {
        id: 'TR_SELECT_WALLET_TYPE_FOR',
        defaultMessage: 'Select wallet type for {deviceLabel}',
    },
    TR_CHANGE_WALLET_TYPE_FOR: {
        id: 'TR_CHANGE_WALLET_TYPE_FOR',
        defaultMessage: 'Change wallet type for {deviceLabel}',
    },
    TR_STANDARD_WALLET: {
        id: 'TR_STANDARD_WALLET',
        defaultMessage: 'Standard wallet',
    },
    TR_HIDDEN_WALLET: {
        id: 'TR_HIDDEN_WALLET',
        defaultMessage: 'Hidden wallet',
    },
    TR_CONTINUE_TO_ACCESS_STANDARD_WALLET: {
        id: 'TR_CONTINUE_TO_ACCESS_STANDARD_WALLET',
        defaultMessage: 'Continue to access your standard wallet.',
    },
    TR_PASSPHRASE_IS_OPTIONAL_FEATURE: {
        id: 'TR_PASSPHRASE_IS_OPTIONAL_FEATURE',
        defaultMessage:
            'Passphrase is an optional feature of the Trezor device that is recommended for advanced users only. It is a word or a sentence of your choice. Its main purpose is to access a hidden wallet.',
    },
    TR_ASKED_ENTER_YOUR_PASSPHRASE_TO_UNLOCK: {
        id: 'TR_ASKED_ENTER_YOUR_PASSPHRASE_TO_UNLOCK',
        defaultMessage: 'You will be asked to enter your passphrase to unlock your hidden wallet.',
    },
    TR_MINIMUM_ACCOUNT_RESERVE_REQUIRED: {
        id: 'TR_MINIMUM_ACCOUNT_RESERVE_REQUIRED',
        defaultMessage: 'Minimum account reserve required',
    },
    TR_RIPPLE_ADDRESSES_REQUIRE_MINIMUM_BALANCE: {
        id: 'TR_RIPPLE_ADDRESSES_REQUIRE_MINIMUM_BALANCE',
        defaultMessage:
            'Ripple addresses require a minimum balance of {minBalance} XRP to activate and maintain the account. {TR_LEARN_MORE}',
    },
    TR_BOOKMARK_HEADING: {
        id: 'TR_BOOKMARK_HEADING',
        defaultMessage: 'Browser bookmark',
        description: 'Heading in bookmark step',
    },
    TR_BOOKMARK_SUBHEADING: {
        id: 'TR_BOOKMARK_SUBHEADING',
        defaultMessage:
            'Protect yourself against {TR_PHISHING_ATTACKS}. Bookmark Trezor Wallet (wallet.trezor.io) to avoid visiting fake sites.',
        description: 'Heading in bookmark step',
    },
    TR_PHISHING_ATTACKS: {
        id: 'TR_PHISHING_ATTACKS',
        defaultMessage: 'phishing attacks',
        description:
            'Term, type of hacker attack trying to fool user to enter his sensitive data into a fake site.',
    },
    TR_USE_THE_KEYBOARD_SHORTCUT: {
        id: 'TR_USE_THE_KEYBOARD_SHORTCUT',
        defaultMessage: 'Use the keyboard shortcut:',
        description: 'We want user to pres Ctrl + D',
    },
    TR_FIRMWARE_HEADING: {
        id: 'TR_FIRMWARE_HEADING',
        defaultMessage: 'Get the latest firmware',
        description: 'Heading on firmware page',
    },
    TR_FIRMWARE_SUBHEADING: {
        id: 'TR_FIRMWARE_SUBHEADING',
        defaultMessage:
            'Your Trezor is shipped without firmware installed to ensure that you can get started with the latest features right away. The authenticity of the installed firmware is always checked during device start. If the firmware is not correctly signed by SatoshiLabs, your Trezor will display a warning.',
        description: 'Main text on firmware page for devices without firmware.',
    },
    TR_INSTALL: {
        id: 'TR_INSTALL',
        defaultMessage: 'Install',
        description: 'Install button',
    },
    TR_INSTALLING: {
        id: 'TR_INSTALLING',
        defaultMessage: 'Do not disconnect your device. Installing',
        description: 'Message that is visible when installing process is in progress.',
    },
    TR_INSTALL_ERROR_OCCURRED: {
        id: 'TR_INSTALL_ERROR_OCCURRED',
        defaultMessage: 'Error occurred during firmware install: {error}',
        description: 'Error message when installing firmware to device',
    },
    TR_FETCH_ERROR_OCCURRED: {
        id: 'TR_FETCH_ERROR_OCCURRED',
        defaultMessage: 'Error occured during firmware download: {error}',
        description: 'Error message when downloading firmware',
    },
    TR_FIRMWARE_INSTALLED: {
        id: 'TR_FIRMWARE_INSTALLED',
        defaultMessage: 'Perfect. The newest firmware is installed. Time to continue',
        description: 'Message to display in case firmware is installed',
    },
    TR_CONNECT_YOUR_DEVICE_AGAIN: {
        id: 'TR_CONNECT_YOUR_DEVICE_AGAIN',
        defaultMessage: 'Connect your device again',
        description: 'Prompt to connect device.',
    },
    TR_DISCONNECT_YOUR_DEVICE: {
        id: 'TR_DISCONNECT_YOUR_DEVICE',
        defaultMessage: 'Disconnect your device',
        description: 'Prompt to disconnect device.',
    },
    TR_WAIT_FOR_REBOOT: {
        id: 'TR_WAIT_FOR_REBOOT',
        defaultMessage: 'Wait for your device to reboot',
        description: 'Info what is happening with users device.',
    },
    TR_FIRMWARE_INSTALLED_TEXT: {
        id: 'TR_FIRMWARE_INSTALLED_TEXT',
        defaultMessage: 'This device has already installed firmware version: {version}',
        description: 'Text to display in case device has firmware installed but it is outdated',
    },
    TR_HOLOGRAM_STEP_HEADING: {
        id: 'TR_HOLOGRAM_STEPHEADING',
        defaultMessage: 'Hologram check',
        description: 'Heading on hologram step page',
    },
    TR_HOLOGRAM_STEP_SUBHEADING: {
        id: 'TR_HOLOGRAM_STEP_SUBHEADING',
        defaultMessage: 'Please make sure hologram protecting your device is authentic',
        description: 'Subheading on hologram step page',
    },
    TR_HOLOGRAM_STEP_ACTION_OK: {
        id: 'TR_HOLOGRAM_STEP_ACTION_OK',
        defaultMessage: 'My hologram is OK',
        description: 'Button to click in allright case',
    },
    TR_HOLOGRAM_STEP_ACTION_NOT_OK: {
        id: 'TR_HOLOGRAM_STEP_ACTION_NOT_OK',
        defaultMessage: 'My hologram looks different',
        description: 'Button to click when hologram looks different',
    },
    TR_RESELLERS_LINK: {
        id: 'TR_RESELLERS_LINK',
        defaultMessage: 'a trusted reseller',
        description:
            'Part of sentence TR_DID_YOU_PURCHASE. Link to page with trusted resellers list',
    },
    TR_CONTACT_OUR_SUPPORT_LINK: {
        id: 'TR_CONTACT_OUR_SUPPORT_LINK',
        defaultMessage: 'contact our support',
        description: 'Part of sentence TR_DID_YOU_PURCHASE. Link to support',
    },
    TR_PACKAGING_LINK: {
        id: 'TR_PACKAGING_LINK',
        defaultMessage: 'here',
        description: 'Part of sentence TR_DID_YOU_PURCHASE. Link to support',
    },
    TR_DID_YOU_PURCHASE: {
        id: 'TR_DID_YOU_PURCHASE',
        defaultMessage:
            'Please note, that device packaging including holograms have changed over time. You can check packaging details {TR_PACKAGING_LINK}. Also be sure you made your purchase from {TR_RESELLERS_LINK}. Otherwise, the device you are holding in your hands might be a counterfeit. Please {TR_CONTACT_OUR_SUPPORT_LINK}',
        description: 'Text to display when user is unhappy with his hologram.',
    },
    TR_NAME_HEADING: {
        id: 'TR_NAME_HEADING',
        defaultMessage: 'Name your device',
        description: 'Heading in name step',
    },
    TR_NAME_HEADING_CHANGED: {
        id: 'TR_NAME_HEADING_CHANGED',
        defaultMessage: 'Hi, {label}',
        description: 'Subheading in name step after user changes label, so lets welcome him!',
    },
    TR_NAME_SUBHEADING: {
        id: 'TR_NAME_SUBHEADING',
        defaultMessage: 'Personalize your device with your own name.',
        description: 'Subheading in name step',
    },
    TR_NAME_CHANGED_TEXT: {
        id: 'TR_NAME_CHANGED_TEXT',
        defaultMessage:
            'Excellent, your device has a custom name now. It will be visible on your device display from now on.',
        description: 'Text to display after user has changed label.',
    },
    TR_NAME_ONLY_ASCII: {
        id: 'TR_NAME_ONLY_ASCII',
        defaultMessage: 'Name can contain only basic letters',
        description: 'Validation message in label input',
    },
    TR_NAME_TOO_LONG: {
        id: 'TR_NAME_TOO_LONG',
        defaultMessage: 'Name is too long',
        description: 'Validation message in label input',
    },
    TR_NAME_OK: {
        id: 'TR_NAME_OK',
        defaultMessage: 'Cool name',
        description: 'Validation message in label input',
    },
    TR_NAME_BORING: {
        id: 'TR_NAME_BORING',
        defaultMessage: 'Nah.. too boring, chose a different label',
        description: 'User shouldnt use My Trezor (default name) as their new custom name',
    },
    TR_FINAL_HEADING: {
        id: 'TR_FINAL_HEADING',
        defaultMessage: 'Good job! All done',
        description: 'Heading in newsletter step',
    },
    TR_FINAL_SUBHEADING: {
        id: 'TR_FINAL_SUBHEADING',
        defaultMessage: 'Now you are ready to enjoy bleeding edge security with Trezor.',
        description: 'Subheading in newsletter step',
    },
    TR_TREZOR_STABLE_WALLET: {
        id: 'TR_TREZOR_STABLE_WALLET',
        defaultMessage: 'Trezor stable wallet',
        description: 'Name of application that might be used with Trezor',
    },
    TR_TREZOR_STABLE_WALLET_DESCRIPTION: {
        id: 'TR_TREZOR_STABLE_WALLET_DESCRIPTION',
        defaultMessage: 'Web wallet with support of Bitcoin, Dash, Zcash and other coins.',
        description: 'Description of application that might be used with Trezor.',
    },
    TR_TREZOR_PASSWORD_MANAGER: {
        id: 'TR_TREZOR_PASSWORD_MANAGER',
        defaultMessage: 'Password Manager',
        description: 'Name of application that might be used with Trezor',
    },
    TR_TREZOR_PASSWORD_MANAGER_DESCRIPTION: {
        id: 'TR_TREZOR_PASSWORD_MANAGER_DESCRIPTION',
        defaultMessage: 'A safe way how to manage your credentials with Trezor.',
        description: 'Description of application that might be used with Trezor',
    },
    TR_TREZOR_ETHEREUM_WALLET: {
        id: 'TR_TREZOR_ETHEREUM_WALLET',
        defaultMessage: 'Ethereum beta wallet',
        description: 'Name of application that might be used with Trezor',
    },
    TR_TREZOR_ETHEREUM_WALLET_DESCRIPTION: {
        id: 'TR_TREZOR_ETHEREUM_WALLET_DESCRIPTION',
        defaultMessage: 'New wallet with support of Ethereum and Ripple',
        description: 'Description of application that might be used with Trezor',
    },
    TR_BRIDGE_HEADING: {
        id: 'TR_BRIDGE_HEADING',
        defaultMessage: 'Trezor Bridge',
        description: 'Heading on bridge page',
    },
    TR_BRIDGE_SUBHEADING: {
        id: 'TR_BRIDGE_SUBHEADING',
        defaultMessage:
            'Trezor Bridge is a communication tool to facilitate the connection between your Trezor and your internet browser.',
        description: 'Description what Trezor Bridge is',
    },
    TR_DOWNLOAD: {
        id: 'TR_DOWNLOAD',
        defaultMessage: 'Download',
        description: 'Download button',
    },
    TR_BRIDGE_IS_RUNNING: {
        id: 'TR_BRIDGE_IS_RUNNING',
        defaultMessage: 'Trezor bridge is up and running',
        description: 'Text that indicates that browser can communicate with Trezor Bridge.',
    },
    TR_DETECTING_BRIDGE: {
        id: 'TR_DETECTING_BRIDGE',
        defaultMessage: 'Detecting Trezor Bridge instalation',
        description: 'Message to show after user clicks download bridge.',
    },
    TR_NOT_RUNNING: {
        id: 'TR_NOT_RUNNING',
        defaultMessage: 'not running',
        description: 'Bridge status in box next to heading',
    },
    TR_WAIT_FOR_FILE_TO_DOWNLOAD: {
        id: 'TR_WAIT_FOR_FILE_TO_DOWNLOAD',
        defaultMessage: 'Wait for file to download',
        description: 'Instruction for installing Trezor Bridge',
    },
    TR_DOUBLE_CLICK_IT_TO_RUN_INSTALLER: {
        id: 'TR_DOUBLE_CLICK_IT_TO_RUN_INSTALLER',
        defaultMessage: 'Double click it to run installer',
        description: 'Instruction for installing Trezor Bridge',
    },
    TR_TREZOR_BRIDGE_IS_NOT_RUNNING: {
        id: 'TR_TREZOR_BRIDGE_IS_NOT_RUNNING',
        defaultMessage: 'Trezor Bridge is not running',
        description: '',
    },
    TR_TREZOR_BRIDGE_IS_RUNNING_VERSION: {
        id: 'TR_TREZOR_BRIDGE_IS_RUNNING_VERSION',
        defaultMessage: 'Trezor Bridge is running. Version: {version}',
        description: '',
    },
    TR_DEVICE_LABEL: {
        id: 'TR_DEVICE_LABEL',
        defaultMessage: 'Device label: {label}.',
        description: 'Display label of device',
    },
    TR_DEVICE_FIRMWARE_VERSION: {
        id: 'TR_DEVICE_FIRMWARE_VERSION',
        defaultMessage: 'Device firmware: {firmware}.',
        description: 'Display firmware of device',
    },
    TR_USER_HAS_WORKED_WITH_THIS_DEVICE: {
        id: 'TR_USER_HAS_WORKDED_WITH_THE_DEVICE',
        defaultMessage: 'I have worked with it before',
        description: 'Option to click when troubleshooting initialized device.',
    },
    TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE: {
        id: 'TR_USER_HAS_NOT_WORKDED_WITH_THIS_DEVICE',
        defaultMessage: 'It is a brand new device, just unpacked',
        description: 'Option to click when troubleshooting initialized device.',
    },
    TR_INSTRUCTION_TO_SKIP: {
        id: 'TR_INSTRUCTION_TO_SKIP',
        defaultMessage:
            'You should skip setup and continue to wallet and check if you have any funds on this device.',
        description:
            'Instruction what to do when user knows the device he is holding was manipulated by him, not someone else.',
    },
    TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE_INSTRUCTIONS: {
        id: 'TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE_INSTRUCTIONS',
        defaultMessage:
            'In that case you should immediately contact Trezor support with detailed information on your purchase and refrain from using this device.',
        description: 'What to do if device is already initialized but not by user.',
    },
    TR_FOUND_OK_DEVICE: {
        id: 'TR_FOUND_OK_DEVICE',
        defaultMessage: 'Found an empty device, yay! You can continue now.',
        description: 'Case when device was connected and it is in expected state (not initialized)',
    },
    TR_PIN_HEADING_FIRST: {
        id: 'TR_PIN_HEADING_FIRST',
        defaultMessage: 'Set new PIN',
        description: 'Heading in PIN page when entering PIN for the first time',
    },
    TR_PIN_HEADING_REPEAT: {
        id: 'TR_PIN_HEADING_REPEAT',
        defaultMessage: 'Repeat PIN',
        description: 'Heading in PIN page when repeating PIN',
    },
    TR_PIN_HEADING_SUCCESS: {
        id: 'TR_PIN_HEADING_SUCCESS',
        defaultMessage: 'PIN enabled',
        description: 'Heading in PIN page when PIN set',
    },
    TR_PIN_HEADING_MISMATCH: {
        id: 'TR_PIN_HEADING_MISMATCH',
        defaultMessage: 'PIN mismatch',
        description: 'Heading in PIN page when PIN repeated incorrectly',
    },
    TR_PIN_SUBHEADING: {
        id: 'TR_PIN_SUBHEADING',
        defaultMessage: 'Protect device from unauthorized access by using a strong pin.',
        description: 'Subheading on PIN page',
    },
    TR_SET_PIN: {
        id: 'TR_SET_PIN',
        defaultMessage: 'Set pin',
        description: 'Button text',
    },
    TR_PIN_ENTERING_DESCRIPTION: {
        id: 'TR_PIN_ENTERING_DESCRIPTION',
        defaultMessage:
            'In order to secure maximum security, we do not display pin on your computer. We will just show a blind matrix, real layout is displayed on your device.',
        description: 'Text describe how to enter PIN o trezor device',
    },
    TR_FIRST_PIN_ENTERED: {
        id: 'TR_FIRST_PIN_ENTERED',
        defaultMessage:
            'Good. You entered a new pin. But to make sure you did not make mistake, please enter it again. Look at your device now, numbers are now different.',
        description: 'Text describing what happens after user enters PIN for the first time.',
    },
    TR_PIN_SET_SUCCESS: {
        id: 'TR_PIN_SET_SUCCESS',
        defaultMessage: 'Purfect! Your device is now secured by pin.',
        description: 'Longer text indicating PIN was set succesfully.',
    },
    TR_PIN_ERROR_TROUBLESHOOT: {
        id: 'TR_PIN_ERROR_TROUBLESHOOT',
        defaultMessage:
            'Are you confused, how PIN works? You can always refer to our {TR_DOCUMENTATION}',
        description: 'Troubleshooting text after user enters second PIN incorrectly.',
    },
    TR_DOCUMENTATION: {
        id: 'TR_DOCUMENTATION',
        defaultMessage: 'documentation',
        description: 'Link to trezor documentation (wiki)',
    },
    TR_START_AGAIN: {
        id: 'TR_START_AGAIN',
        defaultMessage: 'Start again',
        description: 'Button text',
    },
    TR_START_RECOVERY: {
        id: 'TR_START_RECOVERY',
        defaultMessage: 'Start recovery',
        description: 'Button.',
    },
    TR_CHECK_YOUR_DEVICE: {
        id: 'TR_CHECK_YOUR_DEVICE',
        defaultMessage: 'Check your device',
        description: 'Placeholder in seed input asking user to pay attention to his device',
    },
    TR_RECOVERY_ERROR: {
        id: 'TR_RECOVERY_ERROR',
        defaultMessage: 'Device recovery failed with error: {error}',
        description: 'Error during recovery. For example wrong word retyped or device disconnected',
    },
    TR_RECOVERY_SUCCESS: {
        id: 'TR_RECOVERY_SUCCESS',
        defaultMessage: 'Excellent, you recovered device from seed.',
        description: 'This is displayed upon successful recovery',
    },
    TR_RECOVER_HEADING: {
        id: 'TR_RECOVER_HEADING',
        defaultMessage: 'Recover your device',
        description: 'Heading in recover page',
    },
    TR_RECOVER_SUBHEADING: {
        id: 'TR_RECOVER_SUBHEADING',
        defaultMessage:
            'It is possible to re-create device from bip39 backup. First of all, chose number of words of your backup.',
        description: 'Subheading in recover page. Basic info about recovery',
    },
    TR_WORDS: {
        id: 'TR_WORDS',
        defaultMessage: '{count} words',
        description: 'Number of words. For example: 12 words',
    },
    TR_RECOVERY_TYPES_DESCRIPTION: {
        id: 'TR_RECOVERY_TYPES_DESCRIPTION',
        defaultMessage:
            'Both methods are safe. Basic recovery uses on computer input of words in randomized order. Advanced recovery uses on-screen input to load your recovery seed. {TR_LEARN_MORE_LINK}',
        description: 'There are two methods of recovery for T1. This is a short explanation text.',
    },
    TR_BASIC_RECOVERY_OPTION: {
        id: 'TR_BASIC_RECOVERY_OPTION',
        defaultMessage: 'Basic recovery (2 minutes)',
        description: 'Button for selecting basic recovery option',
    },
    TR_ADVANCED_RECOVERY_OPTION: {
        id: 'TR_ADVANCED_RECOVERY_OPTION',
        defaultMessage: 'Advanced recovery (5 minutes)',
        description: 'Button for selecting advanced recovery option',
    },
    TR_RECOVER_SUBHEADING_MODEL_T: {
        id: 'TR_RECOVER_SUBHEADING_MODEL_T',
        defaultMessage: 'On model T the entire recovery process is doable on device.',
        description: 'Subheading in recover page. Basic info about recovery',
    },
    TR_ENTER_SEED_WORDS_INSTRUCTION: {
        id: 'TR_ENTER_SEED_WORDS_INSTRUCTION',
        defaultMessage: 'Enter words from your seed in order displayed on your device.',
        description:
            'User is instructed to enter words from seed (backup) into the form in browser',
    },
    TR_RANDOM_SEED_WORDS_DISCLAIMER: {
        id: 'TR_RANDOM_SEED_WORDS_DISCLAIMER',
        defaultMessage:
            'Please note, that to maximaze security, your device will ask you to enter {count} fake words that are not part of your seed.',
        description:
            'User is instructed to enter words from seed (backup) into the form in browser',
    },
    TR_MORE_WORDS_TO_ENTER: {
        id: 'TR_MORE_WORDS_TO_ENTER',
        defaultMessage: '{count} words to enter.',
        description: 'How many words will user need to enter before recovery is finished.',
    },
    TR_DESTINATION_TAG_IS_NOT_NUMBER: {
        id: 'TR_DESTINATION_TAG_IS_NOT_NUMBER',
        defaultMessage: 'Destination tag is not a number',
    },
    TR_DEVICE_IN_BOOTLOADER_MODE_INSTRUCTIONS: {
        id: 'TR_DEVICE_IN_BOOTLOADER_MODE_INSTRUCTIONS',
        defaultMessage:
            'Device is connected in bootloader mode. Plug out the USB cable and connect device again.',
        description: 'Instructions what to do if device is in bootloader mode',
    },
    TR_SEARCHING_TAKES_TOO_LONG: {
        id: 'TR_SEARCHING_TAKES_TOO_LONG',
        defaultMessage: 'Searching for your device takes too long, you might want to try to:',
        description:
            'Message to display when device is not detected after a decent period of time.',
    },
    TR_RECONNECT_INSTRUCTION: {
        id: 'TR_RECONNECT_INSTRUCTION',
        defaultMessage: 'Reconnect your device and wait for a while',
        description: 'Troubleshooting instruction',
    },
    TR_REFRESH_INSTRUCTION: {
        id: 'TR_REFRESH_INSTRUCTION',
        defaultMessage: 'Refresh your internet browser window',
        description: 'Troubleshooting instruction',
    },
    TR_ANOTHER_CABLE_INSTRUCTION: {
        id: 'TR_ANOTHER_CABLE_INSTRUCTION',
        defaultMessage: 'Try using another cable',
        description: 'Troubleshooting instruction',
    },
    TR_LAST_RESORT_INSTRUCTION: {
        id: 'TR_LAST_RESORT_INSTRUCTION',
        defaultMessage: 'If nothing helps, {ContactSupportLink}',
        description: 'Troubleshooting instruction. See TR_CONTACT_TREZOR_SUPPORT_LINK',
    },
    TR_CONTACT_TREZOR_SUPPORT_LINK: {
        id: 'TR_CONTACT_TREZOR_SUPPORT_LINK',
        defaultMessage: 'contact Trezor support.',
        description:
            'Full sentences: If nothing helps, contact Trezor support. See TR_LAST_RESORT_INSTRUCTION',
    },
    TR_MAKE_SURE_IT_IS_WELL_CONNECTED: {
        id: 'TR_MAKE_SURE_IT_IS_WELL_CONNECTED',
        defaultMessage: 'Make sure your device is well connected to avoid communication failures.',
        description: 'Instruction for connecting device.',
    },
    TR_SEARCHING_FOR_YOUR_DEVICE: {
        id: 'TR_SEARCHING_FOR_YOUR_DEVICE',
        defaultMessage: 'Searching for your device',
        description: 'Indication that we app does not see connected device yet.',
    },
    TR_BALANCE: {
        id: 'TR_BALANCE',
        defaultMessage: 'Balance',
    },
    TR_RATE: {
        id: 'TR_RATE',
        defaultMessage: 'Rate',
    },
    TR_RESERVE: {
        id: 'TR_RESERVE',
        defaultMessage: 'Reserve',
        description: 'Label for minimal XRP account reserve',
    },
    TR_FIAT_RATES_ARE_NOT_CURRENTLY: {
        id: 'TR_FIAT_RATES_ARE_NOT_CURRENTLY',
        defaultMessage: 'Fiat rates are not currently available.',
    },
    TR_YOU_WERE_DISCONNECTED_DOT: {
        id: 'TR_YOU_WERE_DISCONNECTED_DOT',
        defaultMessage: 'You were disconnected.',
    },
    TR_PLEASE_RELOAD_THE_PAGE_DOT: {
        id: 'TR_PLEASE_RELOAD_THE_PAGE_DOT',
        defaultMessage: 'Please check your Internet connection and reload the page.',
    },
    TR_IF_WRONG_PASSPHRASE: {
        id: 'TR_IF_WRONG_PASSPHRASE',
        defaultMessage:
            'If you enter a wrong passphrase, you will not unlock the desired hidden wallet.',
    },
});

export default definedMessages;
