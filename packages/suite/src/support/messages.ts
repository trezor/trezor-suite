import { defineMessages } from 'react-intl';

export default defineMessages({
    TR_404_DESCRIPTION: {
        defaultMessage: 'Looks like a wrong URL or broken link.',
        id: 'TR_404_DESCRIPTION',
    },
    TR_404_GO_TO_DASHBOARD: {
        defaultMessage: 'Go to Dashboard',
        id: 'TR_404_GO_TO_DASHBOARD',
    },
    TR_404_TITLE: {
        defaultMessage: 'Error 404: Link not found',
        id: 'TR_404_TITLE',
    },
    TR_ACCESS_HIDDEN_WALLET: {
        defaultMessage: 'Access Passphrase wallet',
        id: 'TR_ACCESS_HIDDEN_WALLET',
    },
    TR_WALLET_SELECTION_ACCESS_HIDDEN_WALLET: {
        defaultMessage: 'Access Passphrase wallet',
        id: 'TR_WALLET_SELECTION_ACCESS_HIDDEN_WALLET',
    },
    TR_WALLET_SELECTION_HIDDEN_WALLET: {
        defaultMessage: 'Hidden wallet',
        id: 'TR_WALLET_SELECTION_HIDDEN_WALLET',
    },
    TR_WALLET_PASSPHRASE_WALLET: {
        defaultMessage: 'Passphrase wallet',
        id: 'TR_WALLET_PASSPHRASE_WALLET',
    },
    TR_HIDDEN_WALLET_TOOLTIP: {
        id: 'TR_HIDDEN_WALLET_TOOLTIP',
        defaultMessage:
            'A passphrase adds a custom phrase (like a word, sentence, or string of characters) to your existing wallet backup, creating a hidden wallet. Each hidden wallet has its own passphrase. Your standard wallet remains accessible without a passphrase.',
    },
    TR_ACCESS_STANDARD_WALLET: {
        defaultMessage: 'Access standard wallet',
        id: 'TR_ACCESS_STANDARD_WALLET',
    },
    TR_ACCOUNT_ENABLE_PASSPHRASE: {
        defaultMessage: 'Enable passphrase',
        id: 'TR_ACCOUNT_ENABLE_PASSPHRASE',
    },
    TR_ACCOUNT_EXCEPTION_AUTH_ERROR: {
        defaultMessage: 'Authorization error',
        id: 'TR_ACCOUNT_EXCEPTION_AUTH_ERROR',
    },
    TR_ACCOUNT_EXCEPTION_AUTH_ERROR_DESC: {
        defaultMessage:
            'The authorization process for this device failed. Please click "Retry" or reconnect your Trezor device.',
        id: 'TR_ACCOUNT_EXCEPTION_AUTH_ERROR_DESC',
    },
    TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY: {
        defaultMessage: 'All coins are disabled in Settings.',
        id: 'TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY',
    },
    TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC: {
        defaultMessage: 'All coins are currently disabled. Please enable in Settings.',
        id: 'TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC',
    },
    TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR: {
        defaultMessage: 'Account discovery error',
        id: 'TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR',
    },
    TR_ACCOUNT_EXCEPTION_DISCOVERY_DESCRIPTION: {
        defaultMessage: 'We were unable to discover your accounts.',
        id: 'TR_ACCOUNT_EXCEPTION_DISCOVERY_DESCRIPTION',
    },
    TR_ACCOUNT_EXCEPTION_NOT_ENABLED: {
        defaultMessage: '{networkName} not enabled in Settings.',
        id: 'TR_ACCOUNT_EXCEPTION_NOT_ENABLED',
    },
    TR_ACCOUNT_EXCEPTION_NOT_EXIST: {
        defaultMessage: 'Account does not exist',
        id: 'TR_ACCOUNT_EXCEPTION_NOT_EXIST',
    },
    TR_ACCOUNT_OUT_OF_SYNC: {
        defaultMessage: 'Account sync in progress, please wait.',
        id: 'TR_ACCOUNT_OUT_OF_SYNC',
    },
    TR_ACCOUNT_IMPORTED_ANNOUNCEMENT: {
        defaultMessage:
            'A watch-only account is a public address you’ve imported into your wallet, allowing the wallet to watch for outputs but not spend them.',
        id: 'TR_ACCOUNT_IMPORTED_ANNOUNCEMENT',
    },
    TR_ACCOUNT_IS_EMPTY_TITLE: {
        defaultMessage: 'No transactions... yet.',
        id: 'TR_ACCOUNT_IS_EMPTY_TITLE',
    },
    TR_ACCOUNT_PASSPHRASE_DISABLED: {
        defaultMessage: 'Change passphrase settings to use this device',
        id: 'TR_ACCOUNT_PASSPHRASE_DISABLED',
    },
    TR_ACQUIRE_DEVICE: {
        defaultMessage: 'Use Trezor here',
        description:
            'call-to-action to use device in current window when it is used in other window',
        id: 'TR_ACQUIRE_DEVICE',
    },
    TR_RECONNECT_DEVICE_DESCRIPTION: {
        defaultMessage:
            'If closing tabs and refreshing this page didn’t help, try reconnecting your Trezor.',
        id: 'TR_RECONNECT_DEVICE_DESCRIPTION',
    },
    TR_RECONNECT_DEVICE_DESCRIPTION_DESKTOP: {
        defaultMessage:
            "If closing tabs and reopening Trezor Suite doesn't help, try reconnecting your Trezor.",
        id: 'TR_RECONNECT_DEVICE_DESCRIPTION_DESKTOP',
    },
    TR_ACQUIRE_DEVICE_TITLE: {
        defaultMessage: 'Another session is running',
        id: 'TR_ACQUIRE_DEVICE_TITLE',
    },
    TR_ACTIVE: {
        id: 'TR_ACTIVE',
        defaultMessage: 'active',
    },
    TR_ADD: {
        id: 'TR_ADD',
        defaultMessage: 'Add',
    },
    TR_ADD_ACCOUNT: {
        defaultMessage: 'Add account',
        id: 'TR_ADD_ACCOUNT',
    },
    TR_ADD_NETWORK_ACCOUNT: {
        defaultMessage: 'Add {network} account',
        id: 'TR_ADD_NETWORK_ACCOUNT',
    },
    TR_SELECT_TYPE: {
        defaultMessage: 'Select type',
        id: 'TR_SELECT_TYPE',
    },
    TR_ADD_HIDDEN_WALLET: {
        defaultMessage: 'Passphrase wallet',
        id: 'TR_ADD_HIDDEN_WALLET',
    },
    TR_ADD_WALLET: {
        defaultMessage: 'Standard wallet',
        id: 'TR_ADD_WALLET',
    },
    TR_CONTRACT: {
        defaultMessage: 'Contract',
        id: 'TR_CONTRACT',
    },
    TR_RECIPIENT_ADDRESS: {
        defaultMessage: 'Recipient address',
        description: 'Used as label for send address input',
        id: 'TR_RECIPIENT_ADDRESS',
    },
    TR_RECIPIENT_ADDRESS_MATCH: {
        defaultMessage: 'Recipient address match?',
        id: 'TR_RECIPIENT_ADDRESS_MATCH',
    },
    TR_RECEIVE_ADDRESS_MATCH: {
        defaultMessage: 'Receive address match?',
        id: 'TR_RECEIVE_ADDRESS_MATCH',
    },
    TR_RECEIVE_ADDRESS: {
        defaultMessage: 'Receive address',
        id: 'TR_RECEIVE_ADDRESS',
    },
    TR_XPUB_MATCH: {
        defaultMessage: 'Public key (XPUB) match?',
        id: 'TR_XPUB_MATCH',
    },
    TR_XPUB: {
        defaultMessage: 'Public key (XPUB)',
        id: 'TR_XPUB',
    },
    TR_ADDRESS: {
        id: 'TR_ADDRESSES',
        defaultMessage: 'Address',
    },
    TR_ADDRESSES_FRESH: {
        id: 'TR_ADDRESSES_FRESH',
        defaultMessage: 'Fresh addresses',
    },
    TR_ADDRESSES_USED: {
        id: 'TR_ADDRESSES_USED',
        defaultMessage: 'Used addresses',
    },
    TR_ADDRESSES_CHANGE: {
        id: 'TR_ADDRESSES_CHANGE',
        defaultMessage: 'Change addresses',
    },
    TR_TRADE_REDIRECTING: {
        defaultMessage: 'Redirecting ...',
        id: 'TR_TRADE_REDIRECTING',
    },
    TR_FRACTION_BUTTONS_ALL: {
        defaultMessage: 'All',
        id: 'TR_FRACTION_BUTTONS_ALL',
    },
    TR_EXCHANGE_FIXED_OFFERS_INFO: {
        id: 'TR_EXCHANGE_FIXED_OFFERS_INFO',
        defaultMessage:
            "Fixed rates show you exactly how much you'll end up with at the end of the exchange—the amount won't change between when you select the rate and when your transaction is complete. You're guaranteed the amount shown, but these rates are usually less generous, meaning your money won't buy as much crypto.",
    },
    TR_EXCHANGE_FLOAT_OFFERS_INFO: {
        id: 'TR_EXCHANGE_FLOAT_OFFERS_INFO',
        defaultMessage:
            "Floating rates mean that the final amount you'll get may change slightly due to fluctuations in the market between when you select the rate and when your transaction is complete. These rates are usually higher, meaning you could end up with more crypto in the end.",
    },
    TR_EXCHANGE_FEES_INFO: {
        id: 'TR_EXCHANGE_FEES_INFO',
        defaultMessage:
            'All fees included; the transaction fee is estimated at {feeAmount} ({feeAmountFiat}).',
    },
    TR_COINMARKET_SWAP_MODAL_FOR_YOUR_SAFETY: {
        defaultMessage: 'Swap {fromCrypto} to {toCrypto} with {provider}',
        id: 'TR_COINMARKET_SWAP_MODAL_FOR_YOUR_SAFETY',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_MODAL_CONFIRM: {
        defaultMessage: 'I’m ready to swap',
        id: 'TR_COINMARKET_SWAP_MODAL_CONFIRM',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_MODAL_SECURITY_HEADER: {
        defaultMessage: 'Security first with your Trezor',
        id: 'TR_COINMARKET_SWAP_MODAL_SECURITY_HEADER',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_MODAL_TERMS_1: {
        defaultMessage:
            "I’m here to swap cryptocurrencies. If I were directed to this site for any other reason, I'll contact Trezor Support before proceeding. ",
        id: 'TR_COINMARKET_SWAP_MODAL_TERMS_1',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_MODAL_TERMS_2: {
        defaultMessage:
            "I want to swap cryptocurrencies for my own account. I understand that the provider's policies may require identity verification.",
        id: 'TR_COINMARKET_SWAP_MODAL_TERMS_2',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_MODAL_TERMS_3: {
        defaultMessage:
            "I understand that cryptocurrency transactions are final and can't be reversed or refunded. Losses due to fraud or mistakes may not be recoverable.",
        id: 'TR_COINMARKET_SWAP_MODAL_TERMS_3',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_MODAL_VERIFIED_PARTNERS_HEADER: {
        defaultMessage: 'Verified partners by Invity',
        id: 'TR_COINMARKET_SWAP_MODAL_VERIFIED_PARTNERS_HEADER',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_MODAL_TERMS_4: {
        defaultMessage:
            "I understand that Invity doesn't provide this service. It's governed by {provider}’s terms and conditions.",
        id: 'TR_COINMARKET_SWAP_MODAL_TERMS_4',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_MODAL_LEGAL_HEADER: {
        defaultMessage: 'Legal notice',
        id: 'TR_COINMARKET_SWAP_MODAL_LEGAL_HEADER',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_MODAL_TERMS_5: {
        defaultMessage:
            "I'm not using this feature for gambling, fraud, or any activity that violates Invity’s or the provider's Terms of Service, or any applicable laws.",
        id: 'TR_COINMARKET_SWAP_MODAL_TERMS_5',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_MODAL_TERMS_6: {
        defaultMessage:
            'I understand that cryptocurrencies are an emerging financial tool and that regulations can differ by region. This may increase the risk of fraud, theft, or market instability.',
        id: 'TR_COINMARKET_SWAP_MODAL_TERMS_6',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_DEX_MODAL_FOR_YOUR_SAFETY: {
        defaultMessage: 'Swap {fromCrypto} to {toCrypto} with {provider}',
        id: 'TR_COINMARKET_SWAP_DEX_MODAL_FOR_YOUR_SAFETY',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_DEX_MODAL_CONFIRM: {
        defaultMessage: 'I’m ready to swap',
        id: 'TR_COINMARKET_SWAP_DEX_MODAL_CONFIRM',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_DEX_MODAL_SECURITY_HEADER: {
        defaultMessage: 'Security first with your Trezor',
        id: 'TR_COINMARKET_SWAP_DEX_MODAL_SECURITY_HEADER',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_DEX_MODAL_TERMS_1: {
        defaultMessage:
            "I want to swap cryptocurrencies using DEX (decentralized exchange) by using {provider}'s contract.",
        id: 'TR_COINMARKET_SWAP_DEX_MODAL_TERMS_1',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_DEX_MODAL_TERMS_2: {
        defaultMessage:
            "I want to swap cryptocurrencies for my own account. I understand that the provider's policies may require identity verification.",
        id: 'TR_COINMARKET_SWAP_DEX_MODAL_TERMS_2',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_DEX_MODAL_TERMS_3: {
        defaultMessage:
            "I understand that cryptocurrency transactions are final and can't be reversed or refunded. Losses due to fraud or mistakes may not be recoverable.",
        id: 'TR_COINMARKET_SWAP_DEX_MODAL_TERMS_3',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_DEX_MODAL_VERIFIED_PARTNERS_HEADER: {
        defaultMessage: 'Verified partners by Invity',
        id: 'TR_COINMARKET_SWAP_DEX_MODAL_VERIFIED_PARTNERS_HEADER',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_DEX_MODAL_TERMS_4: {
        defaultMessage:
            "I understand that Invity doesn't provide this service. It's governed by {provider}’s terms and conditions.",
        id: 'TR_COINMARKET_SWAP_DEX_MODAL_TERMS_4',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_DEX_MODAL_LEGAL_HEADER: {
        defaultMessage: 'Legal notice',
        id: 'TR_COINMARKET_SWAP_DEX_MODAL_LEGAL_HEADER',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_DEX_MODAL_TERMS_5: {
        defaultMessage:
            "I'm not using this feature for gambling, fraud, or any activity that violates Invity’s or the provider's Terms of Service, or any applicable laws.",
        id: 'TR_COINMARKET_SWAP_DEX_MODAL_TERMS_5',
        dynamic: true,
    },
    TR_COINMARKET_SWAP_DEX_MODAL_TERMS_6: {
        defaultMessage:
            'I understand that cryptocurrencies are an emerging financial tool and that regulations can differ by region. This may increase the risk of fraud, theft, or market instability.',
        id: 'TR_COINMARKET_SWAP_DEX_MODAL_TERMS_6',
        dynamic: true,
    },
    TR_CONFIRM_ADDRESS: {
        defaultMessage: 'Confirm address',
        id: 'TR_CONFIRM_ADDRESS',
    },
    TR_COINS_CHECKED: {
        defaultMessage: 'Coins checked',
        id: 'TR_COINS_CHECKED',
    },
    TR_CHECKED_BALANCES_ON: {
        defaultMessage: 'Checked balances on',
        id: 'TR_CHECKED_BALANCES_ON',
    },
    TR_ALL_NETWORKS: {
        defaultMessage: 'All networks ({networkCount})',
        id: 'TR_ALL_NETWORKS',
    },
    TR_ALL_NETWORKS_TOOLTIP: {
        defaultMessage:
            'View tokens from all {networkCount} networks. Filter by the most popular networks on the right.',
        id: 'TR_ALL_NETWORKS_TOOLTIP',
    },
    TR_SELECT_TOKEN: {
        defaultMessage: 'Select a token',
        id: 'TR_SELECT_TOKEN',
    },
    TR_SELECT_NAME_OR_ADDRESS: {
        defaultMessage: 'Search by name, symbol, network, or contract address',
        id: 'TR_SELECT_NAME_OR_ADDRESS',
    },
    TR_TOKEN_NOT_FOUND: {
        defaultMessage: 'Token not found',
        id: 'TR_TOKEN_NOT_FOUND',
    },
    TR_TOKEN_NOT_FOUND_ON_NETWORK: {
        defaultMessage: 'Token not found on the {networkName} network.',
        id: 'TR_TOKEN_NOT_FOUND_ON_NETWORK',
    },
    TR_TOKEN_TRY_DIFFERENT_SEARCH: {
        defaultMessage: 'Try a different search.',
        id: 'TR_TOKEN_TRY_DIFFERENT_SEARCH',
    },
    TR_TOKEN_TRY_DIFFERENT_SEARCH_OR_SWITCH: {
        defaultMessage: 'Try a different search or switch to another network.',
        id: 'TR_TOKEN_TRY_DIFFERENT_SEARCH_OR_SWITCH',
    },
    TR_EXCHANGE_STATUS_ERROR: {
        defaultMessage: 'Rejected',
        id: 'TR_EXCHANGE_STATUS_ERROR',
    },
    TR_EXCHANGE_STATUS_SUCCESS: {
        defaultMessage: 'Approved',
        id: 'TR_EXCHANGE_STATUS_SUCCESS',
    },
    TR_EXCHANGE_STATUS_KYC: {
        defaultMessage: 'KYC',
        id: 'TR_EXCHANGE_STATUS_KYC',
    },
    TR_EXCHANGE_STATUS_CONFIRMING: {
        defaultMessage: 'Pending',
        id: 'TR_EXCHANGE_STATUS_CONFIRMING',
    },
    TR_EXCHANGE_STATUS_CONVERTING: {
        defaultMessage: 'Converting',
        id: 'TR_EXCHANGE_STATUS_CONVERTING',
    },
    TR_EXCHANGE_TRANS_ID: {
        defaultMessage: 'Trans. ID:',
        id: 'TR_EXCHANGE_TRANS_ID',
    },
    TR_EXCHANGE_VIEW_DETAILS: {
        defaultMessage: 'View details',
        id: 'TR_EXCHANGE_VIEW_DETAILS',
    },
    TR_EXCHANGE_DETAIL_SUCCESS_TITLE: {
        defaultMessage: 'Approved',
        id: 'TR_EXCHANGE_DETAIL_SUCCESS_TITLE',
    },
    TR_EXCHANGE_DETAIL_SUCCESS_TEXT: {
        defaultMessage: 'Your transaction was successful.',
        id: 'TR_EXCHANGE_DETAIL_SUCCESS_TEXT',
    },
    TR_EXCHANGE_DETAIL_SUCCESS_BUTTON: {
        defaultMessage: 'Back to Account',
        id: 'TR_EXCHANGE_DETAIL_SUCCESS_BUTTON',
    },
    TR_EXCHANGE_DETAIL_ERROR_TITLE: {
        defaultMessage: 'The transaction failed',
        id: 'TR_EXCHANGE_DETAIL_ERROR_TITLE',
    },
    TR_EXCHANGE_DETAIL_ERROR_TEXT: {
        defaultMessage:
            'Sorry, your transaction failed or was rejected. Your coins have not been exchanged.',
        id: 'TR_EXCHANGE_DETAIL_ERROR_TEXT',
    },
    TR_EXCHANGE_DETAIL_ERROR_SUPPORT: {
        defaultMessage: "Open partner's support site",
        id: 'TR_EXCHANGE_DETAIL_ERROR_SUPPORT',
    },
    TR_EXCHANGE_DETAIL_ERROR_BUTTON: {
        defaultMessage: 'Back to Account',
        id: 'TR_EXCHANGE_DETAIL_ERROR_BUTTON',
    },
    TR_EXCHANGE_DETAIL_KYC_TITLE: {
        defaultMessage: 'KYC request',
        id: 'TR_EXCHANGE_DETAIL_KYC_TITLE',
    },
    TR_EXCHANGE_DETAIL_KYC_TEXT: {
        defaultMessage:
            'The provider has marked this transaction as "suspicious" and you may be required to complete their KYC process to finish the trade. Please contact the provider\'s support to proceed.',
        id: 'TR_EXCHANGE_DETAIL_KYC_TEXT',
    },
    TR_EXCHANGE_DETAIL_KYC_SUPPORT: {
        defaultMessage: 'Go to provider support',
        id: 'TR_EXCHANGE_DETAIL_KYC_SUPPORT',
    },
    TR_EXCHANGE_DETAIL_KYC_INFO_LINK: {
        defaultMessage: 'Go to provider KYC details',
        id: 'TR_EXCHANGE_DETAIL_KYC_INFO_LINK',
    },
    TR_EXCHANGE_DETAIL_KYC_BUTTON: {
        defaultMessage: 'Back to Account',
        id: 'TR_EXCHANGE_DETAIL_KYC_BUTTON',
    },
    TR_EXCHANGE_DETAIL_SENDING_TITLE: {
        defaultMessage: 'Pending',
        id: 'TR_EXCHANGE_DETAIL_SENDING_TITLE',
    },
    TR_EXCHANGE_DETAIL_SENDING_SUPPORT: {
        defaultMessage: 'Go to provider support',
        id: 'TR_EXCHANGE_DETAIL_SENDING_SUPPORT',
    },
    TR_EXCHANGE_DETAIL_CONVERTING_TITLE: {
        defaultMessage: 'Converting',
        id: 'TR_EXCHANGE_DETAIL_CONVERTING_TITLE',
    },
    TR_EXCHANGE_DETAIL_CONVERTING_SUPPORT: {
        defaultMessage: 'Go to provider support',
        id: 'TR_EXCHANGE_DETAIL_CONVERTING_SUPPORT',
    },
    TR_EXCHANGE_VERIFY_ADDRESS_STEP: {
        defaultMessage: 'Receive address',
        id: 'TR_EXCHANGE_VERIFY_ADDRESS_STEP',
    },
    TR_EXCHANGE_CONFIRM_SEND_STEP: {
        defaultMessage: 'Confirm & Send',
        id: 'TR_EXCHANGE_CONFIRM_SEND_STEP',
    },
    TR_EXCHANGE_CREATE_APPROVAL_STEP: {
        defaultMessage: 'Create approval',
        id: 'TR_EXCHANGE_CREATE_APPROVAL_STEP',
    },
    TR_EXCHANGE_SEND_FROM: {
        defaultMessage: 'Sending account',
        id: 'TR_EXCHANGE_SEND_FROM',
    },
    TR_EXCHANGE_SEND_TO: {
        defaultMessage: '{providerName}’s address',
        id: 'TR_EXCHANGE_SEND_TO',
    },
    TR_EXCHANGE_APPROVAL_SEND_TO: {
        defaultMessage: '{send} contract',
        id: 'TR_EXCHANGE_APPROVAL_SEND_TO',
    },
    TR_EXCHANGE_APPROVAL_VALUE: {
        defaultMessage: 'Approval value',
        id: 'TR_EXCHANGE_APPROVAL_VALUE',
    },
    TR_EXCHANGE_APPROVAL_VALUE_MINIMAL: {
        defaultMessage: 'Necessary value of {value} {send}',
        id: 'TR_EXCHANGE_APPROVAL_VALUE_MINIMAL',
    },
    TR_EXCHANGE_APPROVAL_VALUE_MINIMAL_INFO: {
        defaultMessage:
            'Approve only the exact amount required for this swap. You will need to pay an additional fee if you want to make a similar swap again.',
        id: 'TR_EXCHANGE_APPROVAL_VALUE_MINIMAL_INFO',
    },
    TR_EXCHANGE_APPROVAL_VALUE_INFINITE: {
        defaultMessage: 'Infinite value',
        id: 'TR_EXCHANGE_APPROVAL_VALUE_INFINITE',
    },
    TR_EXCHANGE_APPROVAL_VALUE_INFINITE_INFO: {
        defaultMessage:
            'Create a single approval transaction to simplify multiple exchanges of {send} with {provider}. This saves on fees but carries a risk to your funds in the unlikely case of a flaw in {provider}’s contract.',
        id: 'TR_EXCHANGE_APPROVAL_VALUE_INFINITE_INFO',
    },
    TR_EXCHANGE_APPROVAL_VALUE_ZERO: {
        defaultMessage: 'Revoke previous approval',
        id: 'TR_EXCHANGE_APPROVAL_VALUE_ZERO',
    },
    TR_EXCHANGE_APPROVAL_VALUE_ZERO_INFO: {
        defaultMessage:
            'Perform a transaction that will remove previous approval of contract with {provider}.',
        id: 'TR_EXCHANGE_APPROVAL_VALUE_ZERO_INFO',
    },
    TR_EXCHANGE_APPROVAL_DATA: {
        defaultMessage: 'Approval transaction data',
        id: 'TR_EXCHANGE_APPROVAL_DATA',
    },
    TR_EXCHANGE_APPROVAL_TXID: {
        defaultMessage: 'Approval transaction ID',
        id: 'TR_EXCHANGE_APPROVAL_TXID',
    },
    TR_EXCHANGE_APPROVAL_CONFIRMING: {
        defaultMessage: 'Waiting for the blockchain to confirm the approval transaction.',
        id: 'TR_EXCHANGE_APPROVAL_CONFIRMING',
    },
    TR_EXCHANGE_APPROVAL_FAILED: {
        defaultMessage: 'The approval transaction failed.',
        id: 'TR_EXCHANGE_APPROVAL_FAILED',
    },
    TR_EXCHANGE_APPROVAL_SUCCESS: {
        defaultMessage: 'The approval transaction is confirmed.',
        id: 'TR_EXCHANGE_APPROVAL_SUCCESS',
    },
    TR_EXCHANGE_APPROVAL_NOT_REQUIRED: {
        defaultMessage: 'No approval transaction needed for {send}.',
        id: 'TR_EXCHANGE_APPROVAL_NOT_REQUIRED',
    },
    TR_EXCHANGE_APPROVAL_PREAPPROVED: {
        defaultMessage: 'Contract already approved.',
        id: 'TR_EXCHANGE_APPROVAL_PREAPPROVED',
    },
    TR_EXCHANGE_APPROVAL_PROCEED: {
        defaultMessage: 'Proceed to swap, no approval transaction needed.',
        id: 'TR_EXCHANGE_APPROVAL_PROCEED',
    },
    TR_EXCHANGE_APPROVAL_TO_SWAP_BUTTON: {
        defaultMessage: 'Proceed to swap',
        id: 'TR_EXCHANGE_APPROVAL_TO_SWAP_BUTTON',
    },
    TR_EXCHANGE_SWAP_SEND_TO: {
        defaultMessage: '{provider} contract address',
        id: 'TR_EXCHANGE_SWAP_SEND_TO',
    },
    TR_EXCHANGE_SWAP_DATA: {
        defaultMessage: 'Swap transaction data',
        id: 'TR_EXCHANGE_SWAP_DATA',
    },
    TR_EXCHANGE_SWAP_SLIPPAGE: {
        defaultMessage: 'Slippage',
        id: 'TR_EXCHANGE_SWAP_SLIPPAGE',
    },
    TR_EXCHANGE_SWAP_SLIPPAGE_TOLERANCE: {
        defaultMessage: 'Slippage tolerance',
        id: 'TR_EXCHANGE_SWAP_SLIPPAGE_TOLERANCE',
    },
    TR_EXCHANGE_SWAP_SLIPPAGE_SUMMARY: {
        defaultMessage: 'Slippage summary',
        id: 'TR_EXCHANGE_SWAP_SLIPPAGE_SUMMARY',
    },
    TR_EXCHANGE_SWAP_SLIPPAGE_OFFERED: {
        defaultMessage: 'Swap offer amount',
        id: 'TR_EXCHANGE_SWAP_SLIPPAGE_OFFERED',
    },
    TR_EXCHANGE_SWAP_SLIPPAGE_AMOUNT: {
        defaultMessage: 'Maximum slippage amount',
        id: 'TR_EXCHANGE_SWAP_SLIPPAGE_AMOUNT',
    },
    TR_EXCHANGE_SWAP_SLIPPAGE_MINIMUM: {
        defaultMessage: 'Minimum received amount',
        id: 'TR_EXCHANGE_SWAP_SLIPPAGE_MINIMUM',
    },
    TR_EXCHANGE_SWAP_SLIPPAGE_INFO: {
        defaultMessage:
            "Exchange rates shift constantly, so the amount you accept in this offer and the amount ultimately confirmed on the blockchain may differ; this is slippage. Slippage tolerance sets the percentage of your transaction you may lose due to slippage; in other words, you set the minimum amount you are willing to accept in the end. If slippage tolerance is too high, you may receive a lot less than offered. If slippage tolerance is too low, your transaction may fail (revert) and you'll still pay the transaction fee.",
        id: 'TR_EXCHANGE_SWAP_SLIPPAGE_INFO',
    },
    TR_EXCHANGE_SWAP_SLIPPAGE_CUSTOM: {
        defaultMessage: 'Custom',
        id: 'TR_EXCHANGE_SWAP_SLIPPAGE_CUSTOM',
    },
    TR_EXCHANGE_SWAP_SLIPPAGE_NOT_SET: {
        defaultMessage: 'Enter your desired slippage.',
        id: 'TR_EXCHANGE_SWAP_SLIPPAGE_NOT_SET',
    },
    TR_EXCHANGE_SWAP_SLIPPAGE_NOT_NUMBER: {
        defaultMessage: 'Please enter a number.',
        id: 'TR_EXCHANGE_SWAP_SLIPPAGE_NOT_NUMBER',
    },
    TR_EXCHANGE_SWAP_SLIPPAGE_NOT_IN_RANGE: {
        defaultMessage: 'Slippage must be in the range 0.01% - 50%',
        id: 'TR_EXCHANGE_SWAP_SLIPPAGE_NOT_IN_RANGE',
    },
    TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND: {
        defaultMessage: 'Confirm on Trezor & send',
        id: 'TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND',
    },
    TR_EXCHANGE_RECEIVE_NON_SUITE_ACCOUNT_QUESTION_TOOLTIP: {
        id: 'TR_EXCHANGE_RECEIVE_NON_SUITE_ACCOUNT_QUESTION_TOOLTIP',
        defaultMessage: 'Receive account is outside of Suite.',
    },
    TR_EXCHANGE_RECEIVE_NON_SUITE_ADDRESS_QUESTION_TOOLTIP: {
        id: 'TR_EXCHANGE_RECEIVE_NON_SUITE_ADDRESS_QUESTION_TOOLTIP',
        defaultMessage: 'This is the specific alphanumeric address that will receive your coins.',
    },
    TR_EXCHANGE_SELECT_RECEIVE_ACCOUNT: {
        id: 'TR_EXCHANGE_SELECT_RECEIVE_ACCOUNT',
        defaultMessage: 'Select {symbol} receive account',
    },
    TR_EXCHANGE_RECEIVING_ADDRESS_INFO: {
        defaultMessage: "Your receive address is where you'll receive your {symbol}.",
        id: 'TR_EXCHANGE_RECEIVING_ADDRESS_INFO',
    },
    TR_EXCHANGE_RECEIVING_ADDRESS: {
        defaultMessage: 'Receive address',
        id: 'TR_EXCHANGE_RECEIVING_ADDRESS',
    },
    TR_EXCHANGE_RECEIVING_ADDRESS_REQUIRED: {
        defaultMessage: 'Receive address is required',
        id: 'TR_EXCHANGE_RECEIVING_ADDRESS_REQUIRED',
    },
    TR_EXCHANGE_RECEIVING_ADDRESS_INVALID: {
        defaultMessage: 'Receive address is invalid',
        id: 'TR_EXCHANGE_RECEIVING_ADDRESS_INVALID',
    },
    TR_EXCHANGE_EXTRA_FIELD: {
        defaultMessage: '{extraFieldName}',
        id: 'TR_EXCHANGE_EXTRA_FIELD',
    },
    TR_EXCHANGE_EXTRA_FIELD_REQUIRED: {
        defaultMessage: '{extraFieldName} is required',
        id: 'TR_EXCHANGE_EXTRA_FIELD_REQUIRED',
    },
    TR_EXCHANGE_EXTRA_FIELD_INVALID: {
        defaultMessage: '{extraFieldName} is invalid',
        id: 'TR_EXCHANGE_EXTRA_FIELD_INVALID',
    },
    TR_EXCHANGE_EXTRA_FIELD_QUESTION_TOOLTIP: {
        defaultMessage: '{extraFieldDescription}',
        id: 'TR_EXCHANGE_EXTRA_FIELD_QUESTION_TOOLTIP',
    },
    TR_EXCHANGE_CREATE_SUITE_ACCOUNT: {
        defaultMessage: 'Create a new {symbol} account',
        id: 'TR_EXCHANGE_CREATE_SUITE_ACCOUNT',
    },
    TR_EXCHANGE_USE_NON_SUITE_ACCOUNT: {
        defaultMessage: "Use an account ({symbol}) that isn't in Suite",
        id: 'TR_EXCHANGE_USE_NON_SUITE_ACCOUNT',
    },
    TR_EXCHANGE_BUY: {
        defaultMessage: 'For',
        id: 'TR_EXCHANGE_BUY',
    },
    TR_EXCHANGE_FIXED: {
        defaultMessage: 'Fixed-rate offer',
        id: 'TR_EXCHANGE_FIXED',
    },
    TR_EXCHANGE_FLOAT: {
        defaultMessage: 'Floating-rate offer',
        id: 'TR_EXCHANGE_FLOAT',
    },
    TR_EXCHANGE_DEX: {
        defaultMessage: 'Decentralized exchange offer',
        id: 'TR_EXCHANGE_DEX',
    },
    TR_COINMARKET_EXCHANGE_FIXED_OFFERS_HEADING: {
        defaultMessage: 'Fixed-rate CEX',
        id: 'TR_COINMARKET_EXCHANGE_FIXED_OFFERS_HEADING',
        dynamic: true,
    },
    TR_COINMARKET_EXCHANGE_FLOAT_OFFERS_HEADING: {
        defaultMessage: 'Floating-rate CEX',
        id: 'TR_COINMARKET_EXCHANGE_FLOAT_OFFERS_HEADING',
        dynamic: true,
    },
    TR_COINMARKET_EXCHANGE_DEX_OFFERS_HEADING: {
        defaultMessage: 'DEX',
        id: 'TR_COINMARKET_EXCHANGE_DEX_OFFERS_HEADING',
        dynamic: true,
    },
    TR_COINMARKET_EXCHANGE_DEX_OFFERS_HEADING_TOOLTIP: {
        defaultMessage:
            'A decentralized exchange (DEX) allows you to trade crypto directly on the blockchain without the need for a central authority or intermediary.',
        id: 'TR_COINMARKET_EXCHANGE_DEX_OFFERS_HEADING_TOOLTIP',
        dynamic: true,
    },
    TR_COINMARKET_EXCHANGE_COMPARATOR_FILTER_KYC_ALL: {
        defaultMessage: 'All KYC options',
        id: 'TR_COINMARKET_EXCHANGE_COMPARATOR_FILTER_KYC_ALL',
    },
    TR_COINMARKET_EXCHANGE_COMPARATOR_FILTER_NO_KYC: {
        defaultMessage: 'KYC never required',
        id: 'TR_COINMARKET_EXCHANGE_COMPARATOR_FILTER_NO_KYC',
    },
    TR_COINMARKET_EXCHANGE_COMPARATOR_FILTER_RATE_ALL: {
        defaultMessage: 'All CEX & DEX offers',
        id: 'TR_COINMARKET_EXCHANGE_COMPARATOR_FILTER_RATE_ALL',
    },
    TR_COINMARKET_EXCHANGE_COMPARATOR_FILTER_RATE_FIXED_CEX: {
        defaultMessage: 'Fixed-rate CEX',
        id: 'TR_COINMARKET_EXCHANGE_COMPARATOR_FILTER_RATE_FIXED_CEX',
    },
    TR_COINMARKET_EXCHANGE_COMPARATOR_FILTER_RATE_FLOATING_CEX: {
        defaultMessage: 'Floating-rate CEX',
        id: 'TR_COINMARKET_EXCHANGE_COMPARATOR_FILTER_RATE_FLOATING_CEX',
    },
    TR_COINMARKET_EXCHANGE_COMPARATOR_FILTER_RATE_DEX: {
        defaultMessage: 'DEX',
        id: 'TR_COINMARKET_EXCHANGE_COMPARATOR_FILTER_RATE_DEX',
    },
    TR_SELL_STATUS_ERROR: {
        defaultMessage: 'Rejected',
        id: 'TR_SELL_STATUS_ERROR',
    },
    TR_SELL_STATUS_SUCCESS: {
        defaultMessage: 'Approved',
        id: 'TR_SELL_STATUS_SUCCESS',
    },
    TR_SELL_STATUS_PENDING: {
        defaultMessage: 'Pending',
        id: 'TR_SELL_STATUS_PENDING',
    },
    TR_REQUIRED_FIELD: {
        defaultMessage: 'Required',
        id: 'TR_REQUIRED_FIELD',
    },
    TR_ORDER_NOW: {
        defaultMessage: 'Order now',
        id: 'TR_ORDER_NOW',
    },
    TR_SELL_MODAL_FOR_YOUR_SAFETY: {
        defaultMessage: 'Sell {cryptocurrency} with {provider}',
        id: 'TR_SELL_MODAL_FOR_YOUR_SAFETY',
        dynamic: true,
    },
    TR_SELL_MODAL_CONFIRM: {
        defaultMessage: 'I’m ready to sell',
        id: 'TR_SELL_MODAL_CONFIRM',
        dynamic: true,
    },
    TR_SELL_MODAL_SECURITY_HEADER: {
        defaultMessage: 'Security first with your Trezor',
        id: 'TR_SELL_MODAL_SECURITY_HEADER',
        dynamic: true,
    },
    TR_SELL_MODAL_TERMS_1: {
        defaultMessage:
            "You're here to sell cryptocurrency. If you were directed to this site for any other reason, please contact Trezor Support before proceeding.",
        id: 'TR_SELL_MODAL_TERMS_1',
        dynamic: true,
    },
    TR_SELL_MODAL_TERMS_2: {
        defaultMessage:
            "You're selling cryptocurrency for your own account. You acknowledge that the provider's policies may require identity verification.",
        id: 'TR_SELL_MODAL_TERMS_2',
        dynamic: true,
    },
    TR_SELL_MODAL_TERMS_3: {
        defaultMessage:
            'You understand that cryptocurrency transactions are irreversible and may not be refunded. Thus, fraudulent or accidental losses may be unrecoverable.',
        id: 'TR_SELL_MODAL_TERMS_3',
        dynamic: true,
    },
    TR_SELL_MODAL_VERIFIED_PARTNERS_HEADER: {
        defaultMessage: 'Verified partners by Invity',
        id: 'TR_SELL_MODAL_VERIFIED_PARTNERS_HEADER',
        dynamic: true,
    },
    TR_SELL_MODAL_TERMS_4: {
        defaultMessage:
            'You understand that Invity does not provide this service. {provider}’s terms govern the service.',
        id: 'TR_SELL_MODAL_TERMS_4',
        dynamic: true,
    },
    TR_SELL_MODAL_LEGAL_HEADER: {
        defaultMessage: 'Legal notice',
        id: 'TR_SELL_MODAL_LEGAL_HEADER',
        dynamic: true,
    },
    TR_SELL_MODAL_TERMS_5: {
        defaultMessage:
            "I'm not using this feature for gambling, fraud, or any activity that violates Invity’s or the provider's Terms of Service, or any applicable laws.",
        id: 'TR_SELL_MODAL_TERMS_5',
        dynamic: true,
    },
    TR_SELL_MODAL_TERMS_6: {
        defaultMessage:
            'You understand that cryptocurrencies are an emerging financial tool and that regulations may vary in different jurisdictions. This may put you at a higher risk of fraud, theft, or market instability.',
        id: 'TR_SELL_MODAL_TERMS_6',
        dynamic: true,
    },
    TR_SELL_REGISTER: {
        id: 'TR_SELL_REGISTER',
        defaultMessage: 'Register',
    },
    TR_SELL_BANK_ACCOUNT_STEP: {
        defaultMessage: 'Bank account',
        id: 'TR_SELL_BANK_ACCOUNT_STEP',
    },
    TR_SELL_CONFIRM_SEND_STEP: {
        defaultMessage: 'Confirm & Send',
        id: 'TR_SELL_CONFIRM_SEND_STEP',
    },
    TR_SELL_SEND_FROM: {
        defaultMessage: 'Send from',
        id: 'TR_SELL_SEND_FROM',
    },
    TR_SELL_SEND_TO: {
        defaultMessage: 'Send to {providerName}’s address',
        id: 'TR_SELL_SEND_TO',
    },
    TR_SELL_CONFIRM_ON_TREZOR_SEND: {
        defaultMessage: 'Confirm on Trezor & Send',
        id: 'TR_SELL_CONFIRM_ON_TREZOR_SEND',
    },
    TR_SELL_BANK_ACCOUNT: {
        defaultMessage: 'Your bank accounts',
        id: 'TR_SELL_BANK_ACCOUNT',
    },
    TR_SELL_BANK_ACCOUNT_TOOLTIP: {
        defaultMessage: 'Bank accounts that you registered with your provider',
        id: 'TR_SELL_BANK_ACCOUNT_TOOLTIP',
    },
    TR_SELL_BANK_ACCOUNT_VERIFIED: {
        defaultMessage: 'Verified',
        id: 'TR_SELL_BANK_ACCOUNT_VERIFIED',
    },
    TR_SELL_BANK_ACCOUNT_NOT_VERIFIED: {
        defaultMessage: 'Not verified',
        id: 'TR_SELL_BANK_ACCOUNT_NOT_VERIFIED',
    },
    TR_SELL_ADD_BANK_ACCOUNT: {
        defaultMessage: 'Add bank account',
        id: 'TR_SELL_ADD_BANK_ACCOUNT',
    },
    TR_SELL_GO_TO_TRANSACTION: {
        defaultMessage: 'Proceed',
        id: 'TR_SELL_GO_TO_TRANSACTION',
    },
    TR_SELL_DETAIL_SUCCESS_TITLE: {
        defaultMessage: 'Trade success',
        id: 'TR_SELL_DETAIL_SUCCESS_TITLE',
    },
    TR_SELL_DETAIL_SUCCESS_TEXT: {
        defaultMessage: 'The transaction finished successfully.',
        id: 'TR_SELL_DETAIL_SUCCESS_TEXT',
    },
    TR_SELL_DETAIL_SUCCESS_BUTTON: {
        defaultMessage: 'Back to Account',
        id: 'TR_SELL_DETAIL_SUCCESS_BUTTON',
    },
    TR_SELL_DETAIL_SUCCESS_FIXED_RATE_HEADER: {
        defaultMessage: '✓ This rate is locked in',
        id: 'TR_SELL_DETAIL_SUCCESS_FIXED_RATE_HEADER',
    },
    TR_SELL_DETAIL_SUCCESS_FIXED_RATE_MESSAGE: {
        defaultMessage: "Your payment is still processing, but what you see is what you'll get.",
        id: 'TR_SELL_DETAIL_SUCCESS_FIXED_RATE_MESSAGE',
    },
    TR_SELL_DETAIL_ERROR_TITLE: {
        defaultMessage: 'The transaction failed',
        id: 'TR_SELL_DETAIL_ERROR_TITLE',
    },
    TR_SELL_DETAIL_ERROR_TEXT: {
        defaultMessage: 'Unfortunately, your transaction was rejected or has failed.',
        id: 'TR_SELL_DETAIL_ERROR_TEXT',
    },
    TR_SELL_DETAIL_ERROR_SUPPORT: {
        defaultMessage: "Open partner's support site",
        id: 'TR_SELL_DETAIL_ERROR_SUPPORT',
    },
    TR_SELL_DETAIL_ERROR_BUTTON: {
        defaultMessage: 'Back to Account',
        id: 'TR_SELL_DETAIL_ERROR_BUTTON',
    },
    TR_SELL_DETAIL_PENDING_TITLE: {
        defaultMessage: 'Trade in progress...',
        id: 'TR_SELL_DETAIL_PENDING_TITLE',
    },
    TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO: {
        defaultMessage: "Waiting for {providerName}'s address",
        id: 'TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO',
    },
    TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO_INFO: {
        defaultMessage:
            "Please allow them a moment to generate the address where you'll send your crypto.",
        id: 'TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO_INFO',
    },
    TR_SELL_EXTRA_FIELD: {
        defaultMessage: '{extraFieldName}',
        id: 'TR_SELL_EXTRA_FIELD',
    },
    TR_SELL_DETAIL_PENDING_SUPPORT: {
        defaultMessage: "Open partner's support site",
        id: 'TR_SELL_DETAIL_PENDING_SUPPORT',
    },
    TR_SELL_VIEW_DETAILS: {
        defaultMessage: 'View details',
        id: 'TR_SELL_VIEW_DETAILS',
    },
    TR_SELL_TRANS_ID: {
        defaultMessage: 'Trans. ID:',
        id: 'TR_SELL_TRANS_ID',
    },
    TR_BUY_STATUS_PENDING: {
        defaultMessage: 'Pending',
        id: 'TR_BUY_STATUS_PENDING',
    },
    TR_BUY_FOOTER_TEXT_1: {
        defaultMessage:
            'Invity is a comparison tool that connects you to the best exchange providers. They only use location in order to show the most relevant offers.',
        id: 'TR_BUY_FOOTER_TEXT_1',
    },
    TR_BUY_FOOTER_TEXT_2: {
        defaultMessage:
            "Invity doesn't see any of your payment or KYC information; you share this only with the exchange provider if you choose to finish the transaction.",
        id: 'TR_BUY_FOOTER_TEXT_2',
    },
    TR_BUY_MODAL_FOR_YOUR_SAFETY: {
        defaultMessage: 'Buy {cryptocurrency} with {provider}',
        id: 'TR_BUY_MODAL_FOR_YOUR_SAFETY',
        dynamic: true,
    },
    TR_BUY_MODAL_CONFIRM: {
        defaultMessage: 'I’m ready to buy',
        id: 'TR_BUY_MODAL_CONFIRM',
        dynamic: true,
    },
    TR_BUY_MODAL_SECURITY_HEADER: {
        defaultMessage: 'Security first with your Trezor',
        id: 'TR_BUY_MODAL_SECURITY_HEADER',
        dynamic: true,
    },
    TR_BUY_MODAL_TERMS_1: {
        defaultMessage:
            "I’m here to buy cryptocurrencies. If I were directed to this site for any other reason, I'll contact {provider} support before proceeding.",
        id: 'TR_BUY_MODAL_TERMS_1',
        dynamic: true,
    },
    TR_BUY_MODAL_TERMS_2: {
        defaultMessage:
            "I’m using this feature to buy cryptocurrencies that'll be sent to my own account.",
        id: 'TR_BUY_MODAL_TERMS_2',
        dynamic: true,
    },
    TR_BUY_MODAL_TERMS_3: {
        defaultMessage:
            "I understand that cryptocurrency transactions are final and can't be reversed or refunded. Losses due to fraud or mistakes may not be recoverable.",
        id: 'TR_BUY_MODAL_TERMS_3',
        dynamic: true,
    },
    TR_BUY_MODAL_VERIFIED_PARTNERS_HEADER: {
        defaultMessage: 'Verified partners by Invity',
        id: 'TR_BUY_MODAL_VERIFIED_PARTNERS_HEADER',
        dynamic: true,
    },
    TR_BUY_MODAL_TERMS_4: {
        defaultMessage:
            "I understand that Invity doesn't provide this service. It's governed by {provider}’s terms and conditions.",
        id: 'TR_BUY_MODAL_TERMS_4',
        dynamic: true,
    },
    TR_BUY_MODAL_LEGAL_HEADER: {
        defaultMessage: 'Legal notice',
        id: 'TR_BUY_MODAL_LEGAL_HEADER',
        dynamic: true,
    },
    TR_BUY_MODAL_TERMS_5: {
        defaultMessage:
            "I'm not using this feature for gambling, fraud, or any activity that violates Invity’s or the provider's Terms of Service, or any applicable laws.",
        id: 'TR_BUY_MODAL_TERMS_5',
        dynamic: true,
    },
    TR_BUY_MODAL_TERMS_6: {
        defaultMessage:
            'I understand that cryptocurrencies are an emerging financial tool and that regulations can differ by region. This may increase the risk of fraud, theft, or market instability.',
        id: 'TR_BUY_MODAL_TERMS_6',
        dynamic: true,
    },
    TR_VALIDATION_ERROR_MINIMUM_CRYPTO: {
        defaultMessage: 'Minimum is {minimum}',
        id: 'TR_BUY_VALIDATION_ERROR_MINIMUM_CRYPTO',
    },
    TR_VALIDATION_ERROR_MAXIMUM_CRYPTO: {
        defaultMessage: 'Maximum is {maximum}',
        id: 'TR_BUY_VALIDATION_ERROR_MAXIMUM_CRYPTO',
    },
    TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT: {
        defaultMessage: 'Minimum is {minimum} {currency}',
        id: 'TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT',
    },
    TR_BUY_VALIDATION_ERROR_MAXIMUM_FIAT: {
        defaultMessage: 'Maximum is {maximum} {currency}',
        id: 'TR_BUY_VALIDATION_ERROR_MAXIMUM_FIAT',
    },
    TR_BUY_BUY_AGAIN: {
        defaultMessage: 'Buy again',
        id: 'TR_BUY_BUY_AGAIN',
    },
    TR_BUY_ACCOUNT_TRANSACTIONS: {
        defaultMessage: 'Trade transactions',
        id: 'TR_BUY_ACCOUNT_TRANSACTIONS',
    },
    TR_BUY_STATUS_PENDING_GO_TO_GATEWAY: {
        defaultMessage: 'Pending',
        id: 'TR_BUY_STATUS_PENDING_GO_TO_GATEWAY',
    },
    TR_BUY_STATUS_ACTION_REQUIRED: {
        defaultMessage: 'Action required',
        id: 'TR_BUY_STATUS_ACTION_REQUIRED',
    },
    TR_BUY_VIEW_DETAILS: {
        defaultMessage: 'View details',
        id: 'TR_BUY_VIEW_DETAILS',
    },
    TR_BUY_STATUS_ERROR: {
        defaultMessage: 'Rejected',
        id: 'TR_BUY_STATUS_ERROR',
    },
    TR_BUY_STATUS_SUCCESS: {
        defaultMessage: 'Approved',
        id: 'TR_BUY_STATUS_SUCCESS',
    },
    TR_LOGIN_PROCEED: {
        id: 'TR_LOGIN_PROCEED',
        defaultMessage: 'Proceed',
    },
    TR_TERMS_OF_USE_INVITY: {
        defaultMessage: 'Terms of Use',
        id: 'TR_TERMS_OF_USE_INVITY',
    },
    TR_BUY_PROVIDED_BY_INVITY: {
        defaultMessage: 'Powered by',
        id: 'TR_BUY_PROVIDED_BY_INVITY',
    },
    TR_BUY_LEARN_MORE: {
        defaultMessage: 'Learn more',
        id: 'TR_BUY_LEARN_MORE',
    },
    TR_BUY_BUY: {
        defaultMessage: 'Buy',
        id: 'TR_BUY_BUY',
    },
    TR_BUY_PROVIDER: {
        defaultMessage: 'Provider',
        id: 'TR_BUY_PROVIDER',
    },
    TR_BUY_TRANS_ID: {
        defaultMessage: 'Trans. ID:',
        id: 'TR_BUY_TRANS_ID',
    },
    TR_BUY_RECEIVING_ADDRESS: {
        defaultMessage: 'Receive address',
        id: 'TR_BUY_RECEIVING_ADDRESS',
    },
    TR_BUY_CONFIRMED_ON_TREZOR: {
        defaultMessage: 'Confirmed on Trezor',
        id: 'TR_BUY_CONFIRMED_ON_TREZOR',
    },
    TR_BUY_NOT_TRANSACTIONS: {
        defaultMessage: 'No transactions yet.',
        id: 'TR_BUY_NOT_TRANSACTIONS',
    },
    TR_BUY_GO_TO_PAYMENT: {
        defaultMessage: 'Finish transaction',
        id: 'TR_BUY_GO_TO_PAYMENT',
    },
    TR_BUY_RECEIVING_ACCOUNT: {
        defaultMessage: 'Receive account',
        id: 'TR_BUY_RECEIVING_ACCOUNT',
    },
    TR_BUY_DETAIL_SUCCESS_TITLE: {
        defaultMessage: 'Approved',
        id: 'TR_BUY_DETAIL_SUCCESS_TITLE',
    },
    TR_BUY_DETAIL_SUCCESS_TEXT: {
        defaultMessage: 'Your transaction was approved; please wait for it to finish.',
        id: 'TR_BUY_DETAIL_SUCCESS_TEXT',
    },
    TR_BUY_DETAIL_SUCCESS_BUTTON: {
        defaultMessage: 'Back to Account',
        id: 'TR_BUY_DETAIL_SUCCESS_BUTTON',
    },
    TR_BUY_DETAIL_ERROR_TITLE: {
        defaultMessage: 'The transaction failed',
        id: 'TR_BUY_DETAIL_ERROR_TITLE',
    },
    TR_BUY_DETAIL_ERROR_TEXT: {
        defaultMessage:
            'Sorry, your transaction failed or was rejected. Your payment method was not charged.',
        id: 'TR_BUY_DETAIL_ERROR_TEXT',
    },
    TR_BUY_DETAIL_ERROR_SUPPORT: {
        defaultMessage: 'Go to provider support',
        id: 'TR_BUY_DETAIL_ERROR_SUPPORT',
    },
    TR_BUY_DETAIL_ERROR_BUTTON: {
        defaultMessage: 'Back to Account',
        id: 'TR_BUY_DETAIL_ERROR_BUTTON',
    },
    TR_BUY_DETAIL_PENDING_TITLE: {
        defaultMessage: 'Processing your transaction...',
        id: 'TR_BUY_DETAIL_PENDING_TITLE',
    },
    TR_BUY_DETAIL_PENDING_SUPPORT: {
        defaultMessage: 'Go to provider support',
        id: 'TR_BUY_DETAIL_PENDING_SUPPORT',
    },
    TR_BUY_DETAIL_SUBMITTED_TITLE: {
        defaultMessage: 'Waiting for your payment...',
        id: 'TR_BUY_DETAIL_SUBMITTED_TITLE',
    },
    TR_BUY_DETAIL_SUBMITTED_TEXT: {
        defaultMessage:
            "Click the button below to finish entering your details on the provider's site.",
        id: 'TR_BUY_DETAIL_SUBMITTED_TEXT',
    },
    TR_BUY_DETAIL_SUBMITTED_GATE: {
        defaultMessage: 'Go to payment gateway',
        id: 'TR_BUY_DETAIL_SUBMITTED_GATE',
    },
    TR_BUY_DETAIL_WAITING_FOR_USER_TITLE: {
        defaultMessage: 'Complete your transaction',
        id: 'TR_BUY_DETAIL_WAITING_FOR_USER_TITLE',
    },
    TR_BUY_DETAIL_WAITING_FOR_USER_TEXT: {
        defaultMessage:
            '{providerName} needs some final details to finish this transaction. Visit their site to proceed.',
        id: 'TR_BUY_DETAIL_WAITING_FOR_USER_TEXT',
    },
    TR_BUY_DETAIL_WAITING_FOR_USER_GATE: {
        defaultMessage: "Go to provider's site",
        id: 'TR_BUY_DETAIL_WAITING_FOR_USER_GATE',
    },
    TR_COINMARKET_OFFERS_EMPTY: {
        defaultMessage: 'No offers available for your request. Change country or buy amount.',
        id: 'TR_COINMARKET_OFFERS_EMPTY',
    },
    TR_COINMARKET_UNKNOWN_PROVIDER: {
        defaultMessage: 'Unknown provider',
        id: 'TR_COINMARKET_UNKNOWN_PROVIDER',
    },
    TR_COINMARKET_YOU_WILL_GET: {
        defaultMessage: "You'll get",
        id: 'TR_COINMARKET_YOU_WILL_GET',
    },
    TR_COINMARKET_YOU_WILL_PAY: {
        defaultMessage: "You'll pay",
        id: 'TR_COINMARKET_YOU_WILL_PAY',
    },
    TR_COINMARKET_SHOW_OFFERS: {
        defaultMessage: 'Compare offers',
        id: 'TR_COINMARKET_SHOW_OFFERS',
    },
    TR_COINMARKET_LAST_TRANSACTIONS: {
        defaultMessage: 'Last transactions',
        id: 'TR_COINMARKET_LAST_TRANSACTIONS',
    },
    TR_COINMARKET_TRANSACTION_COUNTER: {
        defaultMessage: '{totalBuys} buys • {totalSells} sells • {totalSwaps} swaps',
        id: 'TR_COINMARKET_TRANSACTION_COUNTER',
    },
    TR_COINMARKET_PAYMENT_METHOD: {
        defaultMessage: 'Payment method',
        id: 'TR_COINMARKET_PAYMENT_METHOD',
    },
    TR_COINMARKET_RECEIVE_METHOD: {
        defaultMessage: 'Receive method',
        id: 'TR_COINMARKET_RECEIVE_METHOD',
    },
    TR_COINMARKET_YOU_BUY: {
        defaultMessage: 'You buy',
        id: 'TR_COINMARKET_YOU_BUY',
    },
    TR_COINMARKET_YOU_SELL: {
        defaultMessage: 'You sell',
        id: 'TR_COINMARKET_YOU_SELL',
    },
    TR_COINMARKET_YOU_PAY: {
        defaultMessage: 'You pay',
        id: 'TR_COINMARKET_YOU_PAY',
    },
    TR_COINMARKET_YOU_GET: {
        defaultMessage: 'You get',
        id: 'TR_COINMARKET_YOU_GET',
    },
    TR_COINMARKET_YOU_RECEIVE: {
        defaultMessage: 'You receive',
        id: 'TR_COINMARKET_YOU_RECEIVE',
    },
    TR_COINMARKET_COUNTRY: {
        defaultMessage: 'Country of residence',
        id: 'TR_COINMARKET_COUNTRY',
    },
    TR_COINMARKET_YOUR_BEST_OFFER: {
        defaultMessage: 'Your best offer',
        id: 'TR_COINMARKET_YOUR_BEST_OFFER',
    },
    TR_COINMARKET_COMPARE_OFFERS: {
        defaultMessage: 'Compare all offers',
        id: 'TR_COINMARKET_COMPARE_OFFERS',
    },
    TR_COINMARKET_OFFER_LOOKING: {
        defaultMessage: 'Searching for your best offer',
        id: 'TR_COINMARKET_OFFER_LOOKING',
    },
    TR_COINMARKET_OFFER_NO_FOUND: {
        defaultMessage: 'No offers available for your request.',
        id: 'TR_COINMARKET_OFFER_NO_FOUND',
    },
    TR_COINMARKET_CHANGE_AMOUNT_OR_CURRENCY: {
        defaultMessage: 'Change amount or currency.',
        id: 'TR_COINMARKET_CHANGE_AMOUNT_OR_CURRENCY',
    },
    TR_COINMARKET_BEST_RATE: {
        defaultMessage: 'Best rate',
        id: 'TR_COINMARKET_BEST_RATE',
    },
    TR_COINMARKET_FEES_INCLUDED: {
        defaultMessage: 'Fees included',
        id: 'TR_COINMARKET_FEES_INCLUDED',
    },
    TR_COINMARKET_FEES_NOT_INCLUDED: {
        defaultMessage: 'Fees not included',
        id: 'TR_COINMARKET_FEES_NOT_INCLUDED',
    },
    TR_COINMARKET_FEES_ON_WEBSITE: {
        defaultMessage:
            "Some fees aren't included in the displayed price; the final cost is shown on the provider's website.",
        id: 'TR_COINMARKET_FEES_ON_WEBSITE',
    },
    TR_COINMARKET_NETWORK_FEE: {
        defaultMessage: 'Network fee',
        id: 'TR_COINMARKET_NETWORK_FEE',
    },
    TR_COINMARKET_TRADE_FEE: {
        defaultMessage: 'Trade fee',
        id: 'TR_COINMARKET_TRADE_FEE',
    },
    TR_COINMARKET_OFFERS_REFRESH: {
        defaultMessage: 'Offers refresh in',
        id: 'TR_COINMARKET_OFFERS_REFRESH',
    },
    TR_COINMARKET_OFFERS_SELECT: {
        defaultMessage: 'Select',
        id: 'TR_COINMARKET_OFFERS_SELECT',
    },
    TR_COINMARKET_POPULAR_CURRENCIES: {
        defaultMessage: 'Popular currencies',
        id: 'TR_COINMARKET_POPULAR_CURRENCIES',
    },
    TR_COINMARKET_OTHER_CURRENCIES: {
        defaultMessage: 'Other currencies',
        id: 'TR_COINMARKET_OTHER_CURRENCIES',
    },
    TR_COINMARKET_NETWORK_TOKENS: {
        defaultMessage: '{networkName} tokens',
        id: 'TR_COINMARKET_NETWORK_TOKENS',
    },
    TR_COINMARKET_TOKEN_NETWORK: {
        defaultMessage: '{tokenName} on {networkName} network',
        id: 'TR_COINMARKET_TOKEN_NETWORK',
    },
    TR_COINMARKET_ENTER_AMOUNT_IN: {
        defaultMessage: 'Enter amount in {currency}',
        id: 'TR_COINMARKET_ENTER_AMOUNT_IN',
    },
    TR_COINMARKET_SELL: {
        id: 'TR_COINMARKET_SELL',
        defaultMessage: 'Sell',
    },
    TR_COINMARKET_RATE: {
        id: 'TR_COINMARKET_RATE',
        defaultMessage: 'Rate',
    },
    TR_COINMARKET_FIX_RATE: {
        id: 'TR_COINMARKET_FIX_RATE',
        defaultMessage: 'Fixed rate',
    },
    TR_COINMARKET_FLOATING_RATE: {
        id: 'TR_COINMARKET_FLOATING_RATE',
        defaultMessage: 'Floating rate',
    },
    TR_COINMARKET_FIX_RATE_DESCRIPTION: {
        id: 'TR_COINMARKET_FIX_RATE_DESCRIPTION',
        defaultMessage: 'Lock in your rate for 15 minutes by paying a higher fee.',
    },
    TR_COINMARKET_FLOATING_RATE_DESCRIPTION: {
        id: 'TR_COINMARKET_FLOATING_RATE_DESCRIPTION',
        defaultMessage: 'Get an estimated rate that may adjust with real-time market changes.',
    },
    TR_COINMARKET_CEX_TOOLTIP: {
        id: 'TR_COINMARKET_CEX_TOOLTIP',
        defaultMessage: 'Centralized exchange',
        dynamic: true,
    },
    TR_COINMARKET_DEX_TOOLTIP: {
        id: 'TR_COINMARKET_DEX_TOOLTIP',
        defaultMessage: 'Decentralized exchange',
        dynamic: true,
    },
    TR_COINMARKET_NO_CEX_PROVIDER_FOUND: {
        id: 'TR_COINMARKET_NO_CEX_PROVIDER_FOUND',
        defaultMessage: 'No CEX provider found',
    },
    TR_COINMARKET_NO_DEX_PROVIDER_FOUND: {
        id: 'TR_COINMARKET_NO_DEX_PROVIDER_FOUND',
        defaultMessage: 'No DEX provider found',
    },
    TR_COINMARKET_FEATURED_OFFERS_HEADING: {
        defaultMessage: 'Featured offers',
        id: 'TR_COINMARKET_FEATURED_OFFERS_HEADING',
    },
    TR_COINMARKET_FEATURED_OFFER_PAYMENT_METHOD_BUY_LABEL: {
        defaultMessage: 'Payment:',
        id: 'TR_COINMARKET_FEATURED_OFFER_PAYMENT_METHOD_BUY_LABEL',
        dynamic: true,
    },
    TR_COINMARKET_FEATURED_OFFER_PAYMENT_METHOD_SELL_LABEL: {
        defaultMessage: 'Receive method:',
        id: 'TR_COINMARKET_FEATURED_OFFER_PAYMENT_METHOD_SELL_LABEL',
        dynamic: true,
    },
    TR_COINMARKET_NO_METHODS_AVAILABLE: {
        defaultMessage: 'No methods available',
        id: 'TR_COINMARKET_NO_METHODS_AVAILABLE',
    },
    TR_COINMARKET_SWAP_AMOUNT: {
        defaultMessage: 'Swap amount',
        id: 'TR_COINMARKET_SWAP_AMOUNT',
    },
    TR_COINMARKET_ON_NETWORK_CHAIN: {
        defaultMessage: 'On {networkName} chain',
        id: 'TR_COINMARKET_ON_NETWORK_CHAIN',
    },
    TR_COINMARKET_KYC_POLICY: {
        defaultMessage: 'KYC policy',
        id: 'TR_COINMARKET_KYC_POLICY',
    },
    TR_COINMARKET_KYC_POLICY_NEVER_REQUIRED: {
        defaultMessage: 'KYC never required',
        id: 'TR_COINMARKET_KYC_POLICY_NEVER_REQUIRED',
    },
    TR_COINMARKET_KYC_NO_REFUND: {
        defaultMessage: 'KYC requested in exceptional cases. KYC required for refunds. 👈',
        id: 'TR_COINMARKET_KYC_NO_REFUND',
    },
    TR_COINMARKET_KYC_YES_REFUND: {
        defaultMessage: 'KYC requested in exceptional cases. KYC not required for refunds. 🤝',
        id: 'TR_COINMARKET_KYC_YES_REFUND',
    },
    TR_COINMARKET_KYC_NO_KYC: {
        defaultMessage: 'KYC never required. Exceptional cases automatically refunded. 👍',
        id: 'TR_COINMARKET_KYC_NO_KYC',
    },
    TR_COINMARKET_KYC_DEX: {
        defaultMessage: 'KYC never required. DEX swaps either succeed or fail. 👍',
        id: 'TR_COINMARKET_KYC_DEX',
    },
    TR_COINMARKET_DCA_HEADING: {
        defaultMessage: 'Save in Bitcoin with the Invity app',
        id: 'TR_COINMARKET_DCA_HEADING',
    },
    TR_COINMARKET_DCA_FEATURE_1_SUBHEADING: {
        defaultMessage: 'Developed by SatoshiLabs',
        id: 'TR_COINMARKET_DCA_FEATURE_1_SUBHEADING',
        dynamic: true,
    },
    TR_COINMARKET_DCA_FEATURE_1_DESCRIPTION: {
        defaultMessage: 'A safe & simple custodial DCA savings plan.',
        id: 'TR_COINMARKET_DCA_FEATURE_1_DESCRIPTION',
        dynamic: true,
    },
    TR_COINMARKET_DCA_FEATURE_2_SUBHEADING: {
        defaultMessage: 'Free withdrawals',
        id: 'TR_COINMARKET_DCA_FEATURE_2_SUBHEADING',
        dynamic: true,
    },
    TR_COINMARKET_DCA_FEATURE_2_DESCRIPTION: {
        defaultMessage: 'Withdraw to self-custody without extra fees.',
        id: 'TR_COINMARKET_DCA_FEATURE_2_DESCRIPTION',
        dynamic: true,
    },
    TR_COINMARKET_DCA_FEATURE_3_SUBHEADING: {
        defaultMessage: 'Easy to use',
        id: 'TR_COINMARKET_DCA_FEATURE_3_SUBHEADING',
        dynamic: true,
    },
    TR_COINMARKET_DCA_FEATURE_3_DESCRIPTION: {
        defaultMessage: 'A quick, streamlined, user-friendly interface.',
        id: 'TR_COINMARKET_DCA_FEATURE_3_DESCRIPTION',
        dynamic: true,
    },
    TR_COINMARKET_DCA_FEATURE_4_SUBHEADING: {
        defaultMessage: 'DCA Overview',
        id: 'TR_COINMARKET_DCA_FEATURE_4_SUBHEADING',
        dynamic: true,
    },
    TR_COINMARKET_DCA_FEATURE_4_DESCRIPTION: {
        defaultMessage: 'Monitor your investment history, amount & frequency.',
        id: 'TR_COINMARKET_DCA_FEATURE_4_DESCRIPTION',
        dynamic: true,
    },
    TR_COINMARKET_DCA_DOWNLOAD: {
        defaultMessage: 'Download the Invity mobile app to start saving in Bitcoin',
        id: 'TR_COINMARKET_DCA_DOWNLOAD',
    },
    TR_COINMARKET_BUY_AND_SELL: {
        defaultMessage: 'Buy & Sell',
        id: 'TR_COINMARKET_BUY_AND_SELL',
    },
    TR_COINMARKET_SWAP: {
        defaultMessage: 'Swap',
        id: 'TR_COINMARKET_SWAP',
    },
    TR_ADDRESS_MODAL_CLIPBOARD: {
        defaultMessage: 'Copy address',
        id: 'TR_ADDRESS_MODAL_CLIPBOARD',
    },
    TR_COPY_TO_CLIPBOARD_TX_ID: {
        defaultMessage: 'Copy',
        id: 'TR_COPY_TO_CLIPBOARD_TX_ID',
    },
    TR_ADDRESS_MODAL_TITLE: {
        defaultMessage: '{networkName} receive address',
        id: 'TR_ADDRESS_MODAL_TITLE',
    },
    TR_ADDRESS_MODAL_TITLE_EXCHANGE: {
        defaultMessage: '{networkCurrencyName} receive address on {networkName} network',
        id: 'TR_ADDRESS_MODAL_TITLE_EXCHANGE',
    },
    TR_XPUB_MODAL_CLIPBOARD: {
        defaultMessage: 'Copy public key',
        id: 'TR_XPUB_MODAL_CLIPBOARD',
    },
    TR_XPUB_MODAL_TITLE: {
        defaultMessage: '{networkName} Account {accountIndex} public key (XPUB)',
        id: 'TR_XPUB_MODAL_TITLE',
    },
    TR_XPUB_MODAL_TITLE_METADATA: {
        defaultMessage: '{accountLabel} public key (XPUB)',
        id: 'TR_XPUB_MODAL_TITLE_METADATA',
        description: 'accountLabel is user defined name of account, might be pretty much anything.',
    },
    TR_IMPORT_CSV_MODAL_TITLE: {
        defaultMessage: 'Import addresses from CSV',
        id: 'TR_IMPORT_CSV_MODAL_TITLE',
    },
    TR_IMPORT_CSV_MODAL_SHOW_EXAMPLE: {
        defaultMessage: 'Show CSV example',
        id: 'TR_IMPORT_CSV_MODAL_SHOW_EXAMPLE',
    },
    TR_IMPORT_CSV_MODAL_HIDE_EXAMPLE: {
        defaultMessage: 'Hide example',
        id: 'TR_IMPORT_CSV_MODAL_HIDE_EXAMPLE',
    },
    TR_IMPORT_CSV_MODAL_DELIMITER_DEFAULT: {
        defaultMessage: 'Auto detect delimiter',
        id: 'TR_IMPORT_CSV_MODAL_DELIMITER_DEFAULT',
    },
    TR_IMPORT_CSV_MODAL_DELIMITER_CUSTOM: {
        defaultMessage: 'Custom delimiter',
        id: 'TR_IMPORT_CSV_MODAL_DELIMITER_CUSTOM',
    },
    TR_IMPORT_CSV_FROM_FILE: {
        defaultMessage: 'Import from file',
        id: 'TR_IMPORT_CSV_FROM_FILE',
    },
    TR_IMPORT_CSV_FROM_TEXT: {
        defaultMessage: 'Import as text',
        id: 'TR_IMPORT_CSV_FROM_TEXT',
    },
    TR_DROPZONE: {
        defaultMessage: 'Drag and drop file here or click to select from files',
        id: 'TR_DROPZONE',
    },
    TR_DROPZONE_ERROR: {
        defaultMessage: 'Import failed: {error}',
        id: 'TR_DROPZONE_ERROR',
    },
    TR_DROPZONE_ERROR_EMPTY: {
        defaultMessage: 'No file selected',
        id: 'TR_DROPZONE_ERROR_EMPTY',
    },
    TR_DROPZONE_ERROR_FILETYPE: {
        defaultMessage: 'Incorrect file type',
        id: 'TR_DROPZONE_ERROR_FILETYPE',
    },
    TR_ADVANCED_RECOVERY: {
        defaultMessage: 'Advanced recovery',
        description: 'Enter words via obfuscated pin matrix, recovery takes about 5 minutes.',
        id: 'TR_ADVANCED_RECOVERY',
    },
    TR_ADVANCED_RECOVERY_OPTION: {
        defaultMessage: 'Spell out each word of your wallet backup using your Trezor device.',
        description: 'Button for selecting advanced recovery option',
        id: 'TR_ADVANCED_RECOVERY_OPTION',
    },
    TR_ALL: {
        defaultMessage: 'All',
        id: 'TR_ALL',
    },
    TR_ONBOARDING_ALLOW_ANALYTICS: {
        defaultMessage: 'Allow anonymous data collection',
        id: 'TR_ONBOARDING_ALLOW_ANALYTICS',
    },
    TR_ALLOW_ANALYTICS: {
        defaultMessage: 'Data usage',
        id: 'TR_ALLOW_ANALYTICS',
    },
    TR_ALLOW_ANALYTICS_DESCRIPTION: {
        defaultMessage:
            "All data is kept strictly anonymous. It's only used to improve the Trezor ecosystem.",
        id: 'TR_ALLOW_ANALYTICS_DESCRIPTION',
    },
    TR_ALLOW_AUTOMATIC_SUITE_UPDATES: {
        defaultMessage: 'Automatic Trezor Suite updates',
        id: 'TR_ALLOW_AUTOMATIC_SUITE_UPDATES',
    },
    TR_ALLOW_AUTOMATIC_SUITE_UPDATES_DESCRIPTION: {
        defaultMessage:
            "Trezor Suite automatically downloads the latest version in the background and installs it when restarting the app. This ensures you're always up-to-date with the latest features and security patches. Updates occur without requiring your permission.",
        id: 'TR_ALLOW_AUTOMATIC_SUITE_UPDATES_DESCRIPTION',
    },
    TR_ADDRESS_DISPLAY: {
        defaultMessage: 'Address display',
        id: 'TR_ADDRESS_DISPLAY',
    },
    TR_ADDRESS_DISPLAY_DESCRIPTION: {
        defaultMessage:
            'Display address continuous (bc1wetes...v54d8d) or spaced (bc1w etes ... v54d 8d).',
        id: 'TR_ADDRESS_DISPLAY_DESCRIPTION',
    },
    TR_ORIGINAL_ADDRESS: {
        defaultMessage: 'Continuous',
        id: 'TR_ORIGINAL_ADDRESS',
    },
    TR_CHUNKED_ADDRESS: {
        defaultMessage: 'Spaced',
        id: 'TR_CHUNKED_ADDRESS',
    },
    TR_ASSETS: {
        defaultMessage: 'Coin',
        id: 'TR_ASSETS',
    },
    TR_AUTH_CONFIRM_FAILED_RETRY: {
        defaultMessage: 'Retry',
        id: 'TR_AUTH_CONFIRM_FAILED_RETRY',
    },
    TR_AUTH_CONFIRM_FAILED_TITLE: {
        defaultMessage: 'Wrong passphrase',
        id: 'TR_AUTH_CONFIRM_FAILED_TITLE',
    },
    TR_BACK: {
        defaultMessage: 'Back',
        description: 'Back button',
        id: 'TR_BACK',
    },
    TR_CONNECT: {
        defaultMessage: 'Connect',
        id: 'TR_CONNECT',
    },
    TR_CONNECTION_LOST: {
        defaultMessage: 'Connection lost',
        id: 'TR_CONNECTION_LOST',
    },
    TR_UPGRADE_FIRMWARE_TO_DISCOVER_ACCOUNT_ERROR: {
        defaultMessage: 'Upgrade your firmware to access this account. See the blue banner above.',
        id: 'TR_UPGRADE_FIRMWARE_TO_DISCOVER_ACCOUNT_ERROR',
    },
    TR_DISCONNECT: {
        defaultMessage: 'Disconnect',
        id: 'TR_DISCONNECT',
    },
    TR_BACKEND_DISCONNECTED: {
        defaultMessage: 'Backend is disconnected',
        id: 'TR_BACKEND_DISCONNECTED',
    },
    TR_BACKEND_RECONNECTING: {
        defaultMessage: 'Reconnecting in {time} sec...',
        description: 'Should start with dot, continuation of TR_BACKEND_DISCONNECTED',
        id: 'TR_BACKEND_RECONNECTING',
    },
    TR_HOMESCREEN_GALLERY: {
        defaultMessage: 'Homescreen gallery',
        id: 'TR_HOMESCREEN_GALLERY',
    },
    TR_BACKUP: {
        defaultMessage: 'Wallet backup',
        id: 'TR_BACKUP',
    },
    TR_BACKUP_FINISHED_BUTTON: {
        defaultMessage: 'Continue to PIN',
        description: 'Exit button after backup is finished',
        id: 'TR_BACKUP_FINISHED_BUTTON',
    },
    TR_BACKUP_FINISHED_TEXT: {
        defaultMessage:
            "If you've written down your wallet backup, your Trezor is nearly ready. Don't lose your wallet backup, otherwise you won't be able to recover your funds.",
        description: 'Text that appears after backup is finished',
        id: 'TR_BACKUP_FINISHED_TEXT',
    },
    TR_BACKUP_RECOVERY_SEED: {
        defaultMessage: 'Backup',
        id: 'TR_BACKUP_RECOVERY_SEED',
    },
    TR_BACKUP_SUBHEADING_1: {
        defaultMessage:
            "A wallet backup is a series of randomly generated words created by your Trezor. It’s important to write down your wallet backup and keep it safe, as it's the only way to recover and access your funds.",
        description: 'Explanation what recovery seed is',
        id: 'TR_BACKUP_SUBHEADING_1',
    },
    TR_ONBOARDING_TREZOR_WILL_DISPLAY_BACKUP: {
        defaultMessage:
            "Trezor will display your wallet backup. Write it down accurately and store securely. It's the only way to recover your funds.",
        id: 'TR_ONBOARDING_TREZOR_WILL_DISPLAY_BACKUP',
    },
    TR_ONBOARDING_BACKUP_SUBHEADING: {
        defaultMessage:
            "Your wallet backup consists of a list of words generated by your Trezor. Write it down accurately and store securely. It's the only way to recover your funds.",
        id: 'TR_ONBOARDING_BACKUP_SUBHEADING',
    },
    TR_BASIC_RECOVERY: {
        defaultMessage: 'Standard recovery',
        id: 'TR_BASIC_RECOVERY',
    },
    TR_BASIC_RECOVERY_OPTION: {
        defaultMessage: 'Enter your wallet backup word by word on your computer.',
        description: 'Enter words on your computer, recovery takes about 2 minutes.',
        id: 'TR_BASIC_RECOVERY_OPTION',
    },
    TR_MULTI_SHARE_BACKUP: {
        defaultMessage: 'Multi-share Backup',
        id: 'TR_MULTI_SHARE_BACKUP',
    },
    TR_MULTI_SHARE_BACKUP_DESCRIPTION: {
        defaultMessage:
            'Generates multiple 20-word shares (wordlists) to recover your wallet. A minimum number of shares, set by you, are needed to regain access to your wallet.',
        id: 'TR_MULTI_SHARE_BACKUP_DESCRIPTION',
    },
    TR_MULTI_SHARE_BACKUP_IN_PROGRESS: {
        defaultMessage: 'Multi-share Backup generation in progress',
        id: 'TR_MULTI_SHARE_BACKUP_IN_PROGRESS',
    },
    TR_MULTI_SHARE_BACKUP_IN_PROGRESS_HEADING: {
        defaultMessage: 'Welcome back! Let’s pick up where you left off.',
        id: 'TR_MULTI_SHARE_BACKUP_IN_PROGRESS_HEADING',
    },
    TR_MULTI_SHARE_BACKUP_IN_PROGRESS_DESCRIPTION: {
        defaultMessage:
            'It’s necessary to finish generating your Multi-share Backup shares before continuing. Follow the instructions on your Trezor’s screen. ',
        id: 'TR_MULTI_SHARE_BACKUP_IN_PROGRESS_DESCRIPTION',
    },
    TR_CREATE_MULTI_SHARE_BACKUP: {
        defaultMessage: 'Create Multi-share Backup',
        id: 'TR_CREATE_MULTI_SHARE_BACKUP',
    },
    TR_MULTI_SHARE_BACKUP_CALLOUT_1: {
        defaultMessage: 'How does it work?',
        id: 'TR_MULTI_SHARE_BACKUP_CALLOUT_1',
    },
    TR_MULTI_SHARE_BACKUP_CALLOUT_2: {
        defaultMessage: 'What about my current wallet backup?',
        id: 'TR_MULTI_SHARE_BACKUP_CALLOUT_2',
    },
    TR_MULTI_SHARE_BACKUP_CALLOUT_3: {
        defaultMessage: 'Take note',
        id: 'TR_MULTI_SHARE_BACKUP_CALLOUT_3',
    },
    TR_MULTI_SHARE_BACKUP_EXPLANATION_1: {
        defaultMessage:
            'Generates multiple 20-word shares (wordlists) to recover your wallet. A minimum number of shares, set by you, are needed to regain access to your wallet.',
        id: 'TR_MULTI_SHARE_BACKUP_EXPLANATION_1',
    },
    TR_MULTI_SHARE_BACKUP_EXPLANATION_2: {
        defaultMessage:
            'Your current backup still allows you to recover your funds. Store it in a safe and secure location, separate from your Multi-share Backup shares.',
        id: 'TR_MULTI_SHARE_BACKUP_EXPLANATION_2',
    },
    TR_MULTI_SHARE_BACKUP_CHECKBOX_1: {
        defaultMessage: 'This is an advanced feature, and I accept the increased responsibility',
        id: 'TR_MULTI_SHARE_BACKUP_CHECKBOX_1',
    },
    TR_MULTI_SHARE_BACKUP_CHECKBOX_2: {
        defaultMessage: 'My current wallet backup is still able to recover my wallet',
        id: 'TR_MULTI_SHARE_BACKUP_CHECKBOX_2',
    },
    TR_MULTI_SHARE_TIPS_ON_STORING_BACKUP: {
        defaultMessage: 'Tips for storing your wallet backup',
        id: 'TR_MULTI_SHARE_TIPS_ON_STORING_BACKUP',
    },
    TR_CREATE_MULTI_SHARE_BACKUP_CREATED: {
        defaultMessage: 'Multi-share Backup created',
        id: 'TR_CREATE_MULTI_SHARE_BACKUP_CREATED',
    },
    TR_MULTI_SHARE_BACKUP_GREAT: {
        defaultMessage: 'Great!',
        id: 'TR_MULTI_SHARE_BACKUP_GREAT',
    },
    TR_CREATE_MULTI_SHARE_BACKUP_CREATED_INFO_TEXT: {
        defaultMessage:
            "You've taken a major step in enhancing your security. Now, choose trusted individuals or secure locations for storing your shares.",
        id: 'TR_CREATE_MULTI_SHARE_BACKUP_CREATED_INFO_TEXT',
    },
    TR_MULTI_SHARE_BACKUP_BACKUPS: {
        defaultMessage: 'My backups',
        id: 'TR_MULTI_SHARE_BACKUP_BACKUPS',
    },
    TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT_HEADER: {
        defaultMessage: 'My previous backup',
        id: 'TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT',
    },
    TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT_LINE1: {
        defaultMessage: 'Still recovers your wallet',
        id: 'TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT_LINE1',
    },
    TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT_LINE2: {
        defaultMessage: 'Store securely, separate from your new wallet backup',
        id: 'TR_MULTI_SHARE_BACKUP_SUCCESS_LEFT_LINE2',
    },
    TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT_HEADER: {
        defaultMessage: 'My new Multi-share Backup',
        id: 'TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT',
    },
    TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT_LINE1: {
        defaultMessage: 'Recover your wallet with your set minimum number of shares',
        id: 'TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT_LINE1',
    },
    TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT_LINE2: {
        defaultMessage: 'Share with trusted individuals or store in secure, separate locations',
        id: 'TR_MULTI_SHARE_BACKUP_SUCCESS_RIGHT_LINE2',
    },
    TR_MULTI_SHARE_BACKUP_SUCCESS_WHY_IS_BACKUP_IMPORTANT: {
        defaultMessage: 'Why is your wallet backup important?',
        id: 'TR_MULTI_SHARE_BACKUP_SUCCESS_WHY_IS_BACKUP_IMPORTANT',
    },
    TR_MULTI_SHARE_BACKUP_LOST_YOUR_TREZOR: {
        defaultMessage: 'Lost your Trezor?',
        id: 'TR_MULTI_SHARE_BACKUP_LOST_YOUR_TREZOR',
    },
    TR_MULTI_SHARE_BACKUP_LOST_YOUR_TREZOR_INFO_TEXT: {
        defaultMessage: 'Use your wallet backup to recover access to your wallet.',
        id: 'TR_MULTI_SHARE_BACKUP_LOST_YOUR_TREZOR_INFO_TEXT',
    },
    TR_MULTI_SHARE_BACKUP_LOST_YOUR_BACKUP: {
        defaultMessage: 'Lost your wallet backup?',
        id: 'TR_MULTI_SHARE_BACKUP_LOST_YOUR_BACKUP',
    },
    TR_MULTI_SHARE_BACKUP_LOST_YOUR_BACKUP_INFO_TEXT: {
        defaultMessage: 'There may be no options to recover your wallet. Contact Trezor Support.',
        id: 'TR_MULTI_SHARE_BACKUP_LOST_YOUR_BACKUP_INFO_TEXT',
    },
    TR_NEXT_UP: {
        defaultMessage: 'Next',
        id: 'TR_NEXT_UP',
    },
    TR_N_MIN: {
        defaultMessage: '{n} min',
        id: 'TR_N_MIN',
    },
    TR_VERIFY_TREZOR_OWNERSHIP: {
        defaultMessage: 'Verify you own this Trezor',
        id: 'TR_VERIFY_TREZOR_OWNERSHIP',
    },
    TR_VERIFY_TREZOR_OWNERSHIP_EXPLANATION: {
        defaultMessage:
            'Confirm you own this wallet by entering your current wallet backup on your Trezor.',
        id: 'TR_VERIFY_TREZOR_OWNERSHIP_EXPLANATION',
    },
    TR_VERIFY_TREZOR_OWNERSHIP_CARD_1: {
        defaultMessage: 'Get your current wallet backup',
        id: 'TR_VERIFY_TREZOR_OWNERSHIP_CARD_1',
    },
    TR_VERIFY_TREZOR_OWNERSHIP_CARD_2: {
        defaultMessage: 'No pictures or digital copies of your wallet backup',
        id: 'TR_VERIFY_TREZOR_OWNERSHIP_CARD_2',
    },
    TR_CREATE_SHARES: {
        defaultMessage: 'Create shares on Trezor',
        id: 'TR_CREATE_SHARES',
    },
    TR_CREATE_SHARES_EXPLANATION: {
        defaultMessage:
            'Select the total number of shares, then choose the minimum number required to recover your Trezor.',
        id: 'TR_CREATE_SHARES_EXPLANATION',
    },
    TR_CREATE_SHARES_EXAMPLE: {
        defaultMessage: 'Example: 5 total shares, any 3 required to recover your wallet',
        id: 'TR_CREATE_SHARES_EXAMPLE',
    },
    TR_CREATE_SHARES_CARD_1: {
        defaultMessage:
            'Grab a pen & paper, print <cardsLink>backup cards</cardsLink>, or use <keepLink>Trezor Keep Metal</keepLink>',
        id: 'TR_CREATE_SHARES_CARD_1',
    },
    TR_CREATE_SHARES_CARD_2: {
        defaultMessage: 'Don’t take pictures or make digital copies of your wallet backup',
        id: 'TR_CREATE_SHARES_CARD_2',
    },
    TR_CREATE_SHARES_CARD_3: {
        defaultMessage: "Make sure it's just you—no curious onlookers",
        id: 'TR_CREATE_SHARES_CARD_3',
    },
    TR_ENTER_EXISTING_BACKUP: {
        defaultMessage: 'Enter current wallet backup on Trezor',
        id: 'TR_ENTER_EXISTING_BACKUP',
    },
    TR_DONT_HAVE_BACKUP: {
        defaultMessage: "I don't have a wallet backup",
        id: 'TR_DONT_HAVE_BACKUP',
    },
    TR_BCH_ADDRESS_INFO: {
        defaultMessage:
            'Bitcoin Cash changed the address format to cashaddr. Find more info about how to convert your address on our blog. {TR_LEARN_MORE}',
        id: 'TR_BCH_ADDRESS_INFO',
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
    TR_CHANGELOG: {
        defaultMessage: 'Changelog',
        description: 'Part of the sentence: Learn more about latest version in {TR_CHANGELOG}.',
        id: 'TR_CHANGELOG',
    },
    TR_CHECK_FOR_DEVICES: {
        defaultMessage: 'Find Trezor',
        id: 'TR_CHECK_FOR_DEVICES',
    },
    TR_CHECK_RECOVERY_SEED: {
        defaultMessage: 'Check backup',
        id: 'TR_CHECK_RECOVERY_SEED',
    },
    TR_CHECK_SEED: {
        defaultMessage: 'Check backup',
        id: 'TR_CHECK_SEED',
    },
    TR_CHECK_YOUR_DEVICE: {
        defaultMessage: "Check your Trezor's screen",
        description: 'Placeholder in seed input asking user to pay attention to his device',
        id: 'TR_CHECK_YOUR_DEVICE',
    },
    TR_CHECKSUM_CONVERSION_INFO: {
        defaultMessage: 'Converted to checksum. <a>Learn more</a>',
        id: 'TR_CHECKSUM_CONVERSION_INFO',
    },
    TR_CLEAR_ALL: {
        defaultMessage: 'Clear all',
        description: 'Clear form button',
        id: 'TR_CLEAR_ALL',
    },
    TR_CLOSE: {
        defaultMessage: 'Close',
        id: 'TR_CLOSE',
    },
    TR_COIN_DISCOVERY_LOADER_DESCRIPTION: {
        defaultMessage: 'Checking passphrase wallet for balances & transactions',
        id: 'TR_COIN_DISCOVERY_LOADER_DESCRIPTION',
    },
    TR_COINS: {
        defaultMessage: 'Coins',
        id: 'TR_COINS',
    },
    TR_HIDDEN: {
        defaultMessage: 'Hidden',
        id: 'TR_HIDDEN',
    },
    TR_HIDDEN_TOKENS: {
        defaultMessage: 'Hidden tokens',
        id: 'TR_HIDDEN_TOKENS',
    },
    TR_CONFIRM: {
        defaultMessage: 'Confirm',
        id: 'TR_CONFIRM',
    },
    TR_CONFIRM_ACTION_ON_YOUR: {
        defaultMessage: "Follow the instructions on your Trezor's screen",
        id: 'TR_CONFIRM_ACTION_ON_YOUR',
    },
    TR_CONFIRM_EMPTY_HIDDEN_WALLET_ON: {
        defaultMessage: 'Confirm empty Passprase wallet on "{deviceLabel}" device.',
        id: 'TR_CONFIRM_EMPTY_HIDDEN_WALLET_ON',
    },
    TR_CONFIRM_PASSPHRASE_WITHOUT_ADVICE_DESCRIPTION: {
        defaultMessage: 'Enter your passphrase to authorize this action.',
        id: 'TR_CONFIRM_PASSPHRASE_WITHOUT_ADVICE_DESCRIPTION',
    },
    TR_CONFIRM_PASSPHRASE: {
        defaultMessage: 'Confirm passphrase',
        id: 'TR_CONFIRM_PASSPHRASE',
    },
    TR_CONFIRM_PASSPHRASE_SOURCE: {
        defaultMessage:
            'Confirm empty Passphrase wallet passphrase source on "{deviceLabel}" device.',
        id: 'TR_CONFIRM_PASSPHRASE_SOURCE',
    },
    TR_CONFIRMED_TX: {
        defaultMessage: 'Confirmed',
        id: 'TR_CONFIRMED_TX',
    },
    TR_CONNECT_YOUR_DEVICE: {
        defaultMessage: 'Connect & unlock your Trezor',
        description: 'Prompt to user to connect his device.',
        id: 'TR_CONNECT_YOUR_DEVICE',
    },
    TR_RECONNECT_YOUR_DEVICE: {
        defaultMessage: 'Reconnect your Trezor',
        description: 'Prompt to user to reconnect his device.',
        id: 'TR_RECONNECT_YOUR_DEVICE',
    },
    TR_CONNECTED: {
        defaultMessage: 'Connected',
        description: 'Device status',
        id: 'TR_CONNECTED',
    },
    TR_CONTACT_SUPPORT: {
        defaultMessage: 'Contact Trezor Support',
        description: 'Button to click to contact support',
        id: 'TR_CONTACT_SUPPORT',
    },
    TR_CONTINUE: {
        defaultMessage: 'Continue',
        description: 'Generic continue button',
        id: 'TR_CONTINUE',
    },
    TR_YES_CONTINUE: {
        defaultMessage: 'Yes, continue',
        id: 'TR_YES_CONTINUE',
    },
    TR_SETUP_MY_TREZOR: {
        defaultMessage: 'Set up my Trezor',
        id: 'TR_SETUP_MY_TREZOR',
    },
    TR_YES_SETUP_MY_TREZOR: {
        defaultMessage: 'Yes, set up my Trezor',
        id: 'TR_YES_SETUP_MY_TREZOR',
    },
    TR_UNHIDE_TOKEN_TITLE: {
        defaultMessage: 'Unhide this token?',
        id: 'TR_UNHIDE_TOKEN_TITLE',
    },
    TR_UNHIDE_TOKEN_TEXT: {
        defaultMessage: 'This token appears to be suspicious and may be a scam.',
        id: 'TR_UNHIDE_TOKEN_TEXT',
    },
    TR_NOT_YOUR_RECEIVE_ADDRRESS: {
        defaultMessage: "This isn't your receive address.",
        id: 'TR_NOT_YOUR_RECEIVE_ADDRRESS',
    },
    TR_COPY_ADDRESS_CONTRACT: {
        defaultMessage: 'Never send funds to a contract address.',
        id: 'TR_COPY_ADDRESS_CONTRACT',
    },
    TR_COPY_ADDRESS_FINGERPRINT: {
        defaultMessage: 'Never send funds to a fingerprint address.',
        id: 'TR_COPY_ADDRESS_FINGERPRINT',
    },
    TR_COPY_ADDRESS_POLICY_ID: {
        defaultMessage: 'Never send funds to a policy ID address.',
        id: 'TR_COPY_ADDRESS_POLICY_ID',
    },
    TR_CREATE_BACKUP: {
        defaultMessage: 'Create backup',
        id: 'TR_CREATE_BACKUP',
    },
    TR_DETAIL: {
        defaultMessage: 'Detail',
        description: 'Button in modal, button in UTXO selection',
        id: 'TR_DETAIL',
    },
    TR_DEVICE: {
        defaultMessage: 'Device',
        description: 'Category in Settings, step in Onboarding',
        id: 'TR_DEVICE',
    },
    TR_DEVICE_DISCONNECTED_DURING_ACTION_DESCRIPTION: {
        defaultMessage:
            'Your Trezor was disconnected during the backup process. We strongly recommend that you use the factory reset option in Device settings to wipe your device and start the wallet backup process again.',
        description: 'Error message. Instruction what to do.',
        id: 'TR_DEVICE_DISCONNECTED_DURING_ACTION_DESCRIPTION',
    },
    TR_DEVICE_LABEL_IS_NOT_BACKED_UP: {
        defaultMessage: 'Device "{deviceLabel}" isn\'t backed up',
        id: 'TR_DEVICE_LABEL_IS_NOT_BACKED_UP',
    },
    TR_DEVICE_NOT_CONNECTED: {
        defaultMessage: 'Device not connected',
        id: 'TR_DEVICE_NOT_CONNECTED',
    },
    TR_DEVICE_FW_UNKNOWN: {
        defaultMessage: 'Unknown',
        id: 'TR_DEVICE_FW_UNKNOWN',
    },
    TR_DEVICE_LABEL_IS_NOT_CONNECTED: {
        defaultMessage: 'Device "{deviceLabel}" isn\'t connected',
        id: 'TR_DEVICE_LABEL_IS_NOT_CONNECTED',
    },
    TR_DEVICE_LABEL_IS_UNAVAILABLE: {
        defaultMessage: 'Device "{deviceLabel}" is unavailable',
        id: 'TR_DEVICE_LABEL_IS_UNAVAILABLE',
    },
    TR_ETH_ADDRESS_NOT_USED_NOT_CHECKSUMMED: {
        defaultMessage:
            "Address has no transaction history and isn't checksummed. Check that the address is correct.",
        id: 'TR_ETH_ADDRESS_NOT_USED_NOT_CHECKSUMMED',
    },
    TR_ETH_ADDRESS_CANT_VERIFY_HISTORY: {
        defaultMessage: 'Unable to verify address history. Check that the address is correct.',
        id: 'TR_ETH_ADDRESS_CANT_VERIFY_HISTORY',
    },
    TR_NEEDS_ATTENTION_BOOTLOADER: {
        defaultMessage: 'Trezor is in Bootloader mode.',
        id: 'TR_NEEDS_ATTENTION_BOOTLOADER',
    },
    TR_NEEDS_ATTENTION_INITIALIZE: {
        defaultMessage: 'Trezor has not been set up.',
        id: 'TR_NEEDS_ATTENTION_INITIALIZE',
    },
    TR_NEEDS_ATTENTION_SEEDLESS: {
        defaultMessage: "Trezor doesn't have a wallet backup.",
        id: 'TR_NEEDS_ATTENTION_SEEDLESS',
    },
    TR_NEEDS_ATTENTION_USED_IN_OTHER_WINDOW: {
        defaultMessage: 'Trezor is already in use.',
        id: 'TR_NEEDS_ATTENTION_USED_IN_OTHER_WINDOW',
    },
    TR_NEEDS_ATTENTION_WAS_USED_IN_OTHER_WINDOW: {
        defaultMessage: 'Trezor is already in use.',
        id: 'TR_NEEDS_ATTENTION_WAS_USED_IN_OTHER_WINDOW',
    },
    TR_NEEDS_ATTENTION_UNACQUIRED: {
        defaultMessage: 'Trezor is already in use in another window.',
        id: 'TR_NEEDS_ATTENTION_UNACQUIRED',
    },
    TR_NEEDS_ATTENTION_FIRMWARE_REQUIRED: {
        defaultMessage: 'Firmware update required.',
        id: 'TR_NEEDS_ATTENTION_FIRMWARE_REQUIRED',
    },
    TR_NEEDS_ATTENTION_UNAVAILABLE: {
        defaultMessage: 'Trezor is not available.',
        id: 'TR_NEEDS_ATTENTION_UNAVAILABLE',
    },
    TR_NEEDS_ATTENTION_UNREADABLE: {
        defaultMessage: 'Trezor is not readable.',
        id: 'TR_NEEDS_ATTENTION_UNREADABLE',
    },
    TR_UDEV_DOWNLOAD_TITLE: {
        defaultMessage: 'Download udev rules',
        id: 'TR_UDEV_DOWNLOAD_TITLE',
    },
    TR_UDEV_DOWNLOAD_DESC: {
        defaultMessage:
            'In some cases, Linux users need to install udev rules to access their device. Please install the following package and reconnect your Trezor.',
        id: 'TR_UDEV_DOWNLOAD_DESC',
    },
    TR_UDEV_DOWNLOAD_MANUAL: {
        defaultMessage: 'Manual configuration (advanced)',
        id: 'TR_UDEV_DOWNLOAD_MANUAL',
    },
    TR_DEVICE_SECURITY: {
        defaultMessage: 'Security',
        id: 'TR_DEVICE_SECURITY',
    },
    TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE: {
        defaultMessage: 'Factory reset',
        id: 'TR_DEVICE_SETTINGS_BUTTON_WIPE_DEVICE',
    },
    TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_BUTTON: {
        defaultMessage: 'Install firmware',
        id: 'TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_BUTTON',
    },
    TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_TITLE: {
        defaultMessage: 'Install custom firmware',
        id: 'TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_TITLE',
    },
    TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_DESCRIPTION: {
        defaultMessage:
            "It's possible to install custom firmware on your Trezor device, but doing so will erase its memory and may render it unusable. Only proceed if you are certain of what you're doing.",
        id: 'TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_DESCRIPTION',
    },
    TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL: {
        defaultMessage: 'Edit name',
        id: 'TR_DEVICE_SETTINGS_DEVICE_EDIT_LABEL',
    },
    TR_DEVICE_SETTINGS_DEVICE_LABEL: {
        defaultMessage: 'Device name',
        id: 'TR_DEVICE_SETTINGS_DEVICE_LABEL',
    },
    TR_DEVICE_SETTINGS_DISPLAY_ROTATION: {
        defaultMessage: 'Display rotation',
        id: 'TR_DEVICE_SETTINGS_DISPLAY_ROTATION',
    },
    TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_BW_128x64: {
        defaultMessage:
            'Supports PNG or JPG, 128 x 64 pixels, and using only black and white (not grayscale).',
        id: 'TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_BW_128x64',
    },
    TR_DEVICE_SETTINGS_HOMESCREEN_EDITOR: {
        defaultMessage: 'Homescreen editor',
        id: 'TR_DEVICE_SETTINGS_HOMESCREEN_EDITOR',
    },
    TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_COLOR_240x240: {
        defaultMessage: 'Supports JPG, 240 x 240 px, maximum allowed size is 16 KB.',
        id: 'TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_COLOR_240x240',
    },
    TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY: {
        defaultMessage: 'Choose from gallery',
        id: 'TR_DEVICE_SETTINGS_HOMESCREEN_SELECT_FROM_GALLERY',
    },
    TR_DEVICE_SETTINGS_HOMESCREEN_TITLE: {
        defaultMessage: 'Homescreen',
        id: 'TR_DEVICE_SETTINGS_HOMESCREEN_TITLE',
    },
    TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE: {
        defaultMessage: 'Upload image',
        id: 'TR_DEVICE_SETTINGS_HOMESCREEN_UPLOAD_IMAGE',
    },
    TR_DEVICE_SETTINGS_PASSPHRASE_DESC: {
        defaultMessage:
            "A passphrase adds a custom phrase (like a word, sentence, or string of characters) to your existing wallet backup, creating a Passphrase wallet. Each Passphrase wallet has its own passphrase. Your standard wallet remains accessible without a passphrase.\n\nDon't forget your passphrase. Unlike regular passwords, passphrases can't be recovered. If you lose it, your funds will be permanently lost.",
        id: 'TR_DEVICE_SETTINGS_PASSPHRASE_DESC',
    },
    TR_DEVICE_SETTINGS_SAFETY_CHECKS_TITLE: {
        defaultMessage: 'Safety checks',
        id: 'TR_DEVICE_SETTINGS_SAFETY_CHECKS_TITLE',
    },
    TR_DEVICE_SETTINGS_SAFETY_CHECKS_DESC: {
        defaultMessage:
            'Safety checks protect you from performing non-standard transactions. They can be temporarily disabled in case such a transaction needs to be carried out.',
        id: 'TR_DEVICE_SETTINGS_SAFETY_CHECKS_DESC',
    },
    TR_DEVICE_SETTINGS_SAFETY_CHECKS_BUTTON: {
        defaultMessage: 'Edit',
        id: 'TR_DEVICE_SETTINGS_SAFETY_CHECKS_BUTTON',
    },
    TR_SAFETY_CHECKS_MODAL_TITLE: {
        defaultMessage: 'Safety checks',
        id: 'TR_SAFETY_CHECKS_MODAL_TITLE',
    },
    TR_SAFETY_CHECKS_STRICT_LEVEL: {
        defaultMessage: 'Strict',
        id: 'TR_SAFETY_CHECKS_STRICT_LEVEL',
    },
    TR_SAFETY_CHECKS_STRICT_LEVEL_DESC: {
        defaultMessage: 'Full Trezor security.',
        id: 'TR_SAFETY_CHECKS_STRICT_LEVEL_DESC',
    },
    TR_SAFETY_CHECKS_PROMPT_LEVEL: {
        defaultMessage: 'Prompt',
        id: 'TR_SAFETY_CHECKS_PROMPT_LEVEL',
    },
    TR_SAFETY_CHECKS_PROMPT_LEVEL_WARNING: {
        defaultMessage: "Only change this if you know what you're doing!",
        id: 'TR_SAFETY_CHECKS_PROMPT_LEVEL_WARNING',
    },
    TR_SAFETY_CHECKS_PROMPT_LEVEL_DESC: {
        defaultMessage:
            'Allow potentially unsafe actions, such as mismatching keys or allowing extreme fees, by manually approving them on your Trezor.',
        id: 'TR_SAFETY_CHECKS_PROMPT_LEVEL_DESC',
    },
    TR_SAFETY_CHECKS_DISABLED_WARNING: {
        defaultMessage: 'Safety checks are disabled.',
        id: 'TR_SAFETY_CHECKS_DISABLED_WARNING',
    },
    TR_SAFETY_CHECKS_BANNER_CHANGE: {
        defaultMessage: 'Settings',
        id: 'TR_SAFETY_CHECKS_BANNER_CHANGE',
    },
    TR_DEVICE_SETTINGS_PASSPHRASE_TITLE: {
        defaultMessage: 'Passphrase',
        id: 'TR_DEVICE_SETTINGS_PASSPHRASE_TITLE',
    },
    TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC: {
        defaultMessage:
            'Setting a strong PIN is one of the best ways to secure your device against unauthorized physical access and protect your funds.',
        id: 'TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC',
    },
    TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE: {
        defaultMessage: 'PIN',
        id: 'TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE',
    },
    TR_DEVICE_SETTINGS_CHANGE_PIN_DESC: {
        defaultMessage:
            'If your PIN has been compromised or if you wish to change it for any reason, you can do so here.',
        id: 'TR_DEVICE_SETTINGS_CHANGE_PIN_DESC',
    },
    TR_DEVICE_SETTINGS_CHANGE_PIN_TITLE: {
        defaultMessage: 'Change PIN',
        id: 'TR_DEVICE_SETTINGS_CHANGE_PIN_TITLE',
    },
    TR_DEVICE_SETTINGS_HAPTIC_FEEDBACK_DESC: {
        defaultMessage: 'Turn on haptic feedback for device interactions',
        id: 'TR_DEVICE_SETTINGS_HAPTIC_FEEDBACK_DESC',
    },
    TR_DEVICE_SETTINGS_HAPTIC_FEEDBACK_TITLE: {
        defaultMessage: 'Haptic feedback',
        id: 'TR_DEVICE_SETTINGS_HAPTIC_FEEDBACK_TITLE',
    },
    TR_DEVICE_SETTINGS_BRIGHTNESS_DESC: {
        defaultMessage: 'Enable brightness customization for display on device',
        id: 'TR_DEVICE_SETTINGS_BRIGHTNESS_DESC',
    },
    TR_DEVICE_SETTINGS_BRIGHTNESS_TITLE: {
        defaultMessage: 'Display brightness',
        id: 'TR_DEVICE_SETTINGS_BRIGHTNESS_TITLE',
    },
    TR_DEVICE_SETTINGS_BRIGHTNESS_BUTTON: {
        defaultMessage: 'Change brightness',
        id: 'TR_DEVICE_SETTINGS_BRIGHTNESS_BUTTON',
    },
    TR_DEVICE_SETTINGS_WIPE_CODE_TITLE: {
        defaultMessage: 'Set up wipe code',
        id: 'TR_DEVICE_SETTINGS_WIPE_CODE_TITLE',
    },
    TR_DEVICE_SETTINGS_WIPE_CODE_DESC: {
        defaultMessage:
            'The wipe code is an advanced feature that enables you to create a “self-destruct” code, which can be entered at a later time.',
        id: 'TR_DEVICE_SETTINGS_WIPE_CODE_DESC',
    },
    TR_DEVICE_SETTINGS_AUTO_LOCK: {
        defaultMessage: 'Auto-lock',
        id: 'TR_DEVICE_SETTINGS_AUTO_LOCK',
    },
    TR_DEVICE_SETTINGS_AUTO_LOCK_SUBHEADING: {
        defaultMessage: 'Set the time before your device locks automatically.',
        id: 'TR_DEVICE_SETTINGS_AUTO_LOCK_SUBHEADING',
    },
    TR_DEVICE_SETTINGS_AFTER_DELAY: {
        defaultMessage: 'After delay',
        id: 'TR_DEVICE_SETTINGS_AFTER_DELAY',
    },
    TR_SECURITY_CHECK_HOLOGRAM: {
        defaultMessage:
            "Please note that device packaging, including holograms and security seals, have been updated over time. You can verify packaging details <packaging>here</packaging>. Ensure that your device was purchased from either the official Trezor Shop or from one of <reseller>our trusted sellers</reseller>. Otherwise, there's a risk that your device might be a counterfeit. If you suspect that your device is not genuine, please  <support>contact Trezor Support</support>.",
        id: 'TR_SECURITY_CHECK_HOLOGRAM',
    },
    TR_DISCONNECT_YOUR_DEVICE: {
        defaultMessage: 'Disconnect your Trezor',
        description: 'Prompt to disconnect device.',
        id: 'TR_DISCONNECT_YOUR_DEVICE',
    },
    TR_DISCONNECTED: {
        defaultMessage: 'Disconnected',
        description: 'Device status',
        id: 'TR_DISCONNECTED',
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
    TR_ENTER_PASSPHRASE: {
        defaultMessage: 'Enter passphrase',
        id: 'TR_ENTER_PASSPHRASE',
    },
    TR_ENTER_PASSPHRASE_ON_DEVICE: {
        defaultMessage: 'Enter passphrase on Trezor',
        id: 'TR_ENTER_PASSPHRASE_ON_DEVICE',
    },
    TR_ENTER_PASSPHRASE_ON_DEVICE_LABEL: {
        defaultMessage: 'Enter passphrase on "{deviceLabel}"',
        id: 'TR_ENTER_PASSPHRASE_ON_DEVICE_LABEL',
    },
    TR_ENTER_PIN: {
        defaultMessage: 'Enter PIN',
        description: 'Text for Header and Button when submitting PIN',
        id: 'TR_ENTER_PIN',
    },
    TR_ENTER_WIPECODE: {
        defaultMessage: 'Enter Wipe Code',
        description: 'Text for Header and Button when submitting wipe code',
        id: 'TR_ENTER_WIPECODE',
    },
    TR_ENTER_SEED_WORDS_INSTRUCTION: {
        defaultMessage:
            'Enter the words from your wallet backup here in the order displayed on your Trezor.',
        description:
            'User is instructed to enter words from seed (backup) into the form in browser',
        id: 'TR_ENTER_SEED_WORDS_INSTRUCTION',
    },
    TR_ENTERED_PIN_NOT_CORRECT: {
        defaultMessage: 'Incorrect PIN for "{deviceLabel}"',
        id: 'TR_ENTERED_PIN_NOT_CORRECT',
    },
    TR_EXCHANGE_RATE: {
        defaultMessage: 'Price',
        id: 'TR_EXCHANGE_RATE',
    },
    TR_7D_CHANGE: {
        id: 'TR_7D_CHANGE',
        defaultMessage: '7d change',
    },
    TR_FAILED_BACKUP: {
        defaultMessage: 'Backup failed. Please wipe your Trezor and start the setup process again.',
        id: 'TR_FAILED_BACKUP',
    },
    TR_BACKUP_SUCCESSFUL: {
        defaultMessage: 'Backup successful',
        id: 'TR_BACKUP_SUCCESSFUL',
    },
    TR_FIAT_RATES_NOT_AVAILABLE: {
        defaultMessage: 'Rate not available.',
        id: 'TR_FIAT_RATES_NOT_AVAILABLE',
    },
    TR_FIAT_RATES_NOT_AVAILABLE_TOOLTIP: {
        defaultMessage: 'Exchange rate is currently not available.',
        id: 'TR_FIAT_RATES_NOT_AVAILABLE_TOOLTIP',
    },
    TR_FINAL_HEADING: {
        defaultMessage: 'Setup complete!',
        id: 'TR_FINAL_HEADING',
    },
    TR_ONBOARDING_FINAL_CHANGE_HOMESCREEN: {
        defaultMessage: 'Change Homescreen',
        id: 'TR_ONBOARDING_FINAL_CHANGE_HOMESCREEN',
    },
    TR_FIRMWARE: {
        defaultMessage: 'Firmware',
        id: 'TR_FIRMWARE',
    },
    TR_FIRMWARE_INSTALLED_TEXT: {
        defaultMessage: 'This device has firmware {type}{version} installed.',
        description:
            'Text to display in case device has firmware installed but it is outdated. In case type is defined, space is added in code.',
        id: 'TR_FIRMWARE_INSTALLED_TEXT',
    },
    TR_INSTALL_FIRMWARE: {
        defaultMessage: 'Installing firmware',
        description: 'Heading in onboarding when user is about to install a new firmware',
        id: 'TR_INSTALL_FIRMWARE',
    },
    TR_SWITCH_FIRMWARE: {
        defaultMessage: 'Switch firmware',
        id: 'TR_SWITCH_FIRMWARE',
    },
    TR_SWITCH_FIRMWARE_TO: {
        defaultMessage: 'Switch firmware to {firmwareType}',
        id: 'TR_SWITCH_FIRMWARE_TO',
    },
    TR_INSTALL_BITCOIN_ONLY_FW: {
        defaultMessage: 'Install {bitcoinOnly} firmware',
        description: 'Heading in onboarding when user is about to install Bitcoin-only firmware',
        id: 'TR_INSTALL_BITCOIN_ONLY_FW',
    },
    TR_INSTALL_FW_DISABLED_MULTIPLE_DEVICES: {
        defaultMessage: 'Installing firmware with multiple devices connected is not allowed.',
        id: 'TR_INSTALL_FW_DISABLED_MULTIPLE_DEVICES',
    },
    TR_FIRMWARE_SUBHEADING_NONE: {
        defaultMessage:
            'Your Trezor is shipped without firmware. Install the latest firmware in order to use your device safely. For Bitcoin-only users, we recommend installing <button>{bitcoinOnly} firmware</button>.',
        description: 'Main text on firmware page for devices without firmware',
        id: 'TR_FIRMWARE_SUBHEADING_NONE',
    },
    TR_FIRMWARE_SUBHEADING_NONE_BITCOIN_ONLY_DEVICE: {
        defaultMessage:
            'Your device is ready for the latest firmware in order to be used safely. For Bitcoin enthusiasts, a Bitcoin-only firmware is available.',
        description: 'Main text on firmware page for Bitcoin-only devices without firmware',
        id: 'TR_FIRMWARE_SUBHEADING_NONE_BITCOIN_ONLY_DEVICE',
    },
    TR_FIRMWARE_SUBHEADING_UNKNOWN: {
        defaultMessage:
            'Your Trezor is shipped without firmware. Install the latest firmware in order to use your device safely. For Bitcoin-only users, we recommend installing <button>{bitcoinOnly} firmware</button>.',
        description:
            'Main text on firmware page for devices in bootloader mode, i.e. when Suite cannot determine current firmware type',
        id: 'TR_FIRMWARE_SUBHEADING_UNKNOWN',
    },
    TR_FIRMWARE_SUBHEADING_BITCOIN: {
        defaultMessage: 'Lightweight firmware supporting only Bitcoin operations.',
        description: 'Explanation of Bitcoin-only firmware in onboarding',
        id: 'TR_FIRMWARE_SUBHEADING_BITCOIN',
    },
    TR_FIRMWARE_SUBHEADING_UNKNOWN_BITCOIN_ONLY_DEVICE: {
        defaultMessage: 'A lightweight firmware supporting Bitcoin-only operations.',
        description: 'Explanation of Bitcoin-only firmware in onboarding for Bitcoin-only devices',
        id: 'TR_FIRMWARE_SUBHEADING_UNKNOWN_BITCOIN_ONLY_DEVICE',
    },
    TR_CHANGE_FIRMWARE_TYPE_ANYTIME: {
        defaultMessage: 'You can change your firmware type in Settings anytime.',
        description: 'Info in onboarding',
        id: 'TR_CHANGE_FIRMWARE_TYPE_ANYTIME',
    },
    TR_FIRMWARE_VERSION: {
        defaultMessage: 'Version',
        id: 'TR_FIRMWARE_VERSION',
    },
    TR_FIRMWARE_TYPE: {
        defaultMessage: 'Type',
        id: 'TR_FIRMWARE_TYPE',
    },
    TR_FIRMWARE_VALIDATION_UNRECOGNIZED_FORMAT: {
        defaultMessage: 'Unrecognized firmware image type',
        id: 'TR_FIRMWARE_VALIDATION_UNRECOGNIZED_FORMAT',
    },
    TR_FIRMWARE_VALIDATION_UNMATCHING_DEVICE: {
        defaultMessage: 'Firmware does not match your device',
        id: 'TR_FIRMWARE_VALIDATION_UNMATCHING_DEVICE',
    },
    TR_FIRMWARE_VALIDATION_TOO_OLD: {
        defaultMessage: 'Firmware is too old for your device',
        id: 'TR_FIRMWARE_VALIDATION_TOO_OLD',
    },
    TR_FIRMWARE_VALIDATION_T1_V2: {
        defaultMessage: 'You need to upgrade to bootloader 1.8.0 first',
        id: 'TR_FIRMWARE_VALIDATION_T1_V2',
    },
    TR_FIRST_SEEN: {
        defaultMessage: 'First seen',
        id: 'TR_FIRST_SEEN',
    },
    TR_FOR_EASIER_AND_SAFER_INPUT: {
        defaultMessage: 'Please hold the QR code in front of your computer webcam.',
        id: 'TR_FOR_EASIER_AND_SAFER_INPUT',
    },
    TR_GATHERING_INFO: {
        defaultMessage: 'Gathering information, please wait...',
        id: 'TR_GATHERING_INFO',
    },
    TR_GENERAL: {
        defaultMessage: 'Application',
        description: 'Category in Settings',
        id: 'TR_GENERAL',
    },
    TR_CONTINUE_TO_BACKUP: {
        defaultMessage: 'Continue to backup',
        id: 'TR_CONTINUE_TO_BACKUP',
    },
    TR_CONTINUE_TO_PIN: {
        defaultMessage: 'Create PIN',
        description:
            'Button in standalone backup page that will direct user to setting up pin (in case it is not set up yet).',
        id: 'TR_CONTINUE_TO_PIN',
    },
    TR_SKIP_PIN: {
        defaultMessage: 'Skip PIN',
        id: 'TR_SKIP_PIN',
    },
    TR_SKIP_PIN_DESCRIPTION: {
        defaultMessage:
            'A device PIN prevents unauthorized access to your Trezor. Without it, anyone with your device can access your funds.',
        id: 'TR_SKIP_PIN_DESCRIPTION',
    },
    TR_SKIP_BACKUP: {
        defaultMessage: 'Skip Backup',
        id: 'TR_SKIP_BACKUP',
    },
    TR_SKIP_BACKUP_DESCRIPTION: {
        defaultMessage:
            'A wallet backup lets you recover your funds if your Trezor is lost, stolen, or damaged. Without a backup, you could lose access to your crypto permanently.',
        id: 'TR_SKIP_BACKUP_DESCRIPTION',
    },
    TR_DONT_SKIP: {
        defaultMessage: "Don't skip",
        id: 'TR_DONT_SKIP',
    },
    TR_ONBOARDING_DATA_COLLECTION_HEADING: {
        id: 'TR_ONBOARDING_DATA_COLLECTION_HEADING',
        defaultMessage: 'Anonymous data collection',
    },
    TR_ONBOARDING_DATA_COLLECTION_DESCRIPTION: {
        id: 'TR_ONBOARDING_DATA_COLLECTION_DESCRIPTION',
        defaultMessage:
            'All data collected is anonymous and is used to improve product performance and development. More in <analytics>technical documentation</analytics> and <tos>Terms & Conditions</tos>.',
    },
    TR_HOLOGRAM_STEP_HEADING: {
        defaultMessage: 'Verify your seal',
        description: 'Heading on hologram step page',
        id: 'TR_HOLOGRAM_STEP_HEADING',
    },
    TR_HOLOGRAM_STEP_SUBHEADING: {
        defaultMessage: 'Make sure the holographic seal protecting your device was intact.',
        description: 'Subheading on hologram step page',
        id: 'TR_HOLOGRAM_STEP_SUBHEADING',
    },
    TR_HOLOGRAM_T2B1_NEW_SEAL: {
        defaultMessage:
            'The holographic seal of Trezor Safe 3 was updated in April 2024. Devices manufactured after this date feature the updated seal, as depicted at the bottom of the image. However, older-produced devices may still carry the original security seal.',
        id: 'TR_HOLOGRAM_T2B1_NEW_SEAL',
    },
    TR_HOW_PIN_WORKS: {
        defaultMessage: 'More about your PIN',
        id: 'TR_HOW_PIN_WORKS',
    },
    TR_I_UNDERSTAND_PASSPHRASE: {
        defaultMessage: "I understand that passphrases can't be retrieved.",
        id: 'TR_I_UNDERSTAND_PASSPHRASE',
    },
    TR_IF_YOUR_DEVICE_IS_EVER_LOST: {
        defaultMessage: 'If your Trezor is lost or damaged, your funds may be irreversibly lost.',
        id: 'TR_IF_YOUR_DEVICE_IS_EVER_LOST',
    },
    TR_INCOMING: {
        defaultMessage: 'Incoming',
        id: 'TR_INCOMING',
    },
    TR_INSTALL: {
        defaultMessage: 'Install firmware',
        description: 'Install button',
        id: 'TR_INSTALL',
    },
    TR_INSTALL_REGULAR: {
        defaultMessage: 'Install {regular} firmware',
        description: 'Install button for Regular firmware',
        id: 'TR_INSTALL_REGULAR',
    },
    TR_INSTALL_BITCOIN_ONLY: {
        defaultMessage: 'Install {bitcoinOnly}',
        description: 'Install button for Bitcoin-only firmware',
        id: 'TR_INSTALL_BITCOIN_ONLY',
    },
    TR_FIRMWARE_TYPE_REGULAR: {
        defaultMessage: 'Universal',
        description: 'UI name of regular firmware type.',
        id: 'TR_FIRMWARE_TYPE_REGULAR',
    },
    TR_FIRMWARE_TYPE_BITCOIN_ONLY: {
        defaultMessage: 'Bitcoin-only',
        description: 'UI name of Bitcoin-only firmware type.',
        id: 'TR_FIRMWARE_TYPE_BITCOIN_ONLY',
    },
    TR_LABELING: {
        defaultMessage: 'Labeling',
        id: 'TR_LABELING',
    },
    TR_LANGUAGE: {
        defaultMessage: 'Language',
        id: 'TR_LANGUAGE',
    },
    TR_LANGUAGE_DESCRIPTION: {
        defaultMessage:
            'A big thanks to the Trezor community for helping out with this translation. You can always refer to one of the official languages if needed.',
        id: 'TR_LANGUAGE_DESCRIPTION',
    },
    TR_LANGUAGE_CREDITS: {
        defaultMessage: 'See credits',
        id: 'TR_LANGUAGE_CREDITS',
    },
    TR_OFFICIAL_LANGUAGES: {
        defaultMessage: 'Official',
        id: 'TR_OFFICIAL_LANGUAGES',
    },
    TR_COMMUNITY_LANGUAGES: {
        defaultMessage: 'Community',
        id: 'TR_COMMUNITY_LANGUAGES',
    },
    TR_TOKEN_UNRECOGNIZED_BY_TREZOR: {
        defaultMessage: 'Unrecognized tokens',
        id: 'TR_TOKEN_UNRECOGNIZED_BY_TREZOR',
    },
    TR_TOKEN_UNRECOGNIZED_BY_TREZOR_TOOLTIP: {
        defaultMessage: 'Unrecognized tokens pose potential risks. Use caution.',
        id: 'TR_TOKEN_UNRECOGNIZED_BY_TREZOR_TOOLTIP',
    },
    TR_LEARN: {
        defaultMessage: 'Learn',
        description: 'Link to Suite Guide.',
        id: 'TR_LEARN',
    },
    TR_LEARN_MORE: {
        defaultMessage: 'Learn more',
        description: 'Link to Trezor wiki.',
        id: 'TR_LEARN_MORE',
    },
    TR_NORMAL_ACCOUNTS: {
        defaultMessage: 'Default accounts',
        id: 'TR_NORMAL_ACCOUNTS',
    },
    TR_COINJOIN_ACCOUNTS: {
        defaultMessage: 'Coinjoin accounts',
        id: 'TR_COINJOIN_ACCOUNTS',
    },
    TR_TAPROOT_ACCOUNTS: {
        defaultMessage: 'Taproot accounts',
        id: 'TR_TAPROOT_ACCOUNTS',
    },
    TR_LEGACY_SEGWIT_ACCOUNTS: {
        defaultMessage: 'Legacy SegWit accounts',
        id: 'TR_LEGACY_SEGWIT_ACCOUNTS',
    },
    TR_LEGACY_ACCOUNTS: {
        defaultMessage: 'Legacy accounts',
        id: 'TR_LEGACY_ACCOUNTS',
    },
    TR_CARDANO_LEDGER_ACCOUNTS: {
        defaultMessage: 'Ledger accounts',
        id: 'TR_CARDANO_LEDGER_ACCOUNTS',
    },
    TR_ACCOUNT_TYPE_LEGACY: {
        defaultMessage: 'Legacy',
        id: 'TR_ACCOUNT_TYPE_LEGACY',
        dynamic: true,
    },
    TR_ACCOUNT_TYPE_TAPROOT: {
        defaultMessage: 'Taproot',
        id: 'TR_ACCOUNT_TYPE_TAPROOT',
        dynamic: true,
    },
    TR_ACCOUNT_TYPE_COINJOIN: {
        defaultMessage: 'Coinjoin',
        id: 'TR_ACCOUNT_TYPE_COINJOIN',
        dynamic: true,
    },
    TR_ACCOUNT_TYPE_LEDGER: {
        defaultMessage: 'Ledger',
        id: 'TR_ACCOUNT_TYPE_LEDGER',
        dynamic: true,
    },
    TR_ACCOUNT_TYPE_IMPORTED: {
        defaultMessage: 'Imported',
        id: 'TR_ACCOUNT_TYPE_IMPORTED',
        dynamic: true,
    },
    TR_ACCOUNT_TYPE_DEFAULT: {
        defaultMessage: 'Default',
        id: 'TR_ACCOUNT_TYPE_DEFAULT',
        dynamic: true,
    },
    TR_ACCOUNT_TYPE_SEGWIT: {
        defaultMessage: 'Legacy SegWit',
        id: 'TR_ACCOUNT_TYPE_SEGWIT',
        dynamic: true,
    },
    TR_LOG: {
        defaultMessage: 'Application log',
        description: 'application event and error',
        id: 'TR_LOG',
    },
    TR_SHOW_LOG: {
        id: 'TR_SHOW_LOG',
        defaultMessage: 'Show log',
    },
    TR_LOG_DESCRIPTION: {
        id: 'TR_LOG_DESCRIPTION',
        defaultMessage:
            'This log contains essential technical information about Trezor Suite and may be needed when contacting Trezor Support.',
    },
    TR_LTC_ADDRESS_INFO: {
        defaultMessage:
            'Litecoin changed the address format. Find more info about how to convert your address on our blog. {TR_LEARN_MORE}',
        id: 'TR_LTC_ADDRESS_INFO',
    },
    TR_MAXIMUM_PIN_LENGTH: {
        defaultMessage: 'Enter up to 50 digits.',
        id: 'TR_MAXIMUM_PIN_LENGTH',
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
    TR_NAV_SOON_BADGE: {
        defaultMessage: 'Soon',
        id: 'TR_NAV_SOON_BADGE',
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
        defaultMessage: 'Details',
        id: 'TR_NAV_DETAILS',
    },
    TR_NAV_TOKENS: {
        defaultMessage: 'Tokens',
        id: 'TR_NAV_TOKENS',
    },
    TR_NAV_SIGN_AND_VERIFY: {
        defaultMessage: 'Sign & Verify',
        description:
            'Title of the navigation tab that contains a form for signing and verifying messages',
        id: 'TR_NAV_SIGN_AND_VERIFY',
    },
    TR_NAV_TRANSACTIONS: {
        defaultMessage: 'Overview',
        description: 'Title of the navigation tab that contains tx history.',
        id: 'TR_NAV_TRANSACTIONS',
    },
    TR_NAV_ANONYMIZE: {
        defaultMessage: 'Make coins private',
        description: 'Title of the coinjoin setup page.',
        id: 'TR_NAV_ANONYMIZE',
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
    TR_NETWORK_BITCOIN_REGTEST: {
        defaultMessage: 'Bitcoin Regtest',
        id: 'TR_NETWORK_BITCOIN_REGTEST',
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
        defaultMessage: 'DigiByte',
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
    TR_INCLUDING_TOKENS: {
        defaultMessage: 'Including tokens',
        id: 'TR_INCLUDING_TOKENS',
    },
    TR_INCLUDING_TOKENS_AND_STAKING: {
        defaultMessage: 'Incl. tokens & staking',
        id: 'TR_INCLUDING_TOKENS_AND_STAKING',
    },
    TR_NETWORK_ETHEREUM_CLASSIC: {
        defaultMessage: 'Ethereum Classic',
        id: 'TR_NETWORK_ETHEREUM_CLASSIC',
    },
    TR_NETWORK_ETHEREUM_SEPOLIA: {
        defaultMessage: 'Ethereum Sepolia',
        id: 'TR_NETWORK_ETHEREUM_SEPOLIA',
    },
    TR_NETWORK_ETHEREUM_HOLESKY: {
        defaultMessage: 'Ethereum Holesky',
        id: 'TR_NETWORK_ETHEREUM_HOLESKY',
    },
    TR_NETWORK_BNB: {
        defaultMessage: 'BNB Smart Chain',
        id: 'TR_NETWORK_BNB',
    },
    TR_NETWORK_OP: {
        defaultMessage: 'Optimism',
        id: 'TR_NETWORK_OP',
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
    TR_NETWORK_POLYGON: {
        defaultMessage: 'Polygon PoS',
        id: 'TR_NETWORK_POLYGON',
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
    TR_NETWORK_COINJOIN_BITCOIN: {
        defaultMessage: 'Coinjoin',
        id: 'TR_NETWORK_COINJOIN_BITCOIN',
    },
    TR_NETWORK_COINJOIN_BITCOIN_TESTNET: {
        defaultMessage: 'Coinjoin Testnet',
        id: 'TR_NETWORK_COINJOIN_BITCOIN_TESTNET',
    },
    TR_NETWORK_COINJOIN_BITCOIN_REGTEST: {
        defaultMessage: 'Coinjoin Regtest',
        id: 'TR_NETWORK_COINJOIN_BITCOIN_REGTEST',
    },
    TR_NETWORK_SOLANA_MAINNET: {
        defaultMessage: 'Solana',
        id: 'TR_NETWORK_SOLANA_MAINNET',
    },
    TR_NETWORK_SOLANA_DEVNET: {
        defaultMessage: 'Solana Devnet',
        id: 'TR_NETWORK_SOLANA_DEVNET',
    },
    TR_SOLANA_DEVNET_SHORTCUT_WARNING: {
        defaultMessage:
            'DSOL will display SOL on your Trezor due to network limitations. Check the provided blockhash on Devnet explorer if you want to verify the transaction network.',
        id: 'TR_SOLANA_DEVNET_SHORTCUT_WARNING',
    },
    TR_NEW_TREZOR_BRIDGE_IS_AVAILABLE: {
        defaultMessage: 'New Trezor Bridge is available.',
        id: 'TR_NEW_TREZOR_BRIDGE_IS_AVAILABLE',
    },
    TR_NO_PASSPHRASE_WALLET: {
        defaultMessage: 'Standard wallet',
        id: 'TR_NO_PASSPHRASE_WALLET',
    },
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
    TR_COUNT_WALLETS: {
        defaultMessage: '{count} {count, plural, one {wallet} other {wallets}}',
        id: 'TR_COUNT_WALLETS',
    },
    TR_ACCOUNT_IS_EMPTY_DESCRIPTION: {
        defaultMessage: 'Get started by receiving or buying {network}.',
        id: 'TR_ACCOUNT_IS_EMPTY_DESCRIPTION',
    },
    TR_GENERIC_ERROR_TITLE: {
        defaultMessage: 'Oops! Something went wrong!',
        description: 'Generic error message title',
        id: 'TR_GENERIC_ERROR_TITLE',
    },
    TR_FW_INSTALLATION_FAILED: {
        defaultMessage: 'Installation failed',
        id: 'TR_FW_INSTALLATION_FAILED',
    },
    TR_OUTGOING: {
        defaultMessage: 'Outgoing',
        id: 'TR_OUTGOING',
    },
    TR_PASSPHRASE_CASE_SENSITIVE: {
        defaultMessage: 'Note: Passphrase is case-sensitive.',
        id: 'TR_PASSPHRASE_CASE_SENSITIVE',
    },
    TR_PASSPHRASE_HIDDEN_WALLET: {
        defaultMessage: 'Passphrase wallet',
        id: 'TR_PASSPHRASE_HIDDEN_WALLET',
    },
    TR_PASSPHRASE_TOO_LONG: {
        defaultMessage: 'Passphrase length exceeds the allowed limit.',
        id: 'TR_PASSPHRASE_TOO_LONG',
    },
    TR_PASSPHRASE_WALLET: {
        defaultMessage: 'Passphrase wallet #{id}',
        id: 'TR_PASSPHRASE_WALLET',
    },
    TR_PASSPHRASE_MISMATCH: {
        defaultMessage: 'Passphrase mismatch',
        id: 'TR_PASSPHRASE_MISMATCH',
    },
    TR_PASSPHRASE_MISMATCH_DESCRIPTION: {
        defaultMessage:
            "The passphrases didn't match. For security, start over and enter them correctly.",
        id: 'TR_PASSPHRASE_MISMATCH_DESCRIPTION',
    },
    TR_PASSPHRASE_MISMATCH_START_OVER: {
        defaultMessage: 'Start over',
        id: 'TR_PASSPHRASE_MISMATCH_START_OVER',
    },
    TR_PENDING_TX_HEADING: {
        defaultMessage: 'Pending {count, plural, one {transaction} other {transactions}}',
        description: 'Heading for the list of pending transactions',
        id: 'TR_PENDING_TX_HEADING',
    },
    TR_PIN_HEADING_FIRST: {
        defaultMessage: 'Set new PIN',
        description: 'Heading in PIN page when entering PIN for the first time',
        id: 'TR_PIN_HEADING_FIRST',
    },
    TR_PIN_HEADING_REPEAT: {
        defaultMessage: 'Repeat PIN',
        description: 'Heading in PIN page when repeating PIN',
        id: 'TR_PIN_HEADING_REPEAT',
    },
    TR_PIN_HEADING_SUCCESS: {
        defaultMessage: 'PIN set',
        description: 'Heading in PIN page when PIN set',
        id: 'TR_PIN_HEADING_SUCCESS',
    },
    TR_PIN_SET_SUCCESS: {
        defaultMessage:
            'Write your PIN down and keep it safe. Use it to unlock your Trezor when you need to access your funds.',
        description: 'Longer text indicating PIN was set successfully.',
        id: 'TR_PIN_SET_SUCCESS',
    },
    TR_PIN_SUBHEADING: {
        defaultMessage:
            'Using a strong PIN protects your Trezor from unauthorized physical access.',
        description: 'Subheading on PIN page',
        id: 'TR_PIN_SUBHEADING',
    },
    TR_PLEASE_ALLOW_YOUR_CAMERA: {
        defaultMessage: 'Please enable your camera to scan QR codes.',
        id: 'TR_PLEASE_ALLOW_YOUR_CAMERA',
    },
    TR_PLEASE_CONNECT_YOUR_DEVICE: {
        defaultMessage: 'Please connect your device to continue with the verification process.',
        id: 'TR_PLEASE_CONNECT_YOUR_DEVICE',
    },
    TR_PLEASE_ENABLE_PASSPHRASE: {
        defaultMessage:
            'Please enable the passphrase feature to continue with the verification process.',
        id: 'TR_PLEASE_ENABLE_PASSPHRASE',
    },
    TR_PRIMARY_FIAT: {
        defaultMessage: 'Fiat currency',
        id: 'TR_PRIMARY_FIAT',
    },
    TR_RANDOM_SEED_WORDS_DISCLAIMER: {
        defaultMessage:
            "You may be asked to type some words that aren't part of your wallet backup",
        description:
            'User is instructed to enter words from seed (backup) into the form in browser',
        id: 'TR_RANDOM_SEED_WORDS_DISCLAIMER',
    },
    TR_RECEIVE: {
        defaultMessage: 'Receive',
        id: 'TR_RECEIVE',
    },
    TR_RECEIVE_NETWORK: {
        defaultMessage: 'Receive {network}',
        id: 'TR_RECEIVE_NETWORK',
    },
    TR_BUY_NETWORK: {
        defaultMessage: 'Buy {network}',
        id: 'TR_BUY_NETWORK',
    },
    TR_TAPROOT_BANNER_TITLE: {
        defaultMessage: 'Taproot accounts',
        id: 'TR_TAPROOT_BANNER_TITLE',
    },
    TR_TAPROOT_BANNER_POINT_1: {
        defaultMessage: 'Lowercase letters only: lower chance of any reviewing errors',
        id: 'TR_TAPROOT_BANNER_POINT_1',
    },
    TR_TAPROOT_BANNER_POINT_2: {
        defaultMessage: 'Improved privacy for all bitcoin transactions',
        id: 'TR_TAPROOT_BANNER_POINT_2',
    },
    TR_GOT_IT: {
        defaultMessage: 'Got it!',
        id: 'TR_GOT_IT',
    },
    TR_RECONNECT_HEADER: {
        defaultMessage: 'Reconnect your Trezor',
        id: 'TR_RECONNECT_HEADER',
    },
    TR_RECOVER_SUBHEADING_COMPUTER: {
        defaultMessage:
            'If you want to recover an existing wallet, you can do so with your wallet backup. Select the number of words in your wallet backup.',
        description: 'Subheading in recover page. Basic info about recovery',
        id: 'TR_RECOVER_SUBHEADING_COMPUTER',
    },
    TR_RECOVER_SUBHEADING_TOUCH: {
        defaultMessage: "The entire recovery process is done on the device's touchscreen.",
        description: 'Subheading in recover page. Basic info about recovery',
        id: 'TR_RECOVER_SUBHEADING_TOUCH',
    },
    TR_RECOVER_SUBHEADING_BUTTONS: {
        defaultMessage:
            "The entire recovery process is done on the device's screen using the buttons.",
        description: 'Subheading in recover page. Basic info about recovery',
        id: 'TR_RECOVER_SUBHEADING_BUTTONS',
    },
    TR_RECOVERY_ERROR: {
        defaultMessage: 'Device recovery failed: {error}',
        description: 'Error during recovery. For example wrong word retyped or device disconnected',
        id: 'TR_RECOVERY_ERROR',
    },
    TR_CHECK_RECOVERY_SEED_DESCRIPTION: {
        defaultMessage: 'Perform a simulated recovery to verify your wallet backup.',
        id: 'TR_CHECK_RECOVERY_SEED_DESCRIPTION',
    },
    TR_RECOVERY_TYPES_DESCRIPTION: {
        defaultMessage:
            "Both methods are secure; advanced recovery allows you to input your wallet backup using your Trezor's screen and takes longer.",
        description:
            'There are two methods of recovery for T1B1. This is a short explanation text.',
        id: 'TR_RECOVERY_TYPES_DESCRIPTION',
    },
    TR_RETRY: {
        defaultMessage: 'Retry',
        description: 'Retry button',
        id: 'TR_RETRY',
    },
    TR_RETRYING_DOT_DOT: {
        defaultMessage: 'Retrying..',
        id: 'TR_RETRYING_DOT_DOT',
    },
    TR_QR_CODE: {
        defaultMessage: 'QR code',
        id: 'TR_QR_CODE',
    },
    TR_SCAN_QR_CODE: {
        defaultMessage: 'Scan QR code',
        description: 'Title for the Scan QR modal dialog',
        id: 'TR_SCAN_QR_CODE',
    },
    TR_YOUR_WALLET_SUCCESSFULLY_CREATED: {
        defaultMessage: 'Wallet successfully created',
        id: 'TR_YOUR_WALLET_SUCCESSFULLY_CREATED',
    },
    TR_YOUR_WALLET_IS_ALMOST_READY_DESCRIPTION: {
        defaultMessage:
            "Great job! Now let's create a wallet backup. Your wallet backup is the only way to recover access to your wallet.",
        id: 'TR_YOUR_WALLET_IS_ALMOST_READY_DESCRIPTION',
    },
    TR_SELECT_DEVICE: {
        defaultMessage: 'Select device',
        id: 'TR_SELECT_DEVICE',
    },
    TR_SELECT_PASSPHRASE_SOURCE: {
        defaultMessage: 'Select where to enter passphrase on "{deviceLabel}" .',
        id: 'TR_SELECT_PASSPHRASE_SOURCE',
    },
    TR_SENT_TO_SELF: {
        defaultMessage: 'Sent to myself',
        id: 'TR_SENT_TO_SELF',
    },
    TR_SET_PIN: {
        defaultMessage: 'Set PIN',
        description: 'Button text',
        id: 'TR_SET_PIN',
    },
    TR_WRONG_PIN_ENTERED: {
        defaultMessage: 'Entered wrong PIN',
        id: 'TR_WRONG_PIN_ENTERED',
    },
    TR_PASSWORD_MANAGER: {
        defaultMessage: 'Migrate Dropbox passwords',
        id: 'TR_PASSWORD_MANAGER',
    },
    TR_SETTINGS: {
        defaultMessage: 'Settings',
        id: 'TR_SETTINGS',
    },
    TR_SETTINGS_SAME_AS_SYSTEM: {
        defaultMessage: 'System',
        id: 'TR_SETTINGS_SAME_AS_SYSTEM',
    },
    TR_SETTINGS_DEVICE_BANNER_TITLE_DISCONNECTED: {
        defaultMessage: 'Connect device to access Device Settings',
        id: 'TR_SETTINGS_DEVICE_BANNER_TITLE_DISCONNECTED',
    },
    TR_SETTINGS_DEVICE_BANNER_TITLE_UNAVAILABLE: {
        defaultMessage: 'Device detected in incorrect state',
        id: 'TR_SETTINGS_DEVICE_BANNER_TITLE_UNAVAILABLE',
    },
    TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_UNAVAILABLE: {
        defaultMessage: "You can't change Device settings in this state",
        id: 'TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_UNAVAILABLE',
    },
    TR_SETTINGS_COINS_BANNER_DESCRIPTION_REMEMBERED_DISCONNECTED: {
        defaultMessage: 'Connect your Trezor to change settings',
        id: 'TR_SETTINGS_COINS_BANNER_DESCRIPTION_REMEMBERED_DISCONNECTED',
    },
    TR_SETTINGS_DEVICE_BANNER_TITLE_BOOTLOADER: {
        defaultMessage: 'Other settings unavailable in bootloader mode',
        id: 'TR_SETTINGS_DEVICE_BANNER_TITLE_BOOTLOADER',
    },
    TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED: {
        defaultMessage: 'Connect your Trezor to change settings',
        id: 'TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED',
    },
    TR_SETTINGS_COINS_REGULAR_FIRMWARE_SUGGESTION: {
        defaultMessage: 'To access more coins, install <button>{regular}</button> firmware.',
        id: 'TR_SETTINGS_COINS_REGULAR_FIRMWARE_SUGGESTION',
    },
    TR_SETTINGS_COINS_BITCOIN_ONLY_FIRMWARE_SUGGESTION: {
        defaultMessage:
            'For Bitcoin-only wallet operations, install <button>{bitcoinOnly}</button> firmware.',
        id: 'TR_SETTINGS_COINS_BITCOIN_ONLY_FIRMWARE_SUGGESTION',
    },
    TR_CONTINUE_ANYWAY: {
        defaultMessage: 'Continue anyway',
        id: 'TR_CONTINUE_ANYWAY',
    },
    TR_SHOW_DETAILS: {
        defaultMessage: 'Update now',
        id: 'TR_SHOW_DETAILS',
    },
    TR_SHOW_DETAILS_IN_BLOCK_EXPLORER: {
        defaultMessage: 'Show details in Block Explorer',
        id: 'TR_SHOW_DETAILS_IN_BLOCK_EXPLORER',
    },
    TR_SHOW_UNVERIFIED_ADDRESS: {
        defaultMessage: 'Show unverified address',
        id: 'TR_SHOW_UNVERIFIED_ADDRESS',
        dynamic: true,
    },
    TR_SHOW_UNVERIFIED_XPUB: {
        defaultMessage: 'Show unverified public key',
        id: 'TR_SHOW_UNVERIFIED_XPUB',
    },
    TR_PROCEED_UNVERIFIED_ADDRESS: {
        defaultMessage: 'Proceed with unverified address',
        id: 'TR_PROCEED_UNVERIFIED_ADDRESS',
    },
    TR_SIGN: {
        defaultMessage: 'Sign',
        description: 'Sign button in Sign and Verify form',
        id: 'TR_SIGN',
    },
    TR_SIGNED: {
        defaultMessage: 'Signed',
        id: 'TR_SIGNED',
    },
    TR_SIGN_MESSAGE: {
        defaultMessage: 'Sign message',
        description: 'Header for the Sign and Verify form',
        id: 'TR_SIGN_MESSAGE',
    },
    TR_SIGNATURE: {
        defaultMessage: 'Signature',
        description: 'Used as a label for signature input field in Sign and Verify form',
        id: 'TR_SIGNATURE',
    },
    TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER: {
        defaultMessage: 'Will be generated after signing',
        id: 'TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER',
    },
    TR_SKIP: {
        defaultMessage: 'Skip',
        description: 'Button. Skip one step',
        id: 'TR_SKIP',
    },
    TR_SKIP_UPDATE: {
        defaultMessage: 'Skip Update',
        id: 'TR_SKIP_UPDATE',
    },
    TR_SOLVE_ISSUE: {
        defaultMessage: 'Refresh',
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
        defaultMessage: 'Create wallet backup',
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
    TR_SUITE_VERSION: {
        defaultMessage: 'Trezor Suite version',
        id: 'TR_SUITE_VERSION',
    },
    TR_SWITCH_DEVICE: {
        defaultMessage: 'Switch Device',
        id: 'TR_SWITCH_DEVICE',
    },
    TR_TAKE_ME_BACK_TO_WALLET: {
        defaultMessage: 'Take me back to Suite',
        id: 'TR_TAKE_ME_BACK_TO_WALLET',
    },
    TR_TESTNET_COINS: {
        defaultMessage: 'Testnet coins',
        id: 'TR_TESTNET_COINS',
    },
    TR_TESTNET_COINS_DESCRIPTION: {
        defaultMessage: 'These coins are used only for testing and hold no value.',
        id: 'TR_TESTNET_COINS_DESCRIPTION',
    },
    TR_TESTNET_COINS_LABEL: {
        defaultMessage: 'TEST COIN',
        id: 'TR_TESTNET_COINS_LABEL',
    },
    TR_UNSUPPORTED_COINS: {
        defaultMessage: 'Supported on newer Trezors',
        id: 'TR_UNSUPPORTED_COINS',
    },
    TR_UNSUPPORTED_COINS_DESCRIPTION: {
        defaultMessage: 'These coins are supported on Trezor Safe devices and Trezor Model T.',
        id: 'TR_UNSUPPORTED_COINS_DESCRIPTION',
    },
    TR_THE_PIN_LAYOUT_IS_DISPLAYED: {
        defaultMessage: 'Check <b>{deviceLabel}</b> screen for the keypad layout.',
        id: 'TR_THE_PIN_LAYOUT_IS_DISPLAYED',
    },
    TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE: {
        defaultMessage:
            'This Passphrase wallet is empty. To make sure you are in the correct wallet, enter the passphrase on your Trezor.',
        id: 'TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE',
    },
    TR_ADDRESS_PHISHING_WARNING: {
        defaultMessage:
            'To prevent phishing attacks, you should verify the address on your Trezor. {claim}',
        id: 'TR_ADDRESS_PHISHING_WARNING',
    },
    TR_XPUB_PHISHING_WARNING: {
        defaultMessage:
            'To prevent phishing attacks, you should verify the public key on your Trezor. {claim}',
        id: 'TR_XPUB_PHISHING_WARNING',
    },
    TR_TOO_LONG: {
        id: 'TR_TOO_LONG',
        defaultMessage: 'Message is too long',
    },
    TR_ASCII_ONLY: {
        id: 'TR_ASCII_ONLY',
        defaultMessage: 'Only ASCII characters are allowed',
    },
    TR_TOTAL: {
        defaultMessage: 'Total',
        id: 'TR_TOTAL',
    },
    TR_TRANSACTION_DETAILS: {
        defaultMessage: 'Details',
        id: 'TR_TRANSACTION_DETAILS',
    },
    TR_NO_TRANSPORT: {
        defaultMessage: "Your browser can't communicate with your device",
        description: '',
        id: 'TR_NO_TRANSPORT',
    },
    TR_NO_TRANSPORT_DESKTOP: {
        defaultMessage: "App can't communicate with device",
        description: 'similar to TR_NO_TRANSPORT but for desktop',
        id: 'TR_NO_TRANSPORT_DESKTOP',
    },
    TR_TRY_AGAIN: {
        defaultMessage: 'Try again',
        description: 'Try to run the process again',
        id: 'TR_TRY_AGAIN',
    },
    TR_TX_CONFIRMATIONS: {
        defaultMessage: '{confirmationsCount}x',
        id: 'TR_TX_CONFIRMATIONS',
    },
    TR_TX_FEE: {
        defaultMessage: 'Fee',
        id: 'TR_TX_FEE',
    },
    TR_UNCONFIRMED_TX: {
        defaultMessage: 'Unconfirmed',
        id: 'TR_UNCONFIRMED_TX',
    },
    TR_UNDISCOVERED_WALLET: {
        defaultMessage: 'Click to discover wallet',
        id: 'TR_UNDISCOVERED_WALLET',
    },
    TR_UNKNOWN_CONFIRMATION_TIME: {
        defaultMessage: 'unknown',
        id: 'TR_UNKNOWN_CONFIRMATION_TIME',
    },
    TR_UNKNOWN_TRANSACTION: {
        defaultMessage: 'Unknown transaction',
        id: 'TR_UNKNOWN_TRANSACTION',
    },
    TR_CONTRACT_TRANSACTION: {
        defaultMessage: 'Contract transaction',
        id: 'TR_CONTRACT_TRANSACTION',
    },
    TR_FAILED_TRANSACTION: {
        defaultMessage: 'Failed transaction',
        id: 'TR_FAILED_TRANSACTION',
    },
    TR_JOINT_TRANSACTION: {
        defaultMessage: 'Coinjoin transaction',
        id: 'TR_JOINT_TRANSACTION',
    },
    TR_JOINT_TRANSACTION_TARGET: {
        defaultMessage: '{inMy} out of {in} inputs, {outMy} out of {out} outputs',
        id: 'TR_JOINT_TRANSACTION_TARGET',
    },
    TR_COINJOIN_TRANSACTION_BATCH: {
        defaultMessage: 'Coinjoin transactions',
        id: 'TR_COINJOIN_TRANSACTION_BATCH',
    },
    TR_UNKNOWN_ERROR_SEE_CONSOLE: {
        defaultMessage: 'Unknown error. See console logs for details.',
        id: 'TR_UNKNOWN_ERROR_SEE_CONSOLE',
    },
    TR_UNACQUIRED: {
        defaultMessage: 'Unrecognized device',
        description: 'Device status',
        id: 'TR_UNACQUIRED',
    },
    TR_VALUES: {
        defaultMessage: 'Balance',
        id: 'TR_VALUES',
    },
    TR_VERIFY: {
        defaultMessage: 'Verify',
        description: 'Verify button in Sign and Verify form',
        id: 'TR_VERIFY',
    },
    TR_VERIFIED: {
        defaultMessage: 'Verified',
        id: 'TR_VERIFIED',
    },
    TR_VERIFY_MESSAGE: {
        defaultMessage: 'Verify message',
        description: 'Header for the Sign and Verify form',
        id: 'TR_VERIFY_MESSAGE',
    },
    TR_WAIT_FOR_REBOOT: {
        defaultMessage: 'Restarting Trezor',
        description: 'Info what is happening with users device.',
        id: 'TR_WAIT_FOR_REBOOT',
    },
    TR_VALIDATION: {
        defaultMessage: 'Validating firmware',
        description: 'Info what is happening with users device.',
        id: 'TR_VALIDATION',
    },
    TR_WALLET_DUPLICATE_DESC: {
        defaultMessage: 'The Passphrase wallet you are trying to add has been already discovered.',
        id: 'TR_WALLET_DUPLICATE_DESC',
    },
    TR_WALLET_DUPLICATE_RETRY: {
        defaultMessage: 'Try different passphrase',
        id: 'TR_WALLET_DUPLICATE_RETRY',
    },
    TR_WALLET_DUPLICATE_SWITCH: {
        defaultMessage: 'Continue to discovered wallet',
        id: 'TR_WALLET_DUPLICATE_SWITCH',
    },
    TR_WALLET_DUPLICATE_TITLE: {
        defaultMessage: 'Passphrase duplicated',
        id: 'TR_WALLET_DUPLICATE_TITLE',
    },
    TR_WELCOME_TO_TREZOR_TEXT_WALLET_CREATION: {
        defaultMessage: 'Create a new wallet or recover one using your wallet backup.',
        id: 'TR_WELCOME_TO_TREZOR_TEXT_WALLET_CREATION',
    },
    TR_WEST: {
        defaultMessage: 'West',
        id: 'TR_WEST',
    },
    TR_WHAT_IS_PASSPHRASE: {
        defaultMessage: 'Learn more about the difference',
        id: 'TR_WHAT_IS_PASSPHRASE',
    },
    TR_WIPING_YOUR_DEVICE: {
        defaultMessage:
            'Factory reset wipes the device memory, erasing all information including the wallet backup and PIN. Only perform a factory reset if you have your wallet backup, which is needed to restore access to your funds.',
        id: 'TR_WIPING_YOUR_DEVICE',
    },
    TR_WORDS: {
        defaultMessage: '{count} words',
        description: 'Number of words. For example: 12 words',
        id: 'TR_WORDS',
    },
    TR_SHOW_MORE_ADDRESSES: {
        defaultMessage: 'Show more ({count})',
        id: 'TR_SHOW_MORE_ADDRESSES',
    },
    TR_XRP_RESERVE_INFO: {
        defaultMessage:
            'XRP addresses require a minimum balance of {minBalance} XRP to activate and maintain the account.',
        id: 'TR_XRP_RESERVE_INFO',
    },
    TR_YOU_WERE_DISCONNECTED_DOT: {
        defaultMessage: 'You were disconnected.',
        id: 'TR_YOU_WERE_DISCONNECTED_DOT',
    },
    TR_YOUR_FIRMWARE_VERSION: {
        defaultMessage: 'Current firmware version  {version}',
        id: 'TR_YOUR_FIRMWARE_VERSION',
    },
    TR_YOUR_FIRMWARE_TYPE: {
        defaultMessage: 'Current firmware type  {version}',
        id: 'TR_YOUR_FIRMWARE_TYPE',
    },
    TR_SWITCH_TO_BITCOIN_ONLY: {
        defaultMessage: 'Switch to {bitcoinOnly}',
        id: 'TR_SWITCH_TO_BITCOIN_ONLY',
    },
    TR_SWITCH_TO_REGULAR: {
        defaultMessage: 'Switch to {regular}',
        id: 'TR_SWITCH_TO_REGULAR',
    },
    TR_YOUR_CURRENT_FIRMWARE_UNKNOWN: {
        defaultMessage:
            "It's not possible to detect the current firmware version when using the device in bootloader mode",
        id: 'TR_YOUR_CURRENT_FIRMWARE_UNKNOWN',
    },
    TR_YOUR_CURRENT_VERSION: {
        defaultMessage: 'Current version {version}',
        id: 'TR_YOUR_CURRENT_VERSION',
    },
    TR_YOUR_NEW_VERSION: {
        defaultMessage: 'Version {version} is available.',
        id: 'TR_YOUR_NEW_VERSION',
    },
    TR_YOUR_NEW_VERSION_IS_DOWNLOADING: {
        defaultMessage: 'Version {version} is downloading.',
        id: 'TR_YOUR_NEW_VERSION_IS_DOWNLOADING',
    },
    TR_YOUR_NEW_VERSION_IS_READY: {
        defaultMessage: 'Version {version} has been downloaded and is ready for installation.',
        id: 'TR_YOUR_NEW_VERSION_IS_READY',
    },
    TR_YOUR_TREZOR_IS_NOT_BACKED_UP: {
        defaultMessage: 'Your Trezor wallet is not backed up.',
        id: 'TR_YOUR_TREZOR_IS_NOT_BACKED_UP',
    },
    TR_YOUR_WALLET_IS_READY_WHAT: {
        defaultMessage: 'Your wallet is ready to use!',
        id: 'TR_YOUR_WALLET_IS_READY_WHAT',
    },
    TR_GAS_PRICE: {
        id: 'TR_GAS_PRICE',
        defaultMessage: 'Gas price',
    },
    TR_GAS_LIMIT: {
        id: 'TR_GAS_LIMIT',
        defaultMessage: 'Gas limit',
    },
    TR_GAS_USED: {
        id: 'TR_GAS_USED',
        defaultMessage: 'Gas used',
    },
    TR_NONCE: {
        id: 'TR_NONCE',
        defaultMessage: 'Nonce',
    },
    TR_PIN_MISMATCH_HEADING: {
        id: 'TR_PIN_MISMATCH_HEADING',
        defaultMessage: 'PIN mismatch!',
    },
    TR_DEBUG_SETTINGS: {
        id: 'TR_DEBUG_SETTINGS',
        defaultMessage: 'Debug',
    },
    TR_ACCOUNT_DETAILS_HEADER: {
        id: 'TR_ACCOUNT_DETAILS_HEADER',
        defaultMessage: 'Account details',
    },
    TR_ACCOUNT_DETAILS_TYPE_HEADER: {
        id: 'TR_ACCOUNT_DETAILS_TYPE_HEADER',
        defaultMessage: 'Account type',
    },
    TR_ACCOUNT_DETAILS_PATH_HEADER: {
        id: 'TR_ACCOUNT_DETAILS_PATH_HEADER',
        defaultMessage: 'Derivation path',
    },
    TR_ACCOUNT_DETAILS_PATH_DESC: {
        id: 'TR_ACCOUNT_DETAILS_PATH_DESC',
        defaultMessage:
            'The derivation path is a way to navigate and generate specific keys within the organized structure of an HD (Hierarchical Deterministic) wallet.',
    },
    TR_ACCOUNT_TYPE_BIP84_DESC: {
        id: 'TR_ACCOUNT_TYPE_BIP84_DESC',
        defaultMessage:
            'SegWit is the default address type in Trezor Suite. It reduces transaction size, boosts capacity, and enhances scalability while enabling smaller transaction fees, but may not work with some older services.',
    },
    TR_ACCOUNT_TYPE_BIP86_DESC: {
        id: 'TR_ACCOUNT_TYPE_BIP86_DESC',
        defaultMessage:
            'Taproot is a new address type that can enhance privacy and network efficiency. Note that some services may not support Taproot addresses yet.',
    },
    TR_ACCOUNT_TYPE_BIP49_DESC: {
        id: 'TR_ACCOUNT_TYPE_BIP49_DESC',
        defaultMessage:
            'Legacy SegWit is universally supported, more efficient than Legacy, and is compatible with both Legacy and SegWit.',
    },
    TR_ACCOUNT_TYPE_BIP44_DESC: {
        id: 'TR_ACCOUNT_TYPE_BIP44_DESC',
        defaultMessage:
            'Legacy uses simpler transaction formats but may result in higher transaction fees and lacks the efficiency and features found in newer address types.',
    },
    TR_ACCOUNT_TYPE_LEDGER_DESC: {
        id: 'TR_ACCOUNT_TYPE_LEDGER_DESC',
        defaultMessage:
            'Ledger accounts are compatible with Ledger Live derivation paths, enabling smooth migration from Ledger to Trezor.',
    },
    TR_ACCOUNT_TYPE_LEGACY_DESC: {
        id: 'TR_ACCOUNT_TYPE_LEGACY_DESC',
        defaultMessage:
            'Legacy accounts are compatible with Ledger Legacy derivation paths, enabling smooth migration from Ledger to Trezor.',
    },
    TR_ACCOUNT_TYPE_NORMAL_EVM_DESC: {
        id: 'TR_ACCOUNT_TYPE_NORMAL_EVM_DESC',
        defaultMessage:
            'The current and most widely accepted method of generating and managing {value} addresses ensures interoperability, security, and support for all types of tokens.',
    },
    TR_ACCOUNT_TYPE_NORMAL_SOLANA_DESC: {
        id: 'TR_ACCOUNT_TYPE_NORMAL_SOLANA_DESC',
        defaultMessage:
            'The current and most widely accepted method of generating and managing Solana addresses ensures interoperability, security, and support for SOL and SPL tokens.',
    },
    TR_ACCOUNT_TYPE_NORMAL_CARDANO_DESC: {
        id: 'TR_ACCOUNT_TYPE_CARDANO_DESC',
        defaultMessage:
            'The current and most widely accepted method of generating and managing Cardano addresses ensures interoperability, security, and support for all types of tokens.',
    },
    TR_ACCOUNT_TYPE_NORMAL_XRP_DESC: {
        id: 'TR_ACCOUNT_TYPE_XRP_DESC',
        defaultMessage:
            'XRP is a digital currency that enables fast, low-cost cross-border payments without relying on traditional mining, using a consensus ledger for quick transaction confirmations.',
    },
    TR_ACCOUNT_DETAILS_XPUB_HEADER: {
        id: 'TR_ACCOUNT_DETAILS_XPUB_HEADER',
        defaultMessage: 'Public key (XPUB)',
    },
    TR_ACCOUNT_DETAILS_XPUB: {
        id: 'TR_ACCOUNT_DETAILS_XPUB',
        defaultMessage:
            'Handle your account public key (XPUB) carefully. When exposed, a third party will be able to see your entire transaction history.',
    },
    TR_ACCOUNT_DETAILS_XPUB_BUTTON: {
        id: 'TR_ACCOUNT_DETAILS_XPUB_BUTTON',
        defaultMessage: 'Show public key',
    },
    TR_ACCOUNT_TYPE_NO_CAPABILITY: {
        id: 'TR_ACCOUNT_TYPE_NO_CAPABILITY',
        defaultMessage: 'Not supported.',
    },
    TR_ACCOUNT_TYPE_NO_SUPPORT: {
        id: 'TR_ACCOUNT_TYPE_NO_SUPPORT',
        defaultMessage: 'This account type is not supported on this Trezor model.',
    },
    TR_ACCOUNT_TYPE_UPDATE_REQUIRED: {
        id: 'TR_ACCOUNT_TYPE_UPDATE_REQUIRED',
        defaultMessage: 'Please update device firmware to enable this Account Type.',
    },
    TR_ACCOUNT_TYPE_BIP86_NAME: {
        id: 'TR_ACCOUNT_TYPE_BIP86_NAME',
        defaultMessage: 'Taproot',
    },
    TR_ACCOUNT_TYPE_BIP84_NAME: {
        id: 'TR_ACCOUNT_TYPE_BIP84_NAME',
        defaultMessage: 'SegWit',
    },
    TR_ACCOUNT_TYPE_BIP49_NAME: {
        id: 'TR_ACCOUNT_TYPE_BIP49_NAME',
        defaultMessage: 'Legacy SegWit',
    },
    TR_ACCOUNT_TYPE_BIP44_NAME: {
        id: 'TR_ACCOUNT_TYPE_BIP44_NAME',
        defaultMessage: 'Legacy',
    },
    TR_ACCOUNT_TYPE_BIP84_TECH: {
        id: 'TR_ACCOUNT_TYPE_BIP84_TECH',
        defaultMessage: 'BIP84, P2WPKH, Bech32',
    },
    TR_ACCOUNT_TYPE_BIP86_TECH: {
        id: 'TR_ACCOUNT_TYPE_BIP86_TECH',
        defaultMessage: 'BIP86, P2TR, Bech32m',
    },
    TR_ACCOUNT_TYPE_BIP49_TECH: {
        id: 'TR_ACCOUNT_TYPE_BIP49_TECH',
        defaultMessage: 'BIP49, P2SH-P2WPKH, Base58',
    },
    TR_ACCOUNT_TYPE_BIP44_TECH: {
        id: 'TR_ACCOUNT_TYPE_BIP44_TECH',
        defaultMessage: 'BIP44, P2PKH, Base58',
    },
    TR_ACCOUNT_TYPE_SOLANA_BIP44_CHANGE_NAME: {
        id: 'TR_ACCOUNT_TYPE_SOLANA_BIP44_CHANGE_NAME',
        defaultMessage: 'Bip44Change',
        dynamic: true,
    },
    TR_ACCOUNT_TYPE_SOLANA_BIP44_CHANGE_TECH: {
        id: 'TR_ACCOUNT_TYPE_SOLANA_BIP44_CHANGE_TECH',
        defaultMessage: 'BIP44, Base58',
        dynamic: true,
    },
    TR_ACCOUNT_TYPE_SOLANA_BIP44_CHANGE_DESC: {
        id: 'TR_ACCOUNT_TYPE_SOLANA_BIP44_CHANGE_DESC',
        defaultMessage: 'Bip44Change account',
        dynamic: true,
    },
    TR_ACCOUNT_TYPE_SLIP25_NAME: {
        id: 'TR_ACCOUNT_TYPE_SLIP25_NAME',
        defaultMessage: 'Coinjoin',
    },
    TR_ACCOUNT_TYPE_SLIP25_TECH: {
        id: 'TR_ACCOUNT_TYPE_SLIP25_TECH',
        defaultMessage: 'SLIP25, P2TR, Bech32m',
    },
    TR_ACCOUNT_TYPE_SLIP25_DESC: {
        id: 'TR_ACCOUNT_TYPE_SLIP25_DESC',
        defaultMessage:
            "On June 1st, 2024, the coinjoin feature was deactivated. Your coinjoin account and funds remain accessible, but you won't be able to initiate new coinjoin rounds.",
    },
    TOAST_QR_INCORRECT_ADDRESS: {
        id: 'TOAST_QR_INCORRECT_ADDRESS',
        defaultMessage: 'QR code contains invalid address for this account',
    },
    TOAST_QR_INCORRECT_COIN_SCHEME_PROTOCOL: {
        id: 'TOAST_QR_INCORRECT_COIN_SCHEME_PROTOCOL',
        defaultMessage: 'QR code is defined for {coin} account',
    },
    TOAST_QR_UNKNOWN_SCHEME_PROTOCOL: {
        id: 'TOAST_QR_UNKNOWN_SCHEME_PROTOCOL',
        defaultMessage:
            'Unknown protocol scheme: "{scheme}". Please try again or enter the address manually.',
    },
    TOAST_COIN_SCHEME_PROTOCOL: {
        id: 'TOAST_COIN_SCHEME_PROTOCOL',
        describe: 'Required for current notifications. Do not change.',
        defaultMessage: '{header}{body}',
    },
    TOAST_COIN_SCHEME_PROTOCOL_ACTION: {
        id: 'TOAST_COIN_SCHEME_PROTOCOL_ACTION',
        defaultMessage: 'Autofill send form',
    },
    TOAST_COIN_SCHEME_PROTOCOL_HEADER: {
        id: 'TOAST_COIN_SCHEME_PROTOCOL_HEADER',
        defaultMessage: 'Go to an account to send',
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
        defaultMessage: 'Account discovery error: {error}',
    },
    TOAST_BACKUP_FAILED: {
        id: 'TOAST_BACKUP_FAILED',
        defaultMessage: 'Backup failed',
    },
    TOAST_BACKUP_SUCCESS: {
        id: 'TOAST_BACKUP_SUCCESS',
        defaultMessage: 'Backup successful',
    },
    TOAST_SETTINGS_APPLIED: {
        id: 'TOAST_SETTINGS_APPLIED',
        defaultMessage: 'Settings changed successfully',
    },
    TOAST_PIN_CHANGED: {
        id: 'TOAST_PIN_CHANGED',
        defaultMessage: 'PIN changed successfully',
    },
    TOAST_WIPE_CODE_CHANGED: {
        id: 'TOAST_WIPE_CODE_CHANGED',
        defaultMessage: 'Wipe code changed successfully',
    },
    TOAST_WIPE_CODE_REMOVED: {
        id: 'TOAST_WIPE_CODE_REMOVED',
        defaultMessage: 'Wipe code removed successfully',
    },
    TOAST_DEVICE_WIPED: {
        id: 'TOAST_DEVICE_WIPED',
        defaultMessage: 'Device wiped successfully',
    },
    TOAST_COPY_TO_CLIPBOARD: {
        id: 'TOAST_COPY_TO_CLIPBOARD',
        defaultMessage: 'Copied to clipboard',
    },
    TOAST_TX_SENT: {
        id: 'TOAST_TX_SENT',
        defaultMessage: '{amount} sent from {account}',
    },
    TOAST_RAW_TX_SENT: {
        id: 'TOAST_RAW_TX_SENT',
        defaultMessage: 'Transaction sent. TXID: {txid}',
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
        defaultMessage: 'Transaction signing error: {error}',
    },
    TOAST_VERIFY_ADDRESS_ERROR: {
        id: 'TOAST_VERIFY_ADDRESS_ERROR',
        defaultMessage: 'Address verification error: {error}',
    },
    TOAST_VERIFY_XPUB_ERROR: {
        id: 'TOAST_VERIFY_XPUB_ERROR',
        defaultMessage: 'Public key verification error: {error}',
    },
    TOAST_SIGN_MESSAGE_SUCCESS: {
        id: 'TOAST_SIGN_MESSAGE_SUCCESS',
        defaultMessage: 'Message signing successful',
    },
    TOAST_SIGN_MESSAGE_ERROR: {
        id: 'TOAST_SIGN_MESSAGE_ERROR',
        defaultMessage: 'Message signing error: {error}',
    },
    TOAST_VERIFY_MESSAGE_SUCCESS: {
        id: 'TOAST_VERIFY_MESSAGE_SUCCESS',
        defaultMessage: 'Message verification successful',
    },
    TOAST_VERIFY_MESSAGE_ERROR: {
        id: 'TOAST_VERIFY_MESSAGE_ERROR',
        defaultMessage: 'Message verification error: {error}',
    },
    TOAST_AUTO_UPDATER_ERROR: {
        id: 'TOAST_AUTO_UPDATER_ERROR',
        defaultMessage: 'Auto updater error ({state})',
    },
    TOAST_AUTO_UPDATER_NO_NEW: {
        id: 'TOAST_AUTO_UPDATER_NO_NEW',
        defaultMessage: 'No new updates available.',
    },
    TOAST_AUTO_UPDATER_NEW_VERSION_FIRST_RUN: {
        id: 'TOAST_AUTO_UPDATER_NEW_VERSION_FIRST_RUN',
        defaultMessage: 'New version ({version}) installed successfully',
    },
    TOAST_GENERIC_ERROR: {
        id: 'TOAST_GENERIC_ERROR',
        defaultMessage: 'Error: {error}',
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
        defaultMessage: 'No notifications',
    },
    NOTIFICATIONS_EMPTY_DESC: {
        id: 'NOTIFICATIONS_EMPTY_DESC',
        defaultMessage: "You'll see all important notifications here.",
    },
    NOTIFICATIONS_SEEN_TITLE: {
        id: 'NOTIFICATIONS_SEEN_TITLE',
        defaultMessage: 'All read',
    },
    NOTIFICATIONS_ALL_TITLE: {
        id: 'NOTIFICATIONS_ALL_TITLE',
        defaultMessage: 'All activity',
    },
    NOTIFICATIONS_IMPORTANT_TITLE: {
        id: 'NOTIFICATIONS_IMPORTANT_TITLE',
        defaultMessage: 'Notifications',
    },
    NOTIFICATIONS_UNSEEN_TITLE: {
        id: 'NOTIFICATIONS_UNSEEN_TITLE',
        defaultMessage: '{count} Unread',
    },
    LABELING_ACCOUNT: {
        id: 'LABELING_ACCOUNT',
        defaultMessage: '{networkName} #{index}',
    },
    TR_LAST_UPDATE: {
        id: 'TR_LAST_UPDATE',
        defaultMessage: 'Price updated {value}',
    },
    TR_UPDATE_AVAILABLE: {
        id: 'TR_UPDATE_AVAILABLE',
        defaultMessage: 'Update available',
    },
    TR_UP_TO_DATE: {
        defaultMessage: 'Up to date',
        id: 'TR_UP_TO_DATE',
    },
    TR_INSTALL_LATEST_FW: {
        defaultMessage: 'Install latest',
        id: 'TR_INSTALL_LATEST_FW',
    },
    TR_QUICK_ACTION_TOOLTIP_TREZOR_SUITE: {
        id: 'TR_QUICK_ACTION_TOOLTIP_TREZOR_SUITE',
        defaultMessage: 'Trezor Suite',
    },
    TR_QUICK_ACTION_TOOLTIP_TREZOR_DEVICE: {
        id: 'TR_QUICK_ACTION_TOOLTIP_TREZOR_DEVICE',
        defaultMessage: 'Trezor device',
    },
    TR_QUICK_ACTION_TOOLTIP_UP_TO_DATE: {
        id: 'TR_QUICK_ACTION_TOOLTIP_UP_TO_DATE',
        defaultMessage: 'Up to date ({currentVersion})',
    },
    TR_QUICK_ACTION_TOOLTIP_UPDATE_AVAILABLE: {
        id: 'TR_QUICK_ACTION_TOOLTIP_UPDATE_AVAILABLE',
        defaultMessage: 'Update available ({newVersion})',
    },
    TR_QUICK_ACTION_TOOLTIP_RESTART_TO_UPDATE: {
        id: 'TR_QUICK_ACTION_TOOLTIP_RESTART_TO_UPDATE',
        defaultMessage: 'Restart to update',
    },
    TR_QUICK_ACTION_TOOLTIP_JUST_UPDATED: {
        id: 'TR_QUICK_ACTION_TOOLTIP_JUST_UPDATED',
        defaultMessage: 'Just updated ({currentVersion})',
    },
    TR_QUICK_ACTION_UPDATE_POPOVER_APP_UPDATE_AVAILABLE: {
        id: 'TR_QUICK_ACTION_UPDATE_POPOVER_APP_UPDATE_AVAILABLE',
        defaultMessage: 'App update available',
    },
    TR_QUICK_ACTION_UPDATE_POPOVER_APP_HAS_BEEN_UPDATED: {
        id: 'TR_QUICK_ACTION_UPDATE_POPOVER_APP_HAS_BEEN_UPDATED',
        defaultMessage: 'App’s been updated!',
    },
    TR_QUICK_ACTION_UPDATE_POPOVER_APP_DOWNLOADED: {
        id: 'TR_QUICK_ACTION_UPDATE_POPOVER_APP_DOWNLOADED',
        defaultMessage: 'Suite downloaded a new Trezor update!',
    },
    TR_QUICK_ACTION_UPDATE_POPOVER_TREZOR_UPDATE_AVAILABLE: {
        id: 'TR_QUICK_ACTION_UPDATE_POPOVER_TREZOR_UPDATE_AVAILABLE',
        defaultMessage: 'Trezor update available',
    },
    TR_QUICK_ACTION_UPDATE_POPOVER_CLICK_TO_START_UPDATE: {
        id: 'TR_QUICK_ACTION_UPDATE_POPOVER_CLICK_TO_START_UPDATE',
        defaultMessage: 'Click to start update',
    },
    TR_QUICK_ACTION_UPDATE_POPOVER_CLICK_TO_RESTART_AND_UPDATE: {
        id: 'TR_QUICK_ACTION_UPDATE_POPOVER_CLICK_TO_RESTART_AND_UPDATE',
        defaultMessage: 'Click to restart & update',
    },
    TR_QUICK_ACTION_UPDATE_POPOVER_WHATS_NEW: {
        id: 'TR_QUICK_ACTION_UPDATE_POPOVER_WHATS_NEW',
        defaultMessage: 'What’s new?',
    },
    TR_QUICK_ACTION_DEBUG_EAP_EXPERIMENTAL_ENABLED: {
        id: 'TR_QUICK_ACTION_DEBUG_EAP_EXPERIMENTAL_ENABLED',
        defaultMessage: 'Enabled',
    },
    TR_TOR_ENABLED: {
        id: 'TR_TOR_ENABLED',
        defaultMessage: 'Enabled',
    },
    TR_TOR_DISABLED: {
        id: 'TR_TOR_DISABLED',
        defaultMessage: 'Disabled',
    },
    TR_TOR_DISABLING: {
        id: 'TR_TOR_DISABLING',
        defaultMessage: 'Disabling',
    },
    TR_TOR_ENABLING: {
        id: 'TR_TOR_ENABLING',
        defaultMessage: 'Enabling',
    },
    TR_TOR_ERROR: {
        id: 'TR_TOR_ERROR',
        defaultMessage: 'Error',
    },
    TR_TOR_MISBEHAVING: {
        id: 'TR_TOR_MISBEHAVING',
        defaultMessage: 'Misbehaving',
    },
    TR_TOR_TITLE: {
        id: 'TR_TOR_TITLE',
        defaultMessage: 'Tor',
    },
    TR_TOR_ENABLE: {
        id: 'TR_TOR_ENABLE',
        defaultMessage: 'Enable Tor',
    },
    TR_TOR_KEEP_RUNNING: {
        id: 'TR_TOR_KEEP_RUNNING',
        defaultMessage: 'Keep running Tor',
    },
    TR_TOR_STOP: {
        id: 'TR_TOR_STOP',
        defaultMessage: 'Stop Tor',
    },
    TR_TOR_DISABLE: {
        id: 'TR_TOR_DISABLE',
        defaultMessage: 'Disable Tor',
    },
    TR_TOR_DISABLE_ONIONS_ONLY: {
        id: 'TR_TOR_DISABLE_ONIONS_ONLY',
        defaultMessage: 'Missing non-onion custom backends',
    },
    TR_TOR_DISABLE_ONIONS_ONLY_RESOLVED: {
        id: 'TR_TOR_DISABLE_ONIONS_ONLY_RESOLVED',
        defaultMessage: 'Disable Tor',
    },
    TR_TOR_DISABLE_ONIONS_ONLY_TITLE: {
        id: 'TR_TOR_DISABLE_ONIONS_ONLY_TITLE',
        defaultMessage:
            'Disabling Tor now will reset all Onion backends to the default Trezor servers.',
    },
    TR_TOR_DISABLE_ONIONS_ONLY_DESCRIPTION: {
        id: 'TR_TOR_DISABLE_ONIONS_ONLY_DESCRIPTION',
        defaultMessage: 'Please add non-onion custom backend addresses to prevent this behavior.',
    },
    TR_TOR_ENABLE_AND_CONFIRM: {
        id: 'TR_TOR_ENABLE_AND_CONFIRM',
        defaultMessage: 'Enable Tor and confirm',
    },
    TR_TOR_DESCRIPTION: {
        id: 'TR_TOR_DESCRIPTION',
        defaultMessage:
            "Route all of Trezor Suite's traffic through the Tor network, increasing your privacy and security. It may take some time for Tor to load and establish a connection.",
    },
    TR_TOR_REMOVE_ONION_AND_DISABLE: {
        id: 'TR_TOR_REMOVE_ONION_AND_DISABLE',
        defaultMessage: 'Disable Tor and switch to default backends',
    },
    TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_TITLE: {
        id: 'TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_TITLE',
        defaultMessage: 'Custom backends are no longer using onion addresses only.',
    },
    TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_DESCRIPTION: {
        id: 'TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_DESCRIPTION',
        defaultMessage: 'You can safely disable Tor now.',
    },
    TR_UNAVAILABLE_COINJOIN_TOR_DISABLE_TOOLTIP: {
        id: 'TR_UNAVAILABLE_COINJOIN_TOR_DISABLE_TOOLTIP',
        defaultMessage: 'Unavailable. Tor is disabled.',
    },
    TR_UNAVAILABLE_COINJOIN_DEVICE_DISCONNECTED: {
        id: 'TR_UNAVAILABLE_COINJOIN_DEVICE_DISCONNECTED',
        defaultMessage: 'Unavailable. Associated device is disconnected.',
    },
    TR_UNAVAILABLE_COINJOIN_ACCOUNT_OUT_OF_SYNC: {
        id: 'TR_UNAVAILABLE_COINJOIN_ACCOUNT_OUT_OF_SYNC',
        defaultMessage: 'Unavailable. Account sync in progress, please wait.',
    },
    TR_UNAVAILABLE_COINJOIN_NO_INTERNET: {
        id: 'TR_UNAVAILABLE_COINJOIN_NO_INTERNET',
        defaultMessage: 'Unavailable. No internet connection.',
    },
    TR_UNAVAILABLE_COINJOIN_COORDINATOR: {
        id: 'TR_UNAVAILABLE_COINJOIN_COORDINATOR',
        defaultMessage: "Coordinator isn't available.",
    },
    TR_UNAVAILABLE_COINJOIN_AMOUNTS_TOO_SMALL: {
        id: 'TR_UNAVAILABLE_COINJOIN_AMOUNTS_TOO_SMALL',
        defaultMessage: 'Amounts are too small for coinjoin.',
    },
    TR_UNAVAILABLE_COINJOIN_NO_ANONYMITY_SET: {
        id: 'TR_UNAVAILABLE_COINJOIN_NO_ANONYMITY_SET',
        defaultMessage: "Coinjoin can't be initiated without setting the coin privacy levels.",
    },
    TR_ONION_BACKEND_TOR_NEEDED: {
        id: 'TR_ONION_BACKEND_TOR_NEEDED',
        defaultMessage:
            'You used an onion address for your backends. To use onion addresses, you need to have access to the Tor network.',
    },
    TR_ONION_LINKS_TITLE: {
        id: 'TR_ONION_LINKS_TITLE',
        defaultMessage: 'Open trezor.io links as .onion links',
    },
    TR_TOR_CONFIG_SNOWFLAKE_TITLE: {
        id: 'TR_TOR_CONFIG_SNOWFLAKE_TITLE',
        defaultMessage: 'Tor Snowflake Binary Path',
    },
    TR_TOR_CONFIG_SNOWFLAKE_DESCRIPTION: {
        id: 'TR_TOR_CONFIG_SNOWFLAKE_DESCRIPTION',
        defaultMessage:
            'Enter the path to the Tor Snowflake binary on your system. Make sure Tor is disabled before making this change.',
    },
    TR_TOR_CONFIG_SNOWFLAKE_ERROR_PATH: {
        id: 'TR_TOR_CONFIG_SNOWFLAKE_ERROR_PATH',
        defaultMessage: 'Must be a valid full path.',
    },
    TR_TOR_CONFIG_SNOWFLAKE_UPDATE_LABEL: {
        id: 'TR_TOR_CONFIG_SNOWFLAKE_UPDATE_LABEL',
        defaultMessage: 'Update path',
    },
    TR_TOR_CONFIG_SNOWFLAKE_DISABLE_LABEL: {
        id: 'TR_TOR_CONFIG_SNOWFLAKE_DISABLE_LABEL',
        defaultMessage: 'Disable Tor Snowflake',
    },
    TR_TOR_ENABLE_TITLE: {
        id: 'TR_TOR_ENABLE_TITLE',
        defaultMessage: 'Enable Tor',
    },
    TR_ONION_LINKS_DESCRIPTION: {
        id: 'TR_ONION_LINKS_DESCRIPTION',
        defaultMessage:
            'With this setting enabled, all trezor.io links will be opened as .onion links.',
    },
    TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_TITLE: {
        id: 'TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_TITLE',
        defaultMessage: '<b>Tor</b> must be enabled to remain private when running coinjoin.',
    },
    TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_SUBTITLE: {
        id: 'TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_SUBTITLE',
        defaultMessage: "Please select 'Enable Tor' to continue or 'Leave' to quit the process.",
    },
    TR_TOR_KEEP_RUNNING_FOR_COIN_JOIN_SUBTITLE: {
        id: 'TR_TOR_KEEP_RUNNING_FOR_COIN_JOIN_SUBTITLE',
        defaultMessage:
            "Please select 'Keep running Tor' to continue or 'Stop Tor' to quit the coinjoin process.",
    },
    TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_LEAVE: {
        id: 'TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_LEAVE',
        defaultMessage: 'Leave',
    },
    TR_TRANSACTIONS_NOT_AVAILABLE: {
        id: 'TR_TRANSACTIONS_NOT_AVAILABLE',
        defaultMessage: 'Transaction history not available',
    },
    TR_N_TRANSACTIONS: {
        id: 'TR_N_TRANSACTIONS',
        defaultMessage: '{value} {value, plural, one {transaction} other {transactions}}',
    },
    TR_TREZOR_BRIDGE_RUNNING_VERSION: {
        id: 'TR_TREZOR_BRIDGE_RUNNING_VERSION',
        defaultMessage: 'Trezor Bridge running version {version}',
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
        defaultMessage: 'Wallet successfully added',
    },
    TR_WIPE_DEVICE_TEXT: {
        id: 'TR_WIPE_DEVICE_TEXT',
        defaultMessage:
            'Resetting the device removes all its data. Reset your device only if you have your wallet backup, which can restore access to your funds.',
    },
    TR_WIPE_DEVICE_CHECKBOX_1_TITLE: {
        id: 'TR_WIPE_DEVICE_CHECKBOX_1_TITLE',
        defaultMessage: 'I understand this action deletes all data on the device',
    },
    TR_WIPE_DEVICE_CHECKBOX_1_DESCRIPTION: {
        id: 'TR_WIPE_DEVICE_CHECKBOX_1_DESCRIPTION',
        defaultMessage:
            "All data associated with existing accounts will be deleted. You'll need a wallet backup to recover your wallet.",
    },
    TR_WIPE_DEVICE_CHECKBOX_2_TITLE: {
        id: 'TR_WIPE_DEVICE_CHECKBOX_2_TITLE',
        defaultMessage:
            'I understand I must have a backup of my wallet backup in order to regain access to my funds',
    },
    TR_WIPE_DEVICE_CHECKBOX_2_DESCRIPTION: {
        id: 'TR_WIPE_DEVICE_CHECKBOX_2_DESCRIPTION',
        defaultMessage:
            "Your wallet backup is absolutely essential for regaining access to your funds in case of device loss, theft, or damage. Without it, there's nothing anybody can do, not even Trezor Support. Write it down on paper or your wallet backup card and store it somewhere safe and secure. Just remember where you have it.",
    },
    TR_CANCEL: {
        id: 'TR_CANCEL',
        defaultMessage: 'Cancel',
    },
    TR_CANCELLED: {
        id: 'TR_CANCELLED',
        defaultMessage: 'Canceled',
    },
    TR_FOLLOW_INSTRUCTIONS_ON_DEVICE: {
        id: 'TR_FOLLOW_INSTRUCTIONS_ON_DEVICE',
        defaultMessage: "Check your Trezor's screen",
    },
    TR_ADVANCED_RECOVERY_TEXT: {
        id: 'TR_ADVANCED_RECOVERY_TEXT',
        defaultMessage:
            "Spell each word of your wallet backup using the keypad below, according to where the letters are located on your Trezor's screen.",
    },
    TR_ADVANCED_RECOVERY_NOT_SURE: {
        id: 'TR_ADVANCED_RECOVERY_NOT_SURE',
        defaultMessage: 'Not sure how the advanced method works?',
    },
    TR_CHECK_RECOVERY_SEED_DESC_T1B1: {
        id: 'TR_CHECK_RECOVERY_SEED_DESC_T1B1',
        defaultMessage:
            "Enter the words from your wallet backup here in the order displayed on your device. You may be asked to type some words that aren't part of your wallet backup as an additional security measure.",
        dynamic: true,
    },
    TR_CHECK_RECOVERY_SEED_DESC_T2T1: {
        id: 'TR_CHECK_RECOVERY_SEED_DESC_T2T1',
        defaultMessage:
            'Your wallet backup is entered using the touchscreen. This avoids exposing any of your sensitive information to a potentially insecure computer or web browser.',
        dynamic: true,
    },
    TR_CHECK_RECOVERY_SEED_DESC_T3T1: {
        id: 'TR_CHECK_RECOVERY_SEED_DESC_T3T1',
        defaultMessage:
            'Your wallet backup is entered using the touchscreen. This avoids exposing any of your sensitive information to a potentially insecure computer or web browser.',
        dynamic: true,
    },
    TR_CHECK_RECOVERY_SEED_DESC_T2B1: {
        id: 'TR_CHECK_RECOVERY_SEED_DESC_T2B1',
        defaultMessage:
            "Use the two-button pad to enter your wallet backup. By doing this, you're keeping all your sensitive info safe and sound, away from any shady or insecure computer or web browser.",
        dynamic: true,
    },
    TR_SELECT_NUMBER_OF_WORDS: {
        id: 'TR_SELECT_NUMBER_OF_WORDS',
        defaultMessage: 'Select the number of words in your wallet backup',
    },
    TR_SEED_BACKUP_LENGTH: {
        id: 'TR_SEED_BACKUP_LENGTH',
        defaultMessage: 'Your wallet backup may contain 12, 18, or 24 words.',
        dynamic: true,
    },
    TR_SEED_BACKUP_LENGTH_INCLUDING_SHAMIR: {
        id: 'TR_SEED_BACKUP_LENGTH_INCLUDING_SHAMIR',
        defaultMessage: 'Your wallet backup may contain 12, 18, 20, 24, or 33 words.',
        dynamic: true,
    },
    TR_ENTER_ALL_WORDS_IN_CORRECT: {
        id: 'TR_ENTER_ALL_WORDS_IN_CORRECT',
        defaultMessage: 'Enter all words in the correct order',
    },
    TR_SEED_WORDS_ENTER_COMPUTER: {
        id: 'TR_SEED_WORDS_ENTER_COMPUTER',
        defaultMessage:
            'Enter the words from your wallet backup in the order displayed on your Trezor.',
    },
    TR_SEED_WORDS_ENTER_TOUCHSCREEN: {
        id: 'TR_SEED_WORDS_ENTER_TOUCHSCREEN',
        defaultMessage:
            'Using the touchscreen display, enter all the words in the correct order until completed.',
        dynamic: true,
    },
    TR_SEED_WORDS_ENTER_BUTTONS: {
        id: 'TR_SEED_WORDS_ENTER_BUTTONS',
        defaultMessage:
            'Using the buttons on the device, enter the words from your seed in the order displayed on your device.',
    },
    TR_CHOOSE_RECOVERY_TYPE: {
        id: 'TR_CHOOSE_RECOVERY_TYPE',
        defaultMessage: 'Choose recovery type',
    },
    TR_ENTER_SEED_WORDS_ON_DEVICE: {
        id: 'TR_ENTER_SEED_WORDS_ON_DEVICE',
        defaultMessage:
            'The words are entered on the device for security reasons. Please enter the words in the correct order.',
    },
    TR_SEED_CHECK_SUCCESS_TITLE: {
        id: 'TR_SEED_CHECK_SUCCESS_TITLE',
        defaultMessage: 'Wallet backup successfully checked!',
    },
    TR_SEED_CHECK_SUCCESS_DESC: {
        id: 'TR_SEED_CHECK_SUCCESS_DESC',
        defaultMessage:
            'Your wallet backup is valid and has been successfully verified. Look after it and store it in a safe, secure location.',
    },
    TR_SEED_CHECK_FAIL_TITLE: {
        id: 'TR_SEED_CHECK_FAIL_TITLE',
        defaultMessage: 'Wallet backup check failed',
    },
    TR_WORD_DOES_NOT_EXIST: {
        id: 'TR_WORD_DOES_NOT_EXIST',
        defaultMessage: 'Word "{word}" does not exist in BIP39 wordlist.',
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
        defaultMessage: 'I understand this is a simulated check and it won’t affect my device',
    },
    TR_DRY_RUN_CHECK_ITEM_DESCRIPTION: {
        id: 'TR_DRY_RUN_CHECK_ITEM_DESCRIPTION',
        defaultMessage:
            "Note that this test is precisely the same as the normal recovery process. You should only trust the information and instructions displayed on your Trezor's screen.",
    },
    TR_ACCOUNT_TYPE: {
        id: 'TR_ACCOUNT_TYPE',
        defaultMessage: 'Account type',
    },
    TR_ACTIVATED_COINS: {
        id: 'TR_ACTIVATED_COINS',
        defaultMessage: 'Activated coins',
    },
    TR_INACTIVE_COINS: {
        id: 'TR_INACTIVE_COINS',
        defaultMessage: 'Not activated yet',
    },
    TR_COIN_SETTINGS: {
        id: 'TR_COIN_SETTINGS',
        defaultMessage: 'Coin settings',
    },
    TR_SELECT_COIN_FOR_SETTINGS: {
        id: 'TR_SELECT_COIN_FOR_SETTINGS',
        defaultMessage: 'Select active coin to change settings',
    },
    FW_CAPABILITY_UPDATE_REQUIRED: {
        id: 'FW_CAPABILITY_UPDATE_REQUIRED',
        defaultMessage: 'Firmware update required',
        description: 'Firmware is too OLD use this coin',
    },
    FW_CAPABILITY_CONNECT_OUTDATED: {
        id: 'FW_CAPABILITY_CONNECT_OUTDATED',
        defaultMessage: 'Application update required',
        description: 'Firmware is too NEW use this coin (trezor-connect is outdated)',
    },
    MODAL_ADD_ACCOUNT_NO_ACCOUNT: {
        id: 'MODAL_ADD_ACCOUNT_NO_ACCOUNT',
        defaultMessage: 'Account discovery error',
    },
    MODAL_ADD_ACCOUNT_NO_EMPTY_ACCOUNT: {
        id: 'MODAL_ADD_ACCOUNT_NO_EMPTY_ACCOUNT',
        defaultMessage: 'There is no empty account available.',
    },
    MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY: {
        id: 'MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY',
        defaultMessage: 'Previous account is empty',
    },
    MODAL_ADD_ACCOUNT_LIMIT_EXCEEDED: {
        id: 'MODAL_ADD_ACCOUNT_LIMIT_EXCEEDED',
        defaultMessage: 'The maximum allowed number of accounts has been created.',
    },
    MODAL_ADD_ACCOUNT_COINJOIN_LIMIT_EXCEEDED: {
        id: 'MODAL_ADD_ACCOUNT_COINJOIN_LIMIT_EXCEEDED',
        defaultMessage: 'You can have only one coinjoin account per wallet.',
    },
    MODAL_ADD_ACCOUNT_COINJOIN_NO_SUPPORT: {
        id: 'MODAL_ADD_ACCOUNT_COINJOIN_NO_SUPPORT',
        defaultMessage: 'Please update your firmware to use coinjoin',
    },
    MODAL_ADD_ACCOUNT_COINJOIN_UPDATE_REQUIRED: {
        id: 'MODAL_ADD_ACCOUNT_COINJOIN_UPDATE_REQUIRED',
        defaultMessage: 'Please update your Firmware to enable the coinjoin feature.',
    },
    MODAL_ADD_ACCOUNT_COINJOIN_DESKTOP_ONLY: {
        id: 'MODAL_ADD_ACCOUNT_COINJOIN_DESKTOP_ONLY',
        defaultMessage: 'Coinjoin account only available on the Trezor Suite desktop app.',
    },
    TR_DEVICE_IN_RECOVERY_MODE: {
        id: 'TR_DEVICE_IN_RECOVERY_MODE',
        defaultMessage: 'Your device is in recovery mode.',
    },
    TR_DEVICE_IN_RECOVERY_MODE_DESC: {
        id: 'TR_DEVICE_IN_RECOVERY_MODE_DESC',
        defaultMessage: 'This device is in recovery mode. Click the button to continue.',
    },
    TR_SUITE_STORAGE: {
        id: 'TR_SUITE_STORAGE',
        defaultMessage: 'App storage',
    },
    TR_CLEAR_STORAGE: {
        id: 'TR_CLEAR_STORAGE',
        defaultMessage: 'Reset app',
    },
    TR_STORAGE_CLEARED: {
        id: 'TR_STORAGE_CLEARED',
        defaultMessage: 'Storage cleared',
    },
    TR_CLEAR_STORAGE_DESCRIPTION: {
        id: 'TR_CLEAR_STORAGE_DESCRIPTION',
        defaultMessage:
            'Resetting the app to its default settings is a recommended initial step for troubleshooting. The app will automatically restart once the process is complete.',
    },
    TR_TO_ACCESS_OTHER_WALLETS: {
        id: 'TR_TO_ACCESS_OTHER_WALLETS',
        defaultMessage: 'Connect your device to add other wallets',
    },
    TR_TO_ADD_NEW_ACCOUNT_PLEASE_CONNECT: {
        id: 'TR_TO_ADD_NEW_ACCOUNT_PLEASE_CONNECT',
        defaultMessage: 'Connect your device to add new accounts.',
    },
    TR_EJECT_HEADING: {
        id: 'TR_EJECT_HEADING',
        defaultMessage: 'Eject',
        description: 'Heading above col with "eject wallet" buttons in switch wallets modal',
    },
    TR_VIEW_ONLY_CALL_TO_ACTION: {
        id: 'TR_VIEW_ONLY_CALL_TO_ACTION',
        defaultMessage:
            'Enable view-only to check balances <primary>after you disconnect your Trezor</primary>',
    },
    TR_VIEW_ONLY_EXPLANATION: {
        id: 'TR_VIEW_ONLY_EXPLANATION',
        defaultMessage:
            'To send or trade coins, <secondLine>simply reconnect your device</secondLine>',
    },
    RECEIVE_TITLE: {
        id: 'RECEIVE_TITLE',
        defaultMessage: 'Receive {symbol}',
    },
    RECEIVE_DESC_BITCOIN: {
        id: 'RECEIVE_DESC_BITCOIN',
        defaultMessage:
            'To receive any funds you need to get a fresh receive address. It is advised to always use a fresh address, as this prevents anyone else from tracking your transactions. You can reuse an address, but we recommend not doing so unless absolutely necessary.',
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
        defaultMessage: 'Address',
        description: 'Alternative title for alt-coins',
    },
    RECEIVE_ADDRESS_REVEAL: {
        id: 'RECEIVE_ADDRESS_REVEAL',
        defaultMessage: 'Show full address',
    },
    RECEIVE_UNVERIFIED_ADDRESS_REVEAL: {
        id: 'RECEIVE_UNVERIFIED_ADDRESS_REVEAL',
        defaultMessage: 'Generate unverified address',
    },
    RECEIVE_ADDRESS_COINJOIN_DISALLOW: {
        id: 'RECEIVE_ADDRESS_COINJOIN_DISALLOW',
        defaultMessage:
            'To create additional addresses for a coinjoin account, you must ensure that you have already received bitcoin at the initial address.',
    },
    TR_RECEIVE_ADDRESS_SECURITY_CHECK_FAILED: {
        id: 'TR_RECEIVE_ADDRESS_SECURITY_CHECK_FAILED',
        defaultMessage: 'Your device may have been compromised. Do not send funds to it.',
    },
    RECEIVE_ADDRESS_LIMIT_REACHED: {
        id: 'RECEIVE_ADDRESS_LIMIT_REACHED',
        defaultMessage: "You've reached the maximum limit of 21 fresh, unused addresses",
    },
    RECEIVE_ADDRESS_UNAVAILABLE: {
        id: 'RECEIVE_ADDRESS_UNAVAILABLE',
        defaultMessage: 'Unavailable',
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
        defaultMessage: 'Unused',
    },
    RECEIVE_TABLE_USED: {
        id: 'RECEIVE_TABLE_USED',
        defaultMessage: 'Used',
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
    TR_DASHBOARD_ASSET_FAILED: {
        defaultMessage: 'Asset not loaded correctly',
        description: 'Display error message in single asset (discovery partially failed)',
        id: 'TR_DASHBOARD_ASSET_FAILED',
    },
    TR_DASHBOARD_ASSETS_ERROR: {
        defaultMessage: 'Assets were not loaded properly',
        id: 'TR_DASHBOARD_ASSETS_ERROR',
    },
    TR_DASHBOARD_DISCOVERY_ERROR: {
        defaultMessage: 'Discovery error',
        id: 'TR_DASHBOARD_DISCOVERY_ERROR',
    },
    TR_DASHBOARD_DISCOVERY_ERROR_PARTIAL_DESC: {
        defaultMessage: 'Accounts were not loaded properly {details}',
        id: 'TR_DASHBOARD_DISCOVERY_ERROR_PARTIAL_DESC',
    },
    TR_PIN: {
        id: 'TR_PIN',
        defaultMessage: 'PIN',
    },
    TR_CHANGE_PIN: {
        id: 'TR_CHANGE_PIN',
        defaultMessage: 'Change PIN',
        description: 'Button that initiates pin change',
    },
    TR_SETUP_WIPE_CODE: {
        id: 'TR_SETUP_WIPE_CODE',
        defaultMessage: 'Set up wipe code',
    },
    TR_CHANGE_WIPE_CODE: {
        id: 'TR_CHANGE_WIPE_CODE',
        defaultMessage: 'Change wipe code',
    },
    TR_REMOVE_WIPE_CODE: {
        id: 'TR_REMOVE_WIPE_CODE',
        defaultMessage: 'Remove wipe code',
    },
    TR_BUY_RECEIVE_ACCOUNT_QUESTION_TOOLTIP: {
        id: 'TR_BUY_RECEIVE_ACCOUNT_QUESTION_TOOLTIP',
        defaultMessage:
            "This is the account where you'll find your coins once the transaction is finished.",
    },
    TR_BUY_RECEIVE_ADDRESS_QUESTION_TOOLTIP: {
        id: 'TR_BUY_RECEIVE_ADDRESS_QUESTION_TOOLTIP',
        defaultMessage:
            'This is the specific alphanumeric address that will receive your coins. Verify this address on your Trezor.',
    },
    TR_PAYMENT_METHOD_CREDITCARD: {
        id: 'TR_PAYMENT_METHOD_CREDITCARD',
        defaultMessage: 'Credit Card',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_BANKTRANSFER: {
        id: 'TR_PAYMENT_METHOD_BANKTRANSFER',
        defaultMessage: 'Bank Transfer',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_WORLDPAYCREDIT: {
        id: 'TR_PAYMENT_METHOD_WORLDPAYCREDIT',
        defaultMessage: 'Worldpay Credit',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_TEN31SEPA: {
        id: 'TR_PAYMENT_METHOD_TEN31SEPA',
        defaultMessage: 'TEN31 SEPA',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_ACH: {
        id: 'TR_PAYMENT_METHOD_ACH',
        defaultMessage: 'ACH',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_NZBANKTRANSFER: {
        id: 'TR_PAYMENT_METHOD_NZBANKTRANSFER',
        defaultMessage: 'NZ Bank Transfer',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_PIX: {
        id: 'TR_PAYMENT_METHOD_PIX',
        defaultMessage: 'Pix',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_PAY4FUN: {
        id: 'TR_PAYMENT_METHOD_PAY4FUN',
        defaultMessage: 'Pay4Fun',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_UNKNOWN: {
        id: 'TR_PAYMENT_METHOD_UNKNOWN',
        defaultMessage: 'Unknown',
    },
    TR_SECURITY_FEATURES_COMPLETED_N: {
        id: 'TR_SECURITY_FEATURES_COMPLETED_N',
        defaultMessage: 'Security ({n} of {m})',
    },
    TR_DASHBOARD: {
        id: 'TR_DASHBOARD',
        defaultMessage: 'Dashboard',
    },
    TR_WALLET: {
        id: 'TR_WALLET',
        defaultMessage: 'Accounts',
    },
    TR_NOTIFICATIONS: {
        id: 'TR_NOTIFICATIONS',
        defaultMessage: 'Activity',
    },
    TR_PERSONALIZATION: {
        id: 'TR_PERSONALIZATION',
        defaultMessage: 'Customization',
    },
    TR_ADVANCED: {
        id: 'TR_ADVANCED',
        defaultMessage: 'Danger area',
    },
    TR_BACKUP_CREATED: {
        id: 'TR_BACKUP_CREATED',
        defaultMessage: 'Wallet backup complete',
    },
    TR_FIRMWARE_STATUS_INSTALLATION_COMPLETED: {
        id: 'TR_FIRMWARE_STATUS_INSTALLATION_COMPLETED',
        defaultMessage: 'Completed',
    },
    TR_FIRMWARE_IS_UP_TO_DATE: {
        id: 'TR_FIRMWARE_IS_UP_TO_DATE',
        defaultMessage: 'Firmware ready',
    },
    TR_REBOOT_INTO_BOOTLOADER: {
        id: 'TR_REBOOT_INTO_BOOTLOADER',
        defaultMessage: 'Update Trezor firmware',
    },
    TR_RECONNECT_IN_BOOTLOADER: {
        id: 'TR_RECONNECT_IN_BOOTLOADER',
        defaultMessage: 'Reconnect your Trezor in bootloader mode',
    },
    TR_RECONNECT_IN_BOOTLOADER_SUCCESS: {
        id: 'TR_RECONNECT_IN_BOOTLOADER_SUCCESS',
        defaultMessage: 'Device is now ready',
    },
    TR_RECONNECT_IN_NORMAL: {
        id: 'TR_RECONNECT_IN_NORMAL',
        defaultMessage: 'Reconnect your device',
    },
    TR_VERSION: {
        id: 'TR_VERSION',
        defaultMessage: 'Version {version}',
    },
    TR_INSTALLING: {
        id: 'TR_INSTALLING',
        defaultMessage: 'Installing firmware',
        description: 'One of states during firmware update. Waiting for install to finish',
    },
    TR_DOWNLOADING: {
        id: 'TR_DOWNLOADING',
        defaultMessage: 'Downloading',
        description: 'Indicating that app is downloading data from external source',
    },
    TR_VERIFYING_SIGNATURE: {
        id: 'TR_VERIFYING_SIGNATURE',
        defaultMessage: 'Verifying signature',
        description: 'Indicating that app is verifying the signature of a file',
    },
    TR_SECURITY_CHECKPOINT_GOT_SEED: {
        id: 'TR_SECURITY_CHECKPOINT_GOT_SEED',
        defaultMessage: 'Do you have your wallet backup?',
    },
    TR_BEFORE_ANY_FURTHER_ACTIONS: {
        id: 'TR_BEFORE_ANY_FURTHER_ACTIONS',
        defaultMessage:
            'Although unlikely, you may need to access your wallet backup in case of a firmware update issue.',
    },
    TR_CONTINUE_ONLY_WITH_SEED: {
        id: 'TR_CONTINUE_ONLY_WITH_SEED',
        defaultMessage: 'Continue only if you have your wallet backup',
    },
    TR_CONTINUE_ONLY_WITH_SEED_DESCRIPTION: {
        id: 'TR_CONTINUE_ONLY_WITH_SEED_DESCRIPTION',
        defaultMessage:
            "If you don't have your wallet backup, not even Trezor Support can help you recover your funds if your device is reset. If you have multiple wallet backups, make sure that you have the correct one ready and easily accessible to recover this specific Trezor device.",
    },
    TR_CONTINUE_ONLY_WITH_SEED_DESCRIPTION_2: {
        id: 'TR_CONTINUE_ONLY_WITH_SEED_DESCRIPTION_2',
        defaultMessage:
            'Before you continue, <button>check your backup in Settings</button>. This is an easy way to check and verify your wallet backup.',
    },
    TR_SWITCH_FIRMWARE_NO_BACKUP: {
        id: 'TR_SWITCH_FIRMWARE_NO_BACKUP',
        defaultMessage:
            'You may lose access to your coins on this wallet without a wallet backup. If you’re confident that this wallet is empty, proceed, but do so at your own risk.',
    },
    TR_SWITCH_FIRMWARE_NO_BACKUP_2: {
        id: 'TR_SWITCH_FIRMWARE_NO_BACKUP_2',
        defaultMessage:
            'In all cases, we strongly recommend <button>creating a wallet backup in Settings</button>. With a wallet backup, your coins are safe and secure even if your Trezor is lost, damaged, or stolen.',
    },
    TR_IMPORTANT: {
        id: 'TR_IMPORTANT',
        defaultMessage: 'Important!',
    },
    TR_FIRMWARE_SWITCH_WARNING_1: {
        id: 'TR_FIRMWARE_SWITCH_WARNING_1',
        defaultMessage:
            'Switching firmware <b>wipes all your device data</b>, including wallets, keys, and accounts.',
    },
    TR_FIRMWARE_SWITCH_WARNING_2: {
        id: 'TR_FIRMWARE_SWITCH_WARNING_2',
        defaultMessage:
            'To regain access to your coins, you must <b>recover your wallet using your wallet backup</b>. Ensure your wallet backup is accessible and legible.',
    },
    TR_FIRMWARE_SWITCH_WARNING_3: {
        id: 'TR_FIRMWARE_SWITCH_WARNING_3',
        defaultMessage:
            "If you don't have your wallet backup, there's no way to recover your coins!",
    },
    TR_READ_AND_UNDERSTOOD: {
        id: 'TR_READ_AND_UNDERSTOOD',
        defaultMessage: "I've read and understood the above",
    },
    TR_WIPE_AND_REINSTALL: {
        id: 'TR_WIPE_AND_REINSTALL',
        defaultMessage: 'Wipe device & reinstall',
    },
    TR_DISCREET: {
        id: 'TR_DISCREET',
        defaultMessage: 'Discreet',
    },
    TR_TOR: {
        id: 'TR_TOR',
        defaultMessage: 'Tor',
    },
    TR_COULD_NOT_RETRIEVE_DATA: {
        id: 'TR_COULD_NOT_RETRIEVE_DATA',
        defaultMessage: 'Could not retrieve data',
    },
    TR_HELP: {
        id: 'TR_HELP',
        defaultMessage: 'Support',
    },
    TR_HEX_FORMAT: {
        id: 'TR_HEX_FORMAT',
        defaultMessage: 'Hex format',
    },
    TR_DISABLE_WEBUSB_TRY_BRIDGE: {
        id: 'TR_DISABLE_WEBUSB_TRY_BRIDGE',
        defaultMessage: 'Disable WebUSB and use Bridge',
        describe:
            'Bridge is a communication deamon that some users will need to download and install. So word bridge should not be translated.',
    },
    TR_YOUR_DEVICE_IS_SEEDLESS: {
        id: 'TR_YOUR_DEVICE_IS_SEEDLESS',
        defaultMessage: "Your device is in seedless mode and can't be used with this wallet.",
    },
    TR_DEVICE_NOT_INITIALIZED: {
        id: 'TR_DEVICE_NOT_INITIALIZED',
        defaultMessage: 'Trezor is not set up',
        description:
            'Device not initialized means that it has no cryptographic secret lives in it and it must be either recovered from seed or newly generated.',
    },
    TR_DEVICE_NOT_INITIALIZED_TEXT: {
        id: 'TR_DEVICE_NOT_INITIALIZED_TEXT',
        defaultMessage: "We'll guide you through the process and get you started right away.",
    },
    TR_GO_TO_ONBOARDING: {
        id: 'TR_GO_TO_ONBOARDING',
        defaultMessage: 'Begin setup',
    },
    TR_GO_TO_SETTINGS: {
        id: 'TR_GO_TO_SETTINGS',
        defaultMessage: 'Go to settings',
    },
    TR_NO_FIRMWARE: {
        id: 'TR_NO_FIRMWARE',
        defaultMessage: 'Firmware not installed',
    },
    TR_NO_FIRMWARE_EXPLAINED: {
        id: 'TR_NO_FIRMWARE_EXPLAINED',
        defaultMessage: 'You need to install firmware before using your device.',
    },
    TR_UNKNOWN_DEVICE: {
        id: 'TR_UNKNOWN_DEVICE',
        defaultMessage: 'Unknown device',
    },
    TR_SEE_DETAILS: {
        id: 'TR_SEE_DETAILS',
        defaultMessage: 'See details',
    },
    TR_FIRMWARE_UPDATE_REQUIRED_EXPLAINED: {
        id: 'TR_FIRMWARE_UPDATE_REQUIRED_EXPLAINED',
        defaultMessage:
            'Your device has firmware that is no longer supported. You will need to update it.',
    },
    TR_DEVICE_IN_BOOTLOADER: {
        id: 'TR_DEVICE_IN_BOOTLOADER',
        defaultMessage: 'The device is in bootloader mode.',
    },
    TR_LOCALIZATION: {
        id: 'TR_LOCALIZATION',
        defaultMessage: 'Localization',
        description: 'Used as language localization (translation of the application)',
    },
    TR_APP: {
        id: 'TR_APP',
        defaultMessage: 'App',
        description: 'Application shorthand name',
    },
    TR_APPLICATION: {
        id: 'TR_APPLICATION',
        defaultMessage: 'Application',
        description: 'Computer program.',
    },
    TR_LABEL_REQUIREMENTS: {
        id: 'TR_LABEL_REQUIREMENTS',
        defaultMessage:
            'Names can have a maximum length of {length} characters and can only include characters from the English alphabet.',
        description: 'How many characters may be in device label and of what type.',
    },
    TR_LABEL_ERROR_LENGTH: {
        id: 'TR_LABEL_ERROR_LENGTH',
        defaultMessage: 'Must be {length} characters or less',
    },
    TR_LABEL_ERROR_CHARACTERS: {
        id: 'TR_LABEL_ERROR_CHARACTERS',
        defaultMessage: 'Unsupported characters',
        description: 'Device name can only use standard ASCII characters',
    },
    TR_I_HAVE_ENOUGH_TIME_TO_DO: {
        id: 'TR_I_HAVE_ENOUGH_TIME_TO_DO',
        defaultMessage: 'You have enough time to back up your wallet',
    },
    TR_ONCE_YOU_BEGIN_THIS_PROCESS: {
        id: 'TR_ONCE_YOU_BEGIN_THIS_PROCESS',
        defaultMessage:
            "This process only takes a few minutes, but you can't pause or restart it once you begin.",
    },
    TR_I_AM_IN_SAFE_PRIVATE_OR: {
        id: 'TR_I_AM_IN_SAFE_PRIVATE_OR',
        defaultMessage: 'You are in a safe, private space or in a public space away from cameras',
    },
    TR_MAKE_SURE_NO_ONE_CAN_PEEK: {
        id: 'TR_MAKE_SURE_NO_ONE_CAN_PEEK',
        defaultMessage:
            'Ensure that nobody can see your screen over your shoulder, and no cameras can capture it. Your wallet backup should remain confidential and seen only by you.',
    },
    TR_I_UNDERSTAND_SEED_IS_IMPORTANT: {
        id: 'TR_I_UNDERSTAND_SEED_IS_IMPORTANT',
        defaultMessage: 'You are responsible for keeping your backup safe',
    },
    TR_BACKUP_SEED_IS_ULTIMATE: {
        id: 'TR_BACKUP_SEED_IS_ULTIMATE',
        defaultMessage:
            "If you ever need to restore your wallet to access your funds, it's necessary to have your wallet backup with you. Don’t lose or misplace it. Once it's gone, it's gone. No one can help you recover it, not even Trezor Support. Be responsible and ensure that you store your wallet backup securely, treating it as if your life depends on it.",
    },
    TR_FIRMWARE_IS_POTENTIALLY_RISKY: {
        id: 'TR_FIRMWARE_IS_POTENTIALLY_RISKY',
        defaultMessage:
            "Updating firmware poses potential risks. If anything goes wrong (such as a compromised cable), the device could be wiped, which means you'll have to recover your wallet using your wallet backup.",
    },
    ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_HEADING: {
        id: 'ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_HEADING',
        defaultMessage: 'You are using a different Trezor',
    },
    ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_P1: {
        id: 'ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_P1',
        defaultMessage:
            "This isn't the same Trezor you've been using. Please reconnect the right one.",
    },
    ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_P2: {
        id: 'ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_P2',
        defaultMessage: 'If you want to use this device instead, please start again.',
    },
    TR_GO_TO_SUITE: {
        id: 'TR_GO_TO_SUITE',
        defaultMessage: 'Access Suite',
    },
    TR_ONBOARDING_CREATE_NEW_WALLET: {
        id: 'TR_ONBOARDING_CREATE_NEW_WALLET',
        defaultMessage: 'Create new wallet',
    },
    TR_ONBOARDING_SELECTED_OPTIMAL_BACKUP_TYPE: {
        id: 'TR_ONBOARDING_SELECTED_OPTIMAL_BACKUP_TYPE',
        defaultMessage:
            "We've selected the <primary>optimal backup type</primary> for your wallet.",
    },
    TR_ONBOARDING_SELECTED_DEFAULT_BACKUP_TYPE: {
        id: 'TR_ONBOARDING_SELECTED_DEFAULT_BACKUP_TYPE',
        defaultMessage:
            "We've selected the <primary>default backup type</primary> for your wallet based on your device.",
    },
    TR_ONBOARDING_WILL_CREATE_BACKUP_TYPE: {
        id: 'TR_ONBOARDING_WILL_CREATE_BACKUP_TYPE',
        defaultMessage:
            'Trezor will create your wallet based on<br></br>the selected wallet backup type.',
    },
    TR_ONBOARDING_BACKUP_TYPE: {
        id: 'TR_ONBOARDING_BACKUP_TYPE',
        defaultMessage: 'Backup type',
    },
    TR_ONBOARDING_SEED_TYPE_SINGLE_SEED: {
        id: 'TR_ONBOARDING_SEED_TYPE_SINGLE_SEED',
        defaultMessage: 'Single-share Backup',
    },
    TR_ONBOARDING_SEED_TYPE_SINGLE_SEED_DESCRIPTION: {
        id: 'TR_ONBOARDING_SEED_TYPE_SINGLE_SEED_DESCRIPTION',
        defaultMessage:
            'Generates a single set of 20 words that recovers your wallet. This backup type is upgradable to Multi-share Backup whenever you’re ready.',
    },
    TR_ONBOARDING_SEED_TYPE_ADVANCED: {
        id: 'TR_ONBOARDING_SEED_TYPE_ADVANCED',
        defaultMessage: 'Multi-share Backup',
    },
    TR_ONBOARDING_SEED_TYPE_ADVANCED_DESCRIPTION: {
        id: 'TR_ONBOARDING_SEED_TYPE_ADVANCED_DESCRIPTION',
        defaultMessage:
            'Generates multiple 20-word shares (wordlists) to recover your wallet. Set a minimum recovery number then distribute shares to trusted individuals or hide them securely. When needed, collect the required number of shares to regain access to your wallet.',
    },
    TR_ONBOARDING_SEED_TYPE_12_WORDS: {
        id: 'TR_ONBOARDING_SEED_TYPE_12_WORDS',
        defaultMessage: '12-word Backup',
    },
    TR_ONBOARDING_SEED_TYPE_24_WORDS: {
        id: 'TR_ONBOARDING_SEED_TYPE_24_WORDS',
        defaultMessage: '24-word Backup',
    },
    TR_ONBOARDING_BACKUP_TYPE_DEFAULT: {
        id: 'TR_ONBOARDING_BACKUP_TYPE_DEFAULT',
        defaultMessage: 'Default',
    },
    TR_ONBOARDING_BACKUP_TYPE_ADVANCED: {
        id: 'TR_ONBOARDING_BACKUP_TYPE_ADVANCED',
        defaultMessage: 'Advanced',
    },
    TR_ONBOARDING_BACKUP_CATEGORY_20_WORD_BACKUPS: {
        id: 'TR_ONBOARDING_BACKUP_CATEGORY_20_WORD_BACKUPS',
        defaultMessage: '20-word backup types',
    },
    TR_ONBOARDING_BACKUP_TYPE_UPGRADABLE_TO_MULTI: {
        id: 'TR_ONBOARDING_BACKUP_TYPE_UPGRADABLE_TO_MULTI',
        defaultMessage: 'Upgradable to Multi-share Backup',
    },
    TR_ONBOARDING_BACKUP_TYPE_12_WORDS_DEFAULT_NOTE: {
        id: 'TR_ONBOARDING_BACKUP_TYPE_12_WORDS_DEFAULT_NOTE',
        defaultMessage:
            "Generates a single set of 12 words that fits on your device's wallet backup card (recovery seed card), making it easy to write down accurately.",
    },
    TR_ONBOARDING_BACKUP_TYPE_12_DEFAULT_TOOLTIP: {
        id: 'TR_ONBOARDING_BACKUP_TYPE_12_DEFAULT_TOOLTIP',
        defaultMessage: 'Default is the recommended option for your Trezor device.',
    },
    TR_THESE_WONT_ALLOW_YOU_UPGRADE_HEADER: {
        id: 'TR_THESE_WONT_ALLOW_YOU_UPGRADE_HEADER',
        defaultMessage: 'Secure & reliable, not easily upgradable to Multi-share Backup',
    },
    TR_THESE_WONT_ALLOW_YOU_UPGRADE: {
        id: 'TR_THESE_WONT_ALLOW_YOU_UPGRADE',
        defaultMessage:
            "Generates a single set of 12 or 24 words that can be used to recover your wallet. Legacy backups can't be easily upgraded to a Multi-share Backup. <a>Read more</a>",
    },
    TR_CREATE_WALLET_DEFAULT_OPTION_DISABLED_TOOLTIP: {
        id: 'TR_CREATE_WALLET_DEFAULT_OPTION_DISABLED_TOOLTIP',
        defaultMessage: 'Update your device firmware to enable the Single-share Backup feature.',
    },
    TR_CREATE_WALLET_DEFAULT_OPTION_TOOLTIP: {
        id: 'TR_CREATE_WALLET_DEFAULT_OPTION_TOOLTIP',
        defaultMessage: 'Recommended option for a simple, flexible setup.',
    },
    TR_ONBOARDING_BACKUP_OLDER_BACKUP_TYPES_SHORT: {
        id: 'TR_ONBOARDING_BACKUP_OLDER_BACKUP_TYPES_SHORT',
        defaultMessage: 'Legacy backup types',
    },
    TR_ONBOARDING_BACKUP_LEGACY_WARNING: {
        id: 'TR_ONBOARDING_BACKUP_LEGACY_WARNING',
        defaultMessage:
            "This can't be directly upgraded to Multi-share Backup. To allow for seamless upgrades, use the default Single-share Backup.",
    },
    TR_ONBOARDING_BACKUP_SHAMIR_WARNING: {
        id: 'TR_ONBOARDING_BACKUP_SHAMIR_WARNING',
        defaultMessage:
            "This backup type allows for <strong>future upgrades</strong> but includes 20 words, which <strong>won't fit</strong> on the 12-word paper card packaged with your device. <strong>Write them in numbered order on durable paper and don’t store them digitally.</strong>",
    },
    TR_ONBOARDING_CANNOT_SELECT_SEED_TYPE: {
        id: 'TR_ONBOARDING_CANNOT_SELECT_SEED_TYPE',
        defaultMessage: 'Trezor will create your new wallet.',
    },
    TR_ONBOARDING_SELECT_SEED_TYPE_CONFIRM: {
        id: 'TR_ONBOARDING_SELECT_SEED_TYPE_CONFIRM',
        defaultMessage: 'Create wallet',
    },
    TR_CREATE_WALLET: {
        id: 'TR_CREATE_WALLET',
        defaultMessage: 'Create new wallet',
        description:
            'Used for button triggering seed creation (reset device call) if shamir/non-shamir selection is not available.',
    },
    TR_CHECK_FINGERPRINT: {
        id: 'TR_CHECK_FINGERPRINT',
        defaultMessage: 'Check fingerprint',
        description:
            'This appears when updating some ancient firmwares. Fingerprint is cryptographic signature of the target firmware.',
    },
    TR_ONBOARDING_NEW_FW_DESCRIPTION: {
        id: 'TR_ONBOARDING_NEW_FW_DESCRIPTION',
        defaultMessage:
            'New firmware is now available. Update your device now or do it in Trezor Suite once you have finished setting up your device.',
    },
    TR_FIRMWARE_NEW_FW_DESCRIPTION: {
        id: 'TR_FIRMWARE_NEW_FW_DESCRIPTION',
        defaultMessage: 'New firmware is now available. Update your device now.',
    },
    TR_FIRMWARE_REINSTALL_FW_DESCRIPTION: {
        id: 'TR_FIRMWARE_REINSTALL_FW_DESCRIPTION',
        defaultMessage:
            'Your device is already updated to the latest firmware. You may reinstall the firmware if needed.',
    },
    TR_SWITCH_TO_BITCOIN_ONLY_DESCRIPTION: {
        id: 'TR_SWITCH_TO_BITCOIN_ONLY_DESCRIPTION',
        defaultMessage:
            '{bitcoinOnly} firmware only works with Bitcoin transactions. If you want to access and manage all of your coins, just switch your device firmware back to {regular} anytime by using your wallet backup.',
    },
    TR_SWITCH_TO_REGULAR_DESCRIPTION: {
        id: 'TR_SWITCH_TO_REGULAR_DESCRIPTION',
        defaultMessage:
            "{regular} firmware allows your device to access and manage all of your coins. {bitcoinOnly} firmware only works with Bitcoin transactions. You can change your device's firmware at anytime by using your wallet backup.",
    },
    TR_BITCOIN_ONLY_UNAVAILABLE: {
        id: 'TR_BITCOIN_ONLY_UNAVAILABLE',
        defaultMessage:
            'Before switching to {bitcoinOnly}, you need to upgrade your firmware to the latest version.',
    },
    TR_EXPERIMENTAL_FEATURES: {
        id: 'TR_EXPERIMENTAL_FEATURES',
        defaultMessage: 'Experimental',
        description: 'Section title for Early Access program so far',
    },
    TR_EXPERIMENTAL_FEATURES_ALLOW: {
        id: 'TR_EXPERIMENTAL_FEATURES_ALLOW',
        defaultMessage: 'Experimental features',
    },
    TR_EXPERIMENTAL_FEATURES_WARNING: {
        id: 'TR_EXPERIMENTAL_FEATURES_WARNING',
        defaultMessage:
            'For experienced users only. Use at your own risk. These features are in testing, may be unstable, and might not have long-term support.',
    },
    TR_EXPERIMENTAL_OP_ETHEREUM: {
        id: 'TR_EXPERIMENTAL_OP_ETHEREUM',
        defaultMessage: 'Optimism',
    },
    TR_EXPERIMENTAL_OP_ETHEREUM_DESCRIPTION: {
        id: 'TR_EXPERIMENTAL_OP_ETHEREUM_DESCRIPTION',
        defaultMessage:
            'Enables the Optimism network but with wrong symbol OP instead of ETH and minimum gas 1 gwei.',
    },
    TR_EXPERIMENTAL_PASSWORD_MANAGER: {
        id: 'TR_EXPERIMENTAL_PASSWORD_MANAGER',
        defaultMessage: 'Migrate Dropbox passwords',
    },
    TR_EXPERIMENTAL_PASSWORD_MANAGER_DESCRIPTION: {
        id: 'TR_EXPERIMENTAL_PASSWORD_MANAGER_DESCRIPTION',
        defaultMessage:
            'A utility for retrieving passwords stored on Dropbox and secured by Trezor. Designed for previous Chrome extension users of Trezor Password Manager.',
    },
    TR_EXPERIMENTAL_TOR_SNOWFLAKE: {
        id: 'TR_EXPERIMENTAL_TOR_SNOWFLAKE',
        defaultMessage: 'Tor Snowflake',
    },
    TR_EXPERIMENTAL_TOR_SNOWFLAKE_DESCRIPTION: {
        id: 'TR_EXPERIMENTAL_TOR_SNOWFLAKE_DESCRIPTION',
        defaultMessage:
            'Tor Snowflake is a system that allows access to censored websites and apps.',
    },
    TR_EXPERIMENTAL_AUTOMATIC_UPDATE: {
        id: 'TR_EXPERIMENTAL_AUTOMATIC_UPDATE',
        defaultMessage: 'Automatic Trezor Suite updates',
    },
    TR_EXPERIMENTAL_AUTOMATIC_UPDATE_DESCRIPTION: {
        id: 'TR_EXPERIMENTAL_AUTOMATIC_UPDATE_DESCRIPTION',
        defaultMessage:
            "Trezor Suite automatically downloads the latest version in the background and installs it when restarting the app. This ensures you're always up-to-date with the latest features and security patches. Updates occur without requiring your permission.",
    },
    TR_EARLY_ACCESS: {
        id: 'TR_EARLY_ACCESS',
        defaultMessage: 'Early Access Program',
    },
    TR_EARLY_ACCESS_ENABLED: {
        id: 'TR_EARLY_ACCESS_ENABLED',
        defaultMessage: 'Early Access Program enabled',
        description: 'Title in settings if Early Access is active.',
    },
    TR_EARLY_ACCESS_MENU: {
        id: 'TR_EARLY_ACCESS_MENU',
        defaultMessage: 'Early Access Program',
        description: 'Shown on small screen only next to the icon in menu.',
    },
    TR_EARLY_ACCESS_DESCRIPTION: {
        id: 'TR_EARLY_ACCESS_DESCRIPTION',
        defaultMessage:
            "Test the latest product features before they're released to all Trezor users.",
    },
    TR_EARLY_ACCESS_DESCRIPTION_ENABLED: {
        id: 'TR_EARLY_ACCESS_DESCRIPTION_ENABLED',
        defaultMessage: 'Leave if you no longer want priority access to new features.',
    },
    TR_EARLY_ACCESS_ENABLE: {
        id: 'TR_EARLY_ACCESS_ENABLE',
        defaultMessage: 'Join',
    },
    TR_EARLY_ACCESS_STAY_IN: {
        id: 'TR_EARLY_ACCESS_STAY_IN',
        defaultMessage: 'Stay in',
    },
    TR_EARLY_ACCESS_DISABLE: {
        id: 'TR_EARLY_ACCESS_DISABLE',
        defaultMessage: 'Leave',
    },
    TR_EARLY_ACCESS_ENABLE_CONFIRM: {
        id: 'TR_EARLY_ACCESS_ENABLE_CONFIRM',
        defaultMessage: 'Join',
    },
    TR_EARLY_ACCESS_ENABLE_CONFIRM_TITLE: {
        id: 'TR_EARLY_ACCESS_ENABLE_CONFIRM_TITLE',
        defaultMessage: 'Try out the latest product features before release to the general public.',
    },
    TR_EARLY_ACCESS_ENABLE_CONFIRM_DESCRIPTION: {
        id: 'TR_EARLY_ACCESS_ENABLE_CONFIRM_DESCRIPTION',
        defaultMessage: 'You can turn it off anytime.',
    },
    TR_EARLY_ACCESS_ENABLE_CONFIRM_CHECK: {
        id: 'TR_EARLY_ACCESS_ENABLE_CONFIRM_CHECK',
        defaultMessage:
            'I understand this allows me to test pre-release software, which may contain errors that affect the normal operation of Suite.',
    },
    TR_EARLY_ACCESS_ENABLE_CONFIRM_TOOLTIP: {
        id: 'TR_EARLY_ACCESS_ENABLE_CONFIRM_TOOLTIP',
        defaultMessage: 'Check the field above first',
    },
    TR_EARLY_ACCESS_JOINED_TITLE: {
        id: 'TR_EARLY_ACCESS_JOINED_TITLE',
        defaultMessage: 'Early Access Program enabled',
    },
    TR_EARLY_ACCESS_JOINED_DESCRIPTION: {
        id: 'TR_EARLY_ACCESS_JOINED_DESCRIPTION',
        defaultMessage: 'You can either check for beta updates now or on the next launch.',
    },
    TR_EARLY_ACCESS_SKIP_CHECK: {
        id: 'TR_EARLY_ACCESS_SKIP_CHECK',
        defaultMessage: 'Check on next launch',
    },
    TR_EARLY_ACCESS_CHECK_UPDATE: {
        id: 'TR_EARLY_ACCESS_CHECK_UPDATE',
        defaultMessage: 'Check for updates now',
    },
    TR_EARLY_ACCESS_LEFT_TITLE: {
        id: 'TR_EARLY_ACCESS_LEFT_TITLE',
        defaultMessage:
            "You've left the Early Access Program. Beta releases are no longer offered.",
    },
    TR_EARLY_ACCESS_LEFT_DESCRIPTION: {
        id: 'TR_EARLY_ACCESS_LEFT_DESCRIPTION',
        defaultMessage:
            'To downgrade to the latest stable release of Suite, please click "Download stable" and reinstall the app.',
    },
    TR_EARLY_ACCESS_SKIP_REINSTALL: {
        id: 'TR_EARLY_ACCESS_SKIP_REINSTALL',
        defaultMessage: 'Close',
        description:
            "User already left EAP, just don't want to download latest stable release now.",
    },
    TR_EARLY_ACCESS_REINSTALL: {
        id: 'TR_EARLY_ACCESS_REINSTALL',
        defaultMessage: 'Download stable',
    },
    TR_EARLY_ACCESS_DISABLE_CONFIRM_TITLE: {
        id: 'TR_EARLY_ACCESS_DISABLE_CONFIRM_TITLE',
        defaultMessage: 'Are you sure you want to leave the Early Access Program?',
    },
    TR_EARLY_ACCESS_DISABLE_CONFIRM_DESCRIPTION: {
        id: 'TR_EARLY_ACCESS_DISABLE_CONFIRM_DESCRIPTION',
        defaultMessage: 'Click "Leave" to stop checking for beta releases',
    },
    TR_EXPORT_TO_FILE: {
        id: 'TR_EXPORT_TO_FILE',
        defaultMessage: 'Export to file',
    },
    LOG_INCLUDE_BALANCE_TITLE: {
        id: 'LOG_INCLUDE_BALANCE_TITLE',
        defaultMessage: 'Include sensitive information',
    },
    LOG_INCLUDE_BALANCE_DESCRIPTION: {
        id: 'LOG_INCLUDE_BALANCE_DESCRIPTION',
        defaultMessage:
            'Enabling this option includes sensitive information such as balance, transaction IDs, device labels, device ID, and public addresses in the application log. If your issue is unrelated, disable it.',
    },
    LOG_DESCRIPTION: {
        id: 'LOG_DESCRIPTION',
        defaultMessage:
            'This log contains essential technical information about Trezor Suite and may be needed when contacting Trezor Support.',
    },
    TR_RESTORE_EXISTING_WALLET: {
        id: 'TR_RESTORE_EXISTING_WALLET',
        defaultMessage: 'Recover wallet',
    },
    TR_RECEIVED: {
        id: 'TR_RECEIVED',
        defaultMessage: 'Received',
        description: 'Used in graph tooltip: Received x USD/BTC',
    },
    TR_SENT: {
        id: 'TR_SENT',
        defaultMessage: 'Sent',
        description: 'Used in graph tooltip: Sent x USD/BTC',
    },
    TR_SWITCH_TO_BOOTLOADER_HOLD_BOTH_BUTTONS: {
        id: 'TR_SWITCH_TO_BOOTLOADER_HOLD_BOTH_BUTTONS',
        defaultMessage: 'Press and hold both buttons while connecting the USB cable.',
    },
    TR_SWITCH_TO_BOOTLOADER_HOLD_LEFT_BUTTON: {
        id: 'TR_SWITCH_TO_BOOTLOADER_HOLD_LEFT_BUTTON',
        defaultMessage: 'Press and hold the left button while connecting the USB cable.',
    },
    TR_SWITCH_TO_BOOTLOADER_SWIPE_YOUR_FINGERS: {
        id: 'TR_SWITCH_TO_BOOTLOADER_SWIPE_YOUR_FINGERS',
        defaultMessage: 'Swipe your finger across the touchscreen while connecting the USB cable.',
    },
    BACKUP_BACKUP_ALREADY_FINISHED_HEADING: {
        id: 'BACKUP_BACKUP_ALREADY_FINISHED_HEADING',
        defaultMessage: 'Backup already finished',
    },
    BACKUP_BACKUP_ALREADY_FINISHED_DESCRIPTION: {
        id: 'BACKUP_BACKUP_ALREADY_FINISHED_DESCRIPTION',
        defaultMessage:
            'Connected device has already been backed up. You should have the wallet backup written down and hidden in a safe place.',
    },
    BACKUP_BACKUP_ALREADY_FAILED_HEADING: {
        id: 'BACKUP_BACKUP_ALREADY_FAILED_HEADING',
        defaultMessage: 'Backup failed',
    },
    BACKUP_BACKUP_ALREADY_FAILED_DESCRIPTION: {
        id: 'BACKUP_BACKUP_ALREADY_FAILED_DESCRIPTION',
        defaultMessage:
            'A previous attempt to backup this device failed. Device backup may be done only once.',
    },
    DISCONNECT_DEVICE_DESCRIPTION: {
        id: 'DISCONNECT_DEVICE_DESCRIPTION',
        defaultMessage: 'Your device was wiped and no longer holds any private keys.',
    },
    TR_MY_ACCOUNTS: {
        id: 'TR_MY_ACCOUNTS',
        defaultMessage: 'My accounts',
    },
    TR_CHANGE_HOMESCREEN: {
        id: 'TR_CHANGE_HOMESCREEN',
        defaultMessage: 'Change homescreen',
    },
    TR_DROP_IMAGE: {
        id: 'TR_DROP_IMAGE',
        defaultMessage: 'Drop image',
    },
    TR_CUSTOM_HOMESCREEN: {
        id: 'TR_CUSTOM_HOMESCREEN',
        defaultMessage: 'Custom homescreen uploaded',
    },
    IMAGE_VALIDATION_ERROR_INVALID_FORMAT_ONLY_PNG_JPG: {
        id: 'IMAGE_VALIDATION_ERROR_INVALID_FORMAT_ONLY_PNG_JPG',
        defaultMessage: 'Invalid file selected. Must be .jpg or .png',
    },
    IMAGE_VALIDATION_ERROR_INVALID_FORMAT_ONLY_JPG: {
        id: 'IMAGE_VALIDATION_ERROR_INVALID_FORMAT_ONLY_JPG',
        defaultMessage: 'Invalid file selected. Must be .jpg',
    },
    IMAGE_VALIDATION_ERROR_INVALID_DIMENSIONS: {
        id: 'IMAGE_VALIDATION_ERROR_INVALID_DIMENSIONS',
        defaultMessage: 'Invalid dimensions (Image must be {width} x {height} px)',
    },
    IMAGE_VALIDATION_ERROR_INVALID_SIZE: {
        id: 'IMAGE_VALIDATION_ERROR_INVALID_SIZE_JPG',
        defaultMessage: 'Invalid size (Image must be less than 16KB)',
    },
    IMAGE_VALIDATION_ERROR_PROGRESSIVE_JPG: {
        id: 'IMAGE_VALIDATION_ERROR_PROGRESSIVE_JPG',
        defaultMessage: 'Progressive JPG image format is not supported.',
    },
    IMAGE_VALIDATION_ERROR_UNEXPECTED_ALPHA: {
        id: 'IMAGE_VALIDATION_ERROR_UNEXPECTED_ALPHA',
        defaultMessage: 'Invalid image format. It must not contain transparencies.',
    },
    IMAGE_VALIDATION_ERROR_INVALID_COLOR_COMBINATION: {
        id: 'IMAGE_VALIDATION_ERROR_INVALID_COLOR_COMBINATION',
        defaultMessage:
            'Invalid image color. It must contain only black and white (not grayscale).',
    },
    TR_CONFIRM_ON_TREZOR: {
        id: 'TR_CONFIRM_ON_TREZOR',
        defaultMessage: 'Confirm on Trezor',
    },
    TR_CONFIRM_BEFORE_COPY: {
        id: 'TR_CONFIRM_BEFORE_COPY',
        defaultMessage: 'Confirm on Trezor before copying',
    },
    TR_QR_RECEIVE_ADDRESS_CONFIRM: {
        id: 'TR_QR_RECEIVE_ADDRESS_CONFIRM',
        defaultMessage: 'Confirm on Trezor before scanning',
    },
    TR_QR_RECEIVE_ADDRESS_CONFIRM_EXPLANATION: {
        id: 'TR_QR_RECEIVE_ADDRESS_CONFIRM_EXPLANATION',
        defaultMessage:
            "Please confirm the receiving address on your Trezor device first, as its trusted display can't be hacked.",
    },
    TR_MY_ASSETS: {
        id: 'TR_MY_ASSETS',
        defaultMessage: 'Assets',
    },
    TR_ON: {
        id: 'TR_ON',
        defaultMessage: 'on',
    },
    TR_OFF: {
        id: 'TR_OFF',
        defaultMessage: 'off',
    },
    TR_COULD_NOT_RETRIEVE_CHANGELOG: {
        id: 'TR_COULD_NOT_RETRIEVE_CHANGELOG',
        defaultMessage: 'Could not retrieve the changelog',
    },
    TR_NAV_TRADE: {
        id: 'TR_NAV_TRADE',
        defaultMessage: 'Trade',
    },
    TR_NAV_BUY: {
        id: 'TR_NAV_BUY',
        defaultMessage: 'Buy',
    },
    TR_NAV_DCA: {
        id: 'TR_NAV_DCA',
        defaultMessage: 'DCA',
    },
    TR_NAV_SELL: {
        id: 'TR_NAV_SELL',
        defaultMessage: 'Sell',
    },
    TR_NAV_SIGN_VERIFY: {
        id: 'TR_NAV_SIGN_VERIFY',
        defaultMessage: 'Sign/Verify message',
    },
    TR_BALANCE: {
        id: 'TR_BALANCE',
        defaultMessage: 'Balance',
    },
    TR_MY_PORTFOLIO: {
        id: 'TR_MY_PORTFOLIO',
        defaultMessage: 'Portfolio',
    },
    TR_ALL_TRANSACTIONS: {
        id: 'TR_ALL_TRANSACTIONS',
        defaultMessage: 'Transactions',
    },
    TR_TOKEN: {
        id: 'TR_TOKEN',
        defaultMessage: 'Token',
    },
    TR_TOKENS: {
        id: 'TR_TOKENS',
        defaultMessage: 'Tokens',
    },
    TR_TOKENS_EMPTY: {
        id: 'TR_TOKENS_EMPTY',
        defaultMessage: 'No tokens... yet.',
    },
    TR_TOKENS_EMPTY_CHECK_HIDDEN: {
        id: 'TR_TOKENS_EMPTY_CHECK_HIDDEN',
        defaultMessage: 'No tokens. They may be hidden.',
    },
    TR_HIDDEN_TOKENS_EMPTY: {
        id: 'TR_HIDDEN_TOKENS_EMPTY',
        defaultMessage: 'You have no hidden tokens.',
    },
    TR_ADD_TOKEN_TITLE: {
        id: 'TR_ADD_TOKEN_TITLE',
        defaultMessage: 'Add ERC20 token',
    },
    TR_ADD_TOKEN_LABEL: {
        id: 'TR_ADD_TOKEN_LABEL',
        defaultMessage: 'Token address',
    },
    TR_ADD_TOKEN_SUBMIT: {
        id: 'TR_ADD_TOKEN_SUBMIT',
        defaultMessage: 'Add token',
    },
    TR_ADD_TOKEN_ADDRESS_NOT_VALID: {
        id: 'TR_ADD_TOKEN_ADDRESS_NOT_VALID',
        defaultMessage: 'Invalid address',
    },
    TR_ADD_TOKEN_TOKEN_NOT_VALID: {
        id: 'TR_ADD_TOKEN_TOKEN_NOT_VALID',
        defaultMessage: "This doesn't look like a valid token",
    },
    TR_ADD_TOKEN_ADDRESS_DUPLICATE: {
        id: 'TR_ADD_TOKEN_ADDRESS_DUPLICATE',
        defaultMessage: 'Token address is already added',
    },
    TR_ADD_TOKEN_TOAST_SUCCESS: {
        id: 'TR_ADD_TOKEN_TOAST_SUCCESS',
        defaultMessage: 'Token added',
    },
    TR_ADD_TOKEN_TOAST_ERROR: {
        id: 'TR_ADD_TOKEN_TOAST_ERROR',
        defaultMessage: 'Action failed: {error}',
    },
    TR_BRIDGE_DEV_MODE_START: {
        id: 'TR_BRIDGE_DEV_MODE_START',
        defaultMessage: 'Starting Trezor Bridge on port 21324',
    },
    TR_BRIDGE_DEV_MODE_STOP: {
        id: 'TR_BRIDGE_DEV_MODE_STOP',
        defaultMessage: 'Starting Trezor Bridge on default port',
    },
    TR_TO_ADD_NEW_ACCOUNT_WAIT_FOR_DISCOVERY: {
        id: 'TR_TO_ADD_NEW_ACCOUNT_WAIT_FOR_DISCOVERY',
        defaultMessage: 'Accounts are still loading. Please wait before adding a new one.',
    },
    RECIPIENT_ADDRESS: {
        defaultMessage: 'Address',
        id: 'RECIPIENT_ADDRESS',
    },
    RECIPIENT_SCAN: {
        defaultMessage: 'Scan',
        id: 'RECIPIENT_SCAN',
    },
    RECIPIENT_ADD: {
        id: 'RECIPIENT_ADD',
        defaultMessage: 'Add Recipient',
    },
    RECIPIENT_IS_NOT_SET: {
        defaultMessage: 'Address is not set',
        id: 'RECIPIENT_IS_NOT_SET',
    },
    RECIPIENT_IS_NOT_VALID: {
        defaultMessage: 'Address is not valid',
        id: 'RECIPIENT_IS_NOT_VALID',
    },
    RECIPIENT_REQUIRES_UPDATE: {
        defaultMessage:
            'Taproot is not supported by your firmware version. Please update your device firmware.',
        id: 'RECIPIENT_REQUIRES_UPDATE',
    },
    TR_UNSUPPORTED_ADDRESS_FORMAT: {
        defaultMessage: 'Unsupported address format.',
        id: 'TR_UNSUPPORTED_ADDRESS_FORMAT',
    },
    TR_CONVERT_TO_LOWERCASE: {
        defaultMessage: 'Convert to lowercase',
        id: 'TR_CONVERT_TO_LOWERCASE',
    },
    TR_CONVERT_TO_CHECKSUM_ADDRESS: {
        defaultMessage: 'Convert to checksum',
        id: 'TR_CONVERT_TO_CHECKSUM_ADDRESS',
    },
    RECIPIENT_CANNOT_SEND_TO_MYSELF: {
        defaultMessage: "Can't send to myself",
        id: 'RECIPIENT_CANNOT_SEND_TO_MYSELF',
    },
    AMOUNT: {
        defaultMessage: 'Amount',
        id: 'AMOUNT',
    },
    AMOUNT_SEND_MAX: {
        id: 'AMOUNT_SEND_MAX',
        defaultMessage: 'Send max',
    },
    AMOUNT_IS_NOT_ENOUGH: {
        defaultMessage: 'Not enough funds',
        id: 'AMOUNT_IS_NOT_ENOUGH',
    },
    AMOUNT_EXCEEDS_MAX: {
        defaultMessage: 'The amount exceeds the maximum allowed value of {maxAmount}',
        id: 'AMOUNT_EXCEEDS_MAX',
    },
    AMOUNT_IS_NOT_IN_RANGE_DECIMALS: {
        defaultMessage: 'Maximum {decimals} decimals allowed',
        id: 'AMOUNT_IS_NOT_IN_RANGE_DECIMALS',
    },
    AMOUNT_IS_NOT_INTEGER: {
        defaultMessage: 'Amount is not an integer',
        id: 'AMOUNT_IS_NOT_INTEGER',
    },
    AMOUNT_IS_NOT_SET: {
        defaultMessage: 'Amount is not set',
        id: 'AMOUNT_IS_NOT_SET',
    },
    AMOUNT_IS_TOO_LOW: {
        defaultMessage: 'Amount is too low',
        id: 'AMOUNT_IS_TOO_LOW',
    },
    AMOUNT_IS_BELOW_DUST: {
        defaultMessage: 'Amount must be at least {dust}',
        id: 'AMOUNT_IS_BELOW_DUST',
    },
    AMOUNT_IS_MORE_THAN_RESERVE: {
        defaultMessage: 'Amount is above the required unspendable reserve ({reserve} XRP)',
        id: 'AMOUNT_IS_MORE_THAN_RESERVE',
    },
    AMOUNT_IS_LESS_THAN_RESERVE: {
        defaultMessage: 'Recipient account requires minimum reserve {reserve} XRP to activate',
        id: 'AMOUNT_IS_LESS_THAN_RESERVE',
    },
    AMOUNT_NOT_ENOUGH_CURRENCY_FEE: {
        defaultMessage: 'Not enough {symbol} to cover transaction fee',
        id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
    },
    REMAINING_BALANCE_LESS_THAN_RENT: {
        defaultMessage:
            'After sending this amount, your account will have {remainingSolBalance} SOL remaining. A non-empty account must maintain a balance of more than {rent} SOL.',
        id: 'REMAINING_BALANCE_LESS_THAN_RENT',
    },
    OP_RETURN: {
        id: 'OP_RETURN',
        defaultMessage: 'OP RETURN',
    },
    OP_RETURN_TOOLTIP: {
        id: 'OP_RETURN_TOOLTIP',
        defaultMessage:
            'OP_RETURN can be used for digital asset proof-of-ownership, and has at times been used to convey additional information needed to send transactions.',
    },
    OP_RETURN_ADD: {
        id: 'OP_RETURN_ADD',
        description: 'item in dropdown menu',
        defaultMessage: 'Add OP Return',
    },
    RBF: {
        id: 'RBF',
        defaultMessage: 'RBF',
    },
    LOCKTIME_ADD: {
        id: 'LOCKTIME_ADD',
        defaultMessage: 'Add Locktime',
    },
    LOCKTIME_ADD_TOOLTIP: {
        id: 'LOCKTIME_ADD_TOOLTIP',
        defaultMessage: 'Locktime sets the earliest time a transaction can be mined into a block.',
    },
    LOCKTIME_SCHEDULE_SEND: {
        id: 'LOCKTIME_SCHEDULE_SEND',
        defaultMessage: 'Locktime',
    },
    LOCKTIME_IS_NOT_SET: {
        id: 'LOCKTIME_IS_NOT_SET',
        defaultMessage: 'Locktime not set',
    },
    LOCKTIME_IS_NOT_INTEGER: {
        id: 'LOCKTIME_IS_NOT_INTEGER',
        defaultMessage: 'Locktime is not an integer',
    },
    LOCKTIME_IS_TOO_LOW: {
        id: 'LOCKTIME_IS_TOO_LOW',
        defaultMessage: 'Locktime is too low',
    },
    LOCKTIME_IS_TOO_BIG: {
        id: 'LOCKTIME_IS_TOO_BIG',
        defaultMessage: 'Timestamp is too big',
    },
    LOCKTIME_BLOCKHEIGHT: {
        id: 'LOCKTIME_BLOCKHEIGHT',
        description: 'Used in reviewTransaction modal, locktime < 500000000',
        defaultMessage: 'Locktime blockheight',
    },
    LOCKTIME_TIMESTAMP: {
        id: 'LOCKTIME_TIMESTAMP',
        description: 'Used in reviewTransaction modal, locktime >= 500000000',
        defaultMessage: 'Locktime timestamp',
    },
    DESTINATION_TAG: {
        defaultMessage: 'Destination tag',
        id: 'DESTINATION_TAG',
    },
    DESTINATION_TAG_TOOLTIP: {
        id: 'DESTINATION_TAG_TOOLTIP',
        defaultMessage:
            'Destination tag is a unique code to identify the receiver of a transaction.',
    },
    DESTINATION_TAG_NOT_SET: {
        defaultMessage: 'Destination tag is not set',
        id: 'DESTINATION_TAG_NOT_SET',
    },
    DESTINATION_TAG_IS_NOT_VALID: {
        defaultMessage: 'Destination tag is not valid',
        id: 'DESTINATION_TAG_IS_NOT_VALID',
    },
    DESTINATION_TAG_IS_NOT_NUMBER: {
        defaultMessage: 'Destination tag is not a number',
        id: 'DESTINATION_TAG_IS_NOT_NUMBER',
    },
    DATA_ETH: {
        id: 'DATA_ETH',
        defaultMessage: 'Data',
    },
    DATA_ETH_ADD: {
        id: 'DATA_ETH_ADD',
        defaultMessage: 'Add Data',
    },
    DATA_ETH_ADD_TOOLTIP: {
        id: 'DATA_ETH_ADD_TOOLTIP',
        defaultMessage: 'Transaction data for Ethereum transaction.',
    },
    DATA_NOT_SET: {
        defaultMessage: 'Data not set',
        id: 'DATA_NOT_SET',
    },
    DATA_NOT_VALID_HEX: {
        defaultMessage: 'Not a valid hex',
        id: 'DATA_NOT_VALID_HEX',
    },
    DATA_HEX_TOO_BIG: {
        defaultMessage: 'Data limit exceeded',
        id: 'DATA_HEX_TOO_BIG',
    },
    RAW_TX_NOT_SET: {
        defaultMessage: 'Transaction not set',
        id: 'RAW_TX_NOT_SET',
    },
    ESTIMATED_TIME: {
        defaultMessage: 'Estimated time',
        id: 'ESTIMATED_TIME',
    },
    TOTAL_SENT: {
        id: 'TOTAL_SENT',
        defaultMessage: 'Total',
    },
    INCLUDING_FEE: {
        id: 'INCLUDING_FEE',
        defaultMessage: 'Incl. fee',
    },
    SEND_TRANSACTION: {
        id: 'SEND_TRANSACTION',
        description: 'Sign and send button used in Review modal',
        defaultMessage: 'Send',
    },
    REVIEW_AND_SEND_TRANSACTION: {
        id: 'REVIEW_AND_SEND_TRANSACTION',
        description: 'Sign and send button used in send form',
        defaultMessage: 'Review & send',
    },
    TR_CONNECT_TREZOR_TO_SEND_BUTTON: {
        id: 'TR_CONNECT_TREZOR_TO_SEND_BUTTON',
        defaultMessage: 'Connect Trezor to Send',
    },
    SEND_RAW: {
        id: 'SEND_RAW',
        description: 'item in dropdown menu',
        defaultMessage: 'Send raw',
    },
    RAW_TRANSACTION: {
        id: 'RAW_TRANSACTION',
        defaultMessage: 'Raw transaction',
    },
    SEND_RAW_TRANSACTION_TOOLTIP: {
        id: 'SEND_RAW_TRANSACTION_TOOLTIP',
        defaultMessage: 'You can provide all the raw data for your transaction by yourself.',
    },
    SIGN_TRANSACTION: {
        id: 'SIGN_TRANSACTION',
        description: 'Sign without sending button',
        defaultMessage: 'Sign',
    },
    COPY_TRANSACTION_TO_CLIPBOARD: {
        id: 'COPY_TRANSACTION_TO_CLIPBOARD',
        description: 'used in review modal',
        defaultMessage: 'Copy raw transaction',
    },
    DOWNLOAD_TRANSACTION: {
        id: 'DOWNLOAD_TRANSACTION',
        description: 'used in review modal',
        defaultMessage: 'Download as .txt',
    },
    FEE: {
        defaultMessage: 'Fee',
        description: 'Label in Send form',
        id: 'FEE',
    },
    MAX_FEE: {
        defaultMessage: 'Maximum fee',
        description: 'Label in Send form for Ethereum network type',
        id: 'MAX_FEE',
    },
    EXPECTED_FEE: {
        defaultMessage: 'Expected fee',
        description: 'Label in Send form for Solana network type',
        id: 'EXPECTED_FEE',
    },
    FEE_LEVEL_CUSTOM: {
        defaultMessage: 'Custom',
        id: 'FEE_LEVEL_CUSTOM',
    },
    FEE_LEVEL_HIGH: {
        defaultMessage: 'High',
        id: 'FEE_LEVEL_HIGH',
    },
    FEE_LEVEL_NORMAL: {
        defaultMessage: 'Normal',
        id: 'FEE_LEVEL_NORMAL',
    },
    FEE_LEVEL_LOW: {
        defaultMessage: 'Low',
        id: 'FEE_LEVEL_LOW',
    },
    CUSTOM_FEE_IS_NOT_SET: {
        defaultMessage:
            'Enter the fee rate you want to spend in order to complete this transaction.',
        id: 'CUSTOM_FEE_IS_NOT_SET',
    },
    CUSTOM_FEE_IS_NOT_INTEGER: {
        defaultMessage: 'Enter a whole number',
        id: 'CUSTOM_FEE_IS_NOT_INTEGER',
    },
    CUSTOM_FEE_NOT_IN_RANGE: {
        defaultMessage: 'Enter a fee between {minFee} and {maxFee}',
        id: 'CUSTOM_FEE_NOT_IN_RANGE',
    },
    CUSTOM_FEE_LIMIT_BELOW_RECOMMENDED: {
        defaultMessage: 'Gas limit too low',
        id: 'CUSTOM_FEE_LIMIT_BELOW_RECOMMENDED',
    },
    CUSTOM_FEE_LIMIT_USE_RECOMMENDED: {
        defaultMessage: 'Use recommended',
        id: 'CUSTOM_FEE_LIMIT_USE_RECOMMENDED',
    },
    TOKEN_BALANCE: {
        defaultMessage: 'Balance: {balance}',
        description: 'Additional label in send form above amount input',
        id: 'TOKEN_BALANCE',
    },
    BROADCAST: {
        id: 'BROADCAST',
        defaultMessage: 'Broadcast',
    },
    BROADCAST_TOOLTIP: {
        id: 'BROADCAST_TOOLTIP',
        defaultMessage: 'Broadcast the transaction to the network.',
    },
    BROADCAST_TOOLTIP_DISABLED_LOCKTIME: {
        id: 'BROADCAST_TOOLTIP_DISABLED_LOCKTIME',
        defaultMessage:
            'A transaction with a locktime set beyond the current block or timestamp will be rejected by the network.',
    },
    IMPORT_CSV: {
        id: 'IMPORT_CSV',
        description: 'item in dropdown menu',
        defaultMessage: 'Import',
    },
    TR_COIN_CONTROL: {
        id: 'TR_COIN_CONTROL',
        defaultMessage: 'Coin control',
    },
    TR_COIN_CONTROL_TOOLTIP: {
        id: 'TR_COIN_CONTROL_TOOLTIP',
        defaultMessage:
            'Coin control enables manual selection of UTXOs to be used as inputs for a transaction.',
        description: 'Tooltip on coin control button in send form.',
    },
    TR_SELECTED: {
        id: 'TR_SELECTED',
        defaultMessage: '{amount} selected',
        description: 'Number of list items selected',
    },
    TR_NOT_ENOUGH_SELECTED: {
        id: 'TR_NOT_ENOUGH_SELECTED',
        defaultMessage: 'Not enough funds selected',
        description: 'Error message for amount field in send form when coin control is on',
    },
    TR_MISSING_TO_INPUT: {
        id: 'TR_MISSING_TO_INPUT',
        defaultMessage: '{amount} missing from your input (excluding fee)',
        description: 'Info in Coin control section',
    },
    TR_MISSING_TO_FEE: {
        id: 'TR_MISSING_TO_FEE',
        defaultMessage: 'Not enough funds selected to cover the fee',
        description: 'Info in Coin control section',
    },
    TR_NO_SPENDABLE_UTXOS: {
        id: 'TR_NO_SPENDABLE_UTXOS',
        defaultMessage: 'There are no spendable UTXOs in your account.',
        description: 'Message showing in Coin control section',
    },
    TR_LOADING_TRANSACTION_DETAILS: {
        id: 'TR_LOADING_TRANSACTION_DETAILS',
        defaultMessage: 'Loading transaction details',
        description: 'Tooltip over a spinner icon in Coin control section',
    },
    TR_AMOUNT_TOO_SMALL_FOR_COINJOIN: {
        id: 'TR_AMOUNT_TOO_SMALL_FOR_COINJOIN',
        defaultMessage: 'Not suitable for coinjoin - amount too small',
        description: 'Tooltip over an icon in Coin control section',
    },
    TR_AMOUNT_TOO_BIG_FOR_COINJOIN: {
        id: 'TR_AMOUNT_TOO_BIG_FOR_COINJOIN',
        defaultMessage: 'Not suitable for coinjoin - amount too high',
        description: 'Tooltip over an icon in Coin control section',
    },
    TR_UTXO_REGISTERED_IN_COINJOIN: {
        id: 'TR_UTXO_REGISTERED_IN_COINJOIN',
        defaultMessage: 'Registered in coinjoin',
        description: 'Tooltip over an icon in Coin control section',
    },
    TR_UTXO_SHORT_BANNED_IN_COINJOIN: {
        id: 'TR_UTXO_SHORT_BANNED_IN_COINJOIN',
        defaultMessage: 'Temporarily banned from coinjoin',
        description: 'Tooltip over an icon in Coin control section',
    },
    TR_UTXO_LONG_BANNED_IN_COINJOIN: {
        id: 'TR_UTXO_LONG_BANNED_IN_COINJOIN',
        defaultMessage: 'Rejected by coordinator',
        description: 'Tooltip over an icon in Coin control section',
    },
    TR_CHANGE_ADDRESS_TOOLTIP: {
        id: 'TR_CHANGE_ADDRESS_TOOLTIP',
        defaultMessage: 'This is a change address created from a previous send.',
        description: 'Tooltip over an icon in Coin control section',
    },
    TR_IN_PENDING_TRANSACTION: {
        id: 'TR_IN_PENDING_TRANSACTION',
        defaultMessage: 'In pending transaction',
        description: 'Tooltip over an icon in Coin control section',
    },
    TR_PRIVATE_DESCRIPTION: {
        id: 'TR_PRIVATE_DESCRIPTION',
        defaultMessage: 'Privacy at least {targetAnonymity}',
        description: 'Sub-heading in Coin control section',
    },
    TR_NOT_PRIVATE_DESCRIPTION: {
        id: 'TR_NOT_PRIVATE_DESCRIPTION',
        defaultMessage: 'Privacy below {targetAnonymity}',
        description: 'Sub-heading in Coin control section',
    },
    TR_DUST: {
        id: 'TR_DUST',
        defaultMessage: 'Unspendable outputs (dust)',
        description: 'Heading in Coin control section',
    },
    TR_DUST_DESCRIPTION: {
        id: 'TR_DUST_DESCRIPTION',
        defaultMessage: 'These outputs are likely smaller than the fee required to spend them.',
        description: 'Sub-heading in Coin control section',
    },
    TR_SEARCH_UTXOS: {
        id: 'TR_SEARCH_UTXOS',
        defaultMessage: 'Search for a specific address, transaction ID, or label',
    },
    TR_CONNECTED_TO_PROVIDER: {
        defaultMessage: 'Connected to {provider} as {user}',
        id: 'TR_CONNECTED_TO_PROVIDER',
    },
    TR_CONNECTED_TO_PROVIDER_LOCALLY: {
        defaultMessage: 'Labels saved locally',
        id: 'TR_CONNECTED_TO_PROVIDER_LOCALLY',
    },
    TR_YOUR_LABELING_IS_SYNCED: {
        defaultMessage:
            'Your labels are synced with a cloud storage provider. Your data is safe, as only your Trezor can decrypt it.',
        id: 'TR_YOUR_LABELING_IS_SYNCED',
    },
    TR_YOUR_LABELING_IS_SYNCED_LOCALLY: {
        defaultMessage: 'Your labels are saved locally on your machine.',
        id: 'TR_YOUR_LABELING_IS_SYNCED_LOCALLY',
    },
    TR_LABELING_NOT_SYNCED: {
        defaultMessage: 'Labels not synced',
        id: 'TR_LABELING_NOT_SYNCED',
    },
    TR_TO_MAKE_YOUR_LABELS_PERSISTENT: {
        defaultMessage:
            'To make your labels consistent and available on different devices, connect to a cloud storage provider.',
        id: 'TR_TO_MAKE_YOUR_LABELS_PERSISTENT',
    },
    TR_DROPBOX: {
        defaultMessage: 'Dropbox',
        id: 'TR_DROPBOX',
        description:
            'Name of cloud provider. Intended to be translated only in languages that do not use latin script',
    },
    TR_GOOGLE_DRIVE: {
        defaultMessage: 'Google Drive',
        id: 'TR_GOOGLE_DRIVE',
        description:
            'Name of cloud provider. Intended to be translated only in languages that do not use latin script',
    },
    TR_LOCAL_FILE_SYSTEM: {
        defaultMessage: 'Local file system',
        id: 'TR_LOCAL_FILE_SYSTEM',
    },
    METADATA_MODAL_HEADING: {
        defaultMessage: 'Save labels',
        id: 'METADATA_MODAL_HEADING',
    },
    METADATA_MODAL_DESCRIPTION: {
        defaultMessage: 'Select how to sync your labels. Your data is encrypted by Trezor.',
        id: 'METADATA_MODAL_DESCRIPTION',
    },
    TR_DISABLED_SWITCH_TOOLTIP: {
        id: 'TR_DISABLED_SWITCH_TOOLTIP',
        defaultMessage: 'Connect & unlock device to edit',
    },
    TR_UPDATE_FIRMWARE_HOMESCREEN_TOOLTIP: {
        id: 'TR_UPDATE_FIRMWARE_HOMESCREEN_TOOLTIP',
        defaultMessage: 'Update your firmware to change your homescreen',
    },
    TR_FIRMWARE_LANGUAGE_CHANGED: {
        id: 'TR_FIRMWARE_LANGUAGE_CHANGED',
        defaultMessage: 'Device language successfully changed',
    },
    TR_FIRMWARE_LANGUAGE_FETCH_ERROR: {
        id: 'TR_FIRMWARE_LANGUAGE_FETCH_ERROR',
        defaultMessage: 'Translation download failed',
    },
    TR_UPDATE_FIRMWARE_HOMESCREEN_LATER_TOOLTIP: {
        id: 'TR_UPDATE_FIRMWARE_HOMESCREEN_LATER_TOOLTIP',
        defaultMessage:
            'Firmware update required. You can change your homescreen in the settings page later',
    },
    TR_LABELING_FEATURE_ALLOWS: {
        id: 'TR_LABELING_FEATURE_ALLOWS',
        defaultMessage:
            'Rename your wallets, accounts, and addresses. Labels are applied by syncing with Dropbox or Google Drive.',
    },
    TR_LABELING_ENABLED: {
        id: 'TR_LABELING_ENABLED',
        defaultMessage: 'Labeling',
    },
    SETTINGS_ADV_COIN_BLOCKBOOK_DESCRIPTION: {
        id: 'SETTINGS_ADV_COIN_BLOCKBOOK_DESCRIPTION',
        defaultMessage:
            'Trezor Suite uses Trezor Blockbook for the wallet backend. You can also use your own custom blockbook.',
    },
    SETTINGS_ADV_COIN_BLOCKFROST_DESCRIPTION: {
        id: 'SETTINGS_ADV_COIN_BLOCKFROST_DESCRIPTION',
        defaultMessage: 'Trezor Suite uses Blockfrost websocket-link for the wallet backend.',
    },
    SETTINGS_ADV_COIN_URL_INPUT_PLACEHOLDER: {
        id: 'SETTINGS_ADV_COIN_URL_INPUT_PLACEHOLDER',
        defaultMessage: 'e.g. {url}',
    },
    TR_DEFAULT_VALUE: {
        id: 'TR_DEFAULT_VALUE',
        defaultMessage: 'Default: {value}',
        description: 'Used to show default settings value',
    },
    TR_ADD_NEW_BLOCKBOOK_BACKEND: {
        id: 'TR_ADD_NEW_BLOCKBOOK_BACKEND',
        defaultMessage: 'Add new',
    },
    TR_CUSTOM_BACKEND: {
        id: 'TR_CUSTOM_BACKEND',
        defaultMessage: 'Custom backend',
    },
    TR_BACKEND_DEFAULT_SERVERS: {
        id: 'TR_BACKEND_DEFAULT_SERVERS',
        defaultMessage: 'Trezor servers (default)',
    },
    TR_BACKEND_CUSTOM_SERVERS: {
        id: 'TR_BACKEND_CUSTOM_SERVERS',
        defaultMessage: 'Custom {type} server',
    },
    TR_BACKENDS: {
        id: 'TR_BACKENDS',
        defaultMessage: 'Backends',
    },
    TR_CUSTOM_BACKEND_INVALID_URL: {
        id: 'TR_CUSTOM_BACKEND_INVALID_URL',
        defaultMessage: 'Invalid URL',
    },
    TR_CUSTOM_BACKEND_BACKEND_ALREADY_ADDED: {
        id: 'TR_CUSTOM_BACKEND_BACKEND_ALREADY_ADDED',
        defaultMessage: 'The backend is already added',
    },
    TR_OTHER_COINS_USE_DEFAULT_BACKEND: {
        id: 'TR_OTHER_COINS_USE_DEFAULT_BACKEND',
        defaultMessage: 'Other coins use their default backends',
    },
    TR_USE_DEFAULT_BACKENDS: {
        id: 'TR_USE_DEFAULT_BACKENDS',
        defaultMessage: 'Use default backends',
    },
    TR_CUSTOM_FIRMWARE_BUTTON_INSTALL: {
        id: 'TR_CUSTOM_FIRMWARE_BUTTON_INSTALL',
        defaultMessage: 'Install firmware',
    },
    TR_CUSTOM_FIRMWARE_TITLE_DOWNLOAD: {
        id: 'TR_CUSTOM_FIRMWARE_TITLE_DOWNLOAD',
        defaultMessage: 'Select compatible firmware',
    },
    TR_CUSTOM_FIRMWARE_TITLE_UPLOAD: {
        id: 'TR_CUSTOM_FIRMWARE_TITLE_UPLOAD',
        defaultMessage: 'Upload firmware',
    },
    TR_CUSTOM_FIRMWARE_VERSION: {
        id: 'TR_CUSTOM_FIRMWARE_VERSION',
        defaultMessage: 'custom',
    },
    SETTINGS_ADV_COIN_CONN_INFO_TITLE: {
        id: 'SETTINGS_ADV_COIN_CONN_INFO_TITLE',
        defaultMessage: 'Connection Info',
    },
    SETTINGS_ADV_COIN_CONN_INFO_URL: {
        id: 'SETTINGS_ADV_COIN_CONN_INFO_URL',
        defaultMessage: 'Currently connected to {url}',
    },
    SETTINGS_ADV_COIN_CONN_INFO_BLOCK_HASH: {
        id: 'SETTINGS_ADV_COIN_CONN_INFO_BLOCK_HASH',
        defaultMessage: 'Block hash: {hash}',
    },
    SETTINGS_ADV_COIN_CONN_INFO_BLOCK_HEIGHT: {
        id: 'SETTINGS_ADV_COIN_CONN_INFO_BLOCK_HEIGHT',
        defaultMessage: 'Block height: {height}',
    },
    SETTINGS_ADV_COIN_CONN_INFO_VERSION: {
        id: 'SETTINGS_ADV_COIN_CONN_INFO_VERSION',
        defaultMessage: 'Backend version: {version}',
    },
    SETTINGS_ADV_COIN_CONN_INFO_NO_CONNECTED: {
        id: 'SETTINGS_ADV_COIN_CONN_INFO_NO_CONNECTED',
        defaultMessage:
            'Not connected to the backend. Try reconnecting the device. Also, check your internet connection or the URL of your custom backend.',
    },
    TR_LABELING_ADD_LABEL: {
        id: 'TR_LABELING_ADD_LABEL',
        defaultMessage: 'Add label',
    },
    TR_LABELING_EDIT_LABEL: {
        id: 'TR_LABELING_EDIT_LABEL',
        defaultMessage: 'Edit label',
    },
    TR_LABELING_EDITED_LABEL: {
        id: 'TR_LABELING_EDITED_LABEL',
        defaultMessage: 'Renamed',
    },
    TR_LABELING_REMOVE_LABEL: {
        id: 'TR_LABELING_REMOVE_LABEL',
        defaultMessage: 'Remove label',
    },
    TR_LABELING_ADD_ADDRESS: {
        id: 'TR_LABELING_ADD_ADDRESS',
        defaultMessage: 'Add label',
    },
    TR_LABELING_EDIT_ADDRESS: {
        id: 'TR_LABELING_EDIT_ADDRESS',
        defaultMessage: 'Edit label',
    },
    TR_LABELING_REMOVE_ADDRESS: {
        id: 'TR_LABELING_REMOVE_ADDRESS',
        defaultMessage: 'Remove label',
    },
    TR_LABELING_ADD_ACCOUNT: {
        id: 'TR_LABELING_ADD_ACCOUNT',
        defaultMessage: 'Rename',
    },
    TR_LABELING_EDIT_ACCOUNT: {
        id: 'TR_LABELING_EDIT_ACCOUNT',
        defaultMessage: 'Rename',
    },
    TR_LABELING_REMOVE_ACCOUNT: {
        id: 'TR_LABELING_REMOVE_ACCOUNT',
        defaultMessage: 'Remove label',
    },
    TR_LABELING_ADD_WALLET: {
        id: 'TR_LABELING_ADD_WALLET',
        defaultMessage: 'Rename',
    },
    TR_LABELING_EDIT_WALLET: {
        id: 'TR_LABELING_EDIT_WALLET',
        defaultMessage: 'Edit label',
    },
    TR_LABELING_REMOVE_WALLET: {
        id: 'TR_LABELING_REMOVE_WALLET',
        defaultMessage: 'Remove label',
    },
    TR_LABELING_ADD_OUTPUT: {
        id: 'TR_LABELING_ADD_OUTPUT',
        defaultMessage: 'Add label',
    },
    TR_LABELING_EDIT_OUTPUT: {
        id: 'TR_LABELING_EDIT_OUTPUT',
        defaultMessage: 'Edit label',
    },
    TR_LABELING_REMOVE_OUTPUT: {
        id: 'TR_LABELING_REMOVE_OUTPUT',
        defaultMessage: 'Remove label',
    },
    TR_GRAPH_MISSING_DATA: {
        id: 'TR_GRAPH_MISSING_DATA',
        defaultMessage:
            "XRP, SOL, and all token amounts are in the portfolio balance but aren't currently supported in graph view.",
    },
    METADATA_PROVIDER_NOT_FOUND_ERROR: {
        id: 'METADATA_PROVIDER_NOT_FOUND_ERROR',
        defaultMessage: 'Failed to find metadata in cloud provider.',
    },
    METADATA_PROVIDER_AUTH_ERROR: {
        id: 'METADATA_PROVIDER_AUTH_ERROR',
        defaultMessage:
            'Failed to sync labels with cloud storage provider {provider}. User was logged out.',
    },
    METADATA_PROVIDER_UNEXPECTED_ERROR: {
        id: 'METADATA_PROVIDER_UNEXPECTED_ERROR',
        defaultMessage:
            'Failed to sync labels with cloud storage provider {provider}. User was logged out.',
    },
    TR_REVEAL_ADDRESS: {
        id: 'TR_REVEAL_ADDRESS',
        defaultMessage: 'Reveal address',
    },
    TR_ENABLE_MORE_COINS: {
        id: 'TR_ENABLE_MORE_COINS',
        defaultMessage: 'Enable more coins',
    },
    TR_BACKUP_RECOVERY_SEED_FAILED_TITLE: {
        id: 'TR_BACKUP_RECOVERY_SEED_FAILED_TITLE',
        defaultMessage: 'Backup failed',
    },
    TR_BACKUP_RECOVERY_SEED_FAILED_DESC: {
        id: 'TR_BACKUP_RECOVERY_SEED_FAILED_DESC',
        defaultMessage:
            'The backup process has failed. It is highly recommended to back up your wallet. Please follow the link to learn how to create a wallet backup.',
    },
    TR_BACKUP_FAILED: {
        id: 'TR_BACKUP_FAILED',
        defaultMessage: 'Backup failed',
    },
    TR_STANDARD_WALLET_DESCRIPTION: {
        id: 'TR_STANDARD_WALLET_DESCRIPTION',
        defaultMessage: 'No passphrase',
    },
    TR_HIDDEN_WALLET_DESCRIPTION: {
        id: 'TR_HIDDEN_WALLET_DESCRIPTION',
        defaultMessage: 'Passphrase is required',
    },
    TR_FEEDBACK_ANALYTICS_ITEM_OS: {
        id: 'TR_FEEDBACK_ANALYTICS_ITEM_OS',
        defaultMessage: 'Operating system',
    },
    TR_FEEDBACK_ANALYTICS_ITEM_BROWSER: {
        id: 'TR_FEEDBACK_ANALYTICS_ITEM_BROWSER',
        defaultMessage: 'Browser',
    },
    TR_FEEDBACK_ANALYTICS_ITEM_FW: {
        id: 'TR_FEEDBACK_ANALYTICS_ITEM_FW',
        defaultMessage: 'Device firmware version',
    },
    TR_FEEDBACK_ANALYTICS_ITEM_APP: {
        id: 'TR_FEEDBACK_ANALYTICS_ITEM_APP',
        defaultMessage: 'Trezor Suite version',
    },
    TR_FEEDBACK_CATEGORY_SELECT_PLACEHOLDER: {
        id: 'TR_FEEDBACK_CATEGORY_SELECT_PLACEHOLDER',
        defaultMessage: 'Select category...',
    },
    TR_FEEDBACK_CATEGORY_DASHBOARD: {
        id: 'TR_FEEDBACK_CATEGORY_DASHBOARD',
        defaultMessage: 'Dashboard',
    },
    TR_FEEDBACK_CATEGORY_ACCOUNT: {
        id: 'TR_FEEDBACK_CATEGORY_ACCOUNT',
        defaultMessage: 'Account',
    },
    TR_FEEDBACK_CATEGORY_SETTINGS: {
        id: 'TR_FEEDBACK_CATEGORY_SETTINGS',
        defaultMessage: 'Settings',
    },
    TR_FEEDBACK_CATEGORY_SEND: {
        id: 'TR_FEEDBACK_CATEGORY_SEND',
        defaultMessage: 'Send',
    },
    TR_FEEDBACK_CATEGORY_RECEIVE: {
        id: 'TR_FEEDBACK_CATEGORY_RECEIVE',
        defaultMessage: 'Receive',
    },
    TR_FEEDBACK_CATEGORY_TRADE: {
        id: 'TR_FEEDBACK_CATEGORY_TRADE',
        defaultMessage: 'Trade',
    },
    TR_FEEDBACK_CATEGORY_OTHER: {
        id: 'TR_FEEDBACK_CATEGORY_OTHER',
        defaultMessage: 'Other',
    },
    FIRMWARE_USER_HAS_SEED_CHECKBOX_DESC: {
        id: 'FIRMWARE_USER_HAS_SEED_CHECKBOX_DESC',
        defaultMessage: 'Yes, I do!',
    },
    FIRMWARE_USER_TAKES_RESPONSIBILITY_CHECKBOX_DESC: {
        id: 'FIRMWARE_USER_TAKES_RESPONSIBILITY_CHECKBOX_DESC',
        defaultMessage: 'I accept the risk',
    },
    FIRMWARE_CONNECT_IN_NORMAL_MODEL_NO_BUTTON: {
        id: 'FIRMWARE_CONNECT_IN_NORMAL_MODEL_NO_BUTTON',
        defaultMessage: "Don't hold any buttons while connecting the cable.",
    },
    TR_TAKES_N_MINUTES: {
        id: 'TR_TAKES_N_MINUTES',
        defaultMessage: 'Takes ~15 mins',
    },
    TR_INPUTS_OUTPUTS: {
        id: 'TR_INPUTS_OUTPUTS',
        defaultMessage: 'Inputs, Outputs',
    },
    TR_MY_INPUTS_AND_OUTPUTS: {
        id: 'TR_MY_INPUTS_AND_OUTPUTS',
        defaultMessage: 'My inputs and outputs',
    },
    TR_OTHER_INPUTS_AND_OUTPUTS: {
        id: 'TR_OTHER_INPUTS_AND_OUTPUTS',
        defaultMessage: 'Other inputs and outputs',
    },
    TR_CHAINED_TXS: {
        id: 'TR_CHAINED_TXS',
        defaultMessage: 'Chained transactions',
    },
    TR_DATA: {
        id: 'TR_DATA',
        defaultMessage: 'Data',
    },
    TR_AFFECTED_TXS: {
        id: 'TR_AFFECTED_TXS',
        defaultMessage: 'This operation will remove the following transactions from the mempool',
    },
    TR_AFFECTED_TXS_HEADER: {
        id: 'TR_AFFECTED_TXS_HEADER',
        defaultMessage:
            'Chained transactions are created from the output of this initial transaction',
    },
    TR_AFFECTED_TXS_OWN: {
        id: 'TR_AFFECTED_TXS_OWN',
        defaultMessage: 'Your transactions',
    },
    TR_AFFECTED_TXS_OTHERS: {
        id: 'TR_AFFECTED_TXS_OTHERS',
        defaultMessage: 'Transactions created from other accounts',
    },
    TR_OUTPUTS: {
        id: 'TR_OUTPUTS',
        defaultMessage: 'Outputs',
    },
    TR_INPUTS: {
        id: 'TR_INPUTS',
        defaultMessage: 'Inputs',
    },
    TR_TX_TAB_AMOUNT: {
        id: 'TR_TX_TAB_AMOUNT',
        defaultMessage: 'Amount',
        description: 'Title of a tab in a transaction detail modal',
    },
    TR_TODAY_DATE: {
        id: 'TR_TODAY_DATE',
        defaultMessage: 'Today, {date}',
    },
    TR_UPDATE_MODAL_AVAILABLE_HEADING: {
        id: 'TR_UPDATE_MODAL_AVAILABLE_HEADING',
        defaultMessage: 'Update available',
    },
    TR_UPDATE_MODAL_WHATS_NEW: {
        id: 'TR_UPDATE_MODAL_WHATS_NEW',
        defaultMessage: 'What’s new',
    },
    TR_UPDATE_MODAL_YOUR_VERSION: {
        id: 'TR_UPDATE_MODAL_YOUR_VERSION',
        defaultMessage: 'Your version: v{version}',
    },
    TR_UPDATE_MODAL_ENABLE_AUTO_UPDATES: {
        id: 'TR_UPDATE_MODAL_ENABLE_AUTO_UPDATES',
        defaultMessage: 'Enable automatic updates',
    },
    TR_UPDATE_MODAL_ENABLE_AUTO_UPDATES_NEW_TAG: {
        id: 'TR_UPDATE_MODAL_ENABLE_AUTO_UPDATES_NEW_TAG',
        defaultMessage: 'New',
    },
    TR_UPDATE_MODAL_NOT_NOW: {
        id: 'TR_UPDATE_MODAL_NOT_NOW',
        defaultMessage: 'Not now',
    },
    TR_UPDATE_MODAL_START_DOWNLOAD: {
        id: 'TR_UPDATE_MODAL_START_DOWNLOAD',
        defaultMessage: 'Download',
    },
    TR_UPDATE_MODAL_INSTALL_NOW_OR_LATER: {
        id: 'TR_UPDATE_MODAL_INSTALL_NOW_OR_LATER',
        defaultMessage: 'Install update now?',
    },
    TR_UPDATE_MODAL_INSTALL_AND_RESTART: {
        id: 'TR_UPDATE_MODAL_INSTALL_AND_RESTART',
        defaultMessage: 'Update & restart',
    },
    TR_UPDATE_MODAL_UPDATE_ON_QUIT: {
        id: 'TR_UPDATE_MODAL_UPDATE_ON_QUIT',
        defaultMessage: 'Update on quit',
    },
    TR_BACKGROUND_DOWNLOAD: {
        id: 'TR_BACKGROUND_DOWNLOAD',
        defaultMessage: 'Download in background',
    },
    TR_MANAGE: {
        id: 'TR_MANAGE',
        defaultMessage: 'manage',
    },
    TR_VERSION_HAS_RELEASED: {
        id: 'TR_VERSION_HAS_BEEN_RELEASED',
        defaultMessage: 'v{version} has released!',
    },
    TR_READ_ALL_ON_GITHUB: {
        id: 'TR_READ_ALL_ON_GITHUB',
        defaultMessage: 'Read all on Github',
    },
    TR_WERE_CONSTANTLY_WORKING_TO_IMPROVE: {
        id: 'TR_WERE_CONSTANTLY_WORKING_TO_IMPROVE',
        defaultMessage:
            'We’re constantly working to improve your Trezor experience, here’s what has changed:',
    },
    TR_UPDATE_MODAL_UPDATE_DOWNLOADED: {
        id: 'TR_UPDATE_MODAL_UPDATE_DOWNLOADED',
        defaultMessage: 'Update downloaded',
    },
    TR_UPDATE_MODAL_RESTART_NEEDED: {
        id: 'TR_UPDATE_MODAL_RESTART_NEEDED',
        defaultMessage: 'This will restart Trezor Suite.',
    },
    SETTINGS_UPDATE_CHECKING: {
        id: 'SETTINGS_UPDATE_CHECKING',
        defaultMessage: 'Checking...',
    },
    SETTINGS_UPDATE_CHECK: {
        id: 'SETTINGS_UPDATE_CHECK',
        defaultMessage: 'Check for updates',
    },
    SETTINGS_UPDATE_AVAILABLE: {
        id: 'SETTINGS_UPDATE_AVAILABLE',
        defaultMessage: 'Get the latest version',
    },
    SETTINGS_UPDATE_DOWNLOADING: {
        id: 'SETTINGS_UPDATE_DOWNLOADING',
        defaultMessage: 'Downloading...',
    },
    SETTINGS_UPDATE_READY: {
        id: 'SETTINGS_UPDATE_READY',
        defaultMessage: 'Install now!',
    },
    TR_LOADING: {
        id: 'TR_LOADING',
        defaultMessage: 'Loading...',
    },
    TR_BACKUP_CHECKBOX_1_TITLE: {
        id: 'TR_BACKUP_CHECKBOX_1_TITLE',
        defaultMessage:
            'Your wallet backup lets you recover your funds in case of Trezor loss or damage.',
    },
    TR_BACKUP_CHECKBOX_1_DESCRIPTION: {
        id: 'TR_BACKUP_CHECKBOX_1_DESCRIPTION',
        defaultMessage:
            'Make sure you wrote down each word in the exact order it was given to you. Keep your wallet backup card dry and free from smudges.',
    },
    TR_BACKUP_CHECKBOX_2_TITLE: {
        id: 'TR_BACKUP_CHECKBOX_2_TITLE',
        defaultMessage: 'Never take a picture of your backup or store it anywhere digital.',
    },
    TR_BACKUP_CHECKBOX_2_DESCRIPTION: {
        id: 'TR_BACKUP_CHECKBOX_2_DESCRIPTION',
        defaultMessage:
            "Don't save your wallet backup on your phone or on any device that could be hacked, including a cloud service.",
    },
    TR_BACKUP_CHECKBOX_3_TITLE: {
        id: 'TR_BACKUP_CHECKBOX_3_TITLE',
        defaultMessage: 'Store your wallet backup securely and never share it with anyone.',
    },
    TR_BACKUP_CHECKBOX_3_DESCRIPTION: {
        id: 'TR_BACKUP_CHECKBOX_3_DESCRIPTION',
        defaultMessage:
            'Hide it well and use proper safeguards to ensure that you are the only person who ever sees your wallet backup.',
    },
    TR_PIN_HEADING_INITIAL: {
        id: 'TR_PIN_HEADING_INITIAL',
        defaultMessage: 'Set a PIN',
    },
    TR_COMPLETE_SETUP: {
        id: 'TR_COMPLETE_SETUP',
        defaultMessage: 'Complete setup',
    },
    TR_RECOVER_YOUR_WALLET_FROM: {
        id: 'TR_RECOVER_YOUR_WALLET_FROM',
        defaultMessage: 'Recover wallet from seed',
    },
    TR_SELECT_RECOVERY_METHOD: {
        id: 'TR_SELECT_RECOVERY_METHOD',
        defaultMessage: 'Select recovery method',
    },
    TR_WALLET_RECOVERED_FROM_SEED: {
        id: 'TR_WALLET_RECOVERED_FROM_SEED',
        defaultMessage: 'Recovery complete',
    },
    TR_RECOVERY_FAILED: {
        id: 'TR_RECOVERY_FAILED',
        defaultMessage: 'Recovery failed',
    },
    TR_ACCOUNT_SEARCH_NO_RESULTS: {
        id: 'TR_ACCOUNT_SEARCH_NO_RESULTS',
        defaultMessage: 'No results',
    },
    TR_ACCOUNT_NO_ACCOUNTS: {
        id: 'TR_ACCOUNT_NO_ACCOUNTS',
        defaultMessage: 'No accounts',
    },
    TR_COLOR_SCHEME: {
        id: 'TR_COLOR_SCHEME',
        defaultMessage: 'Color scheme',
    },
    TR_COLOR_SCHEME_DESCRIPTION: {
        id: 'TR_COLOR_SCHEME_DESCRIPTION',
        defaultMessage:
            'Choose whether Trezor Suite uses dark-colored elements on a light background or light-colored elements on a dark background.',
    },
    TR_COLOR_SCHEME_DARK: {
        id: 'TR_COLOR_SCHEME_DARK',
        defaultMessage: 'Dark',
    },
    TR_COLOR_SCHEME_LIGHT: {
        id: 'TR_COLOR_SCHEME_LIGHT',
        defaultMessage: 'Light',
    },
    TR_EXPORT_AS: {
        id: 'TR_EXPORT_AS',
        defaultMessage: 'Export as {as}',
    },
    TR_HIDE_TOKEN: {
        id: 'TR_HIDE_TOKEN',
        defaultMessage: 'Hide token',
    },
    TR_UNHIDE_TOKEN: {
        id: 'TR_UNHIDE_TOKEN',
        defaultMessage: 'Unhide token',
    },
    TR_UNHIDE: {
        id: 'TR_UNHIDE',
        defaultMessage: 'Unhide',
    },
    TR_VIEW_ALL_TRANSACTION: {
        id: 'TR_VIEW_ALL_TRANSACTION',
        defaultMessage: 'View all transactions',
    },
    TR_VIEW_IN_EXPLORER: {
        id: 'TR_VIEW_IN_EXPLORER',
        defaultMessage: 'View in explorer',
    },
    TR_EXPORT_FAIL: {
        id: 'TR_EXPORT_FAIL',
        defaultMessage: 'Export failed.',
    },
    TR_SEARCH: {
        id: 'TR_SEARCH',
        defaultMessage: 'Search',
    },
    TR_SEARCH_FAIL: {
        id: 'TR_SEARCH_FAIL',
        defaultMessage: 'Search failed.',
    },
    TR_RANGE: {
        id: 'TR_RANGE',
        defaultMessage: 'range',
    },
    TR_DELIVERY: {
        id: 'TR_DELIVERY',
        defaultMessage: 'Delivery',
    },
    TR_BUMP_FEE: {
        id: 'TR_BUMP_FEE',
        defaultMessage: 'Bump fee',
    },
    TR_REPLACE_TX: {
        id: 'TR_REPLACE_TX',
        defaultMessage: 'Replace transaction',
    },
    TR_CONFIRMING_TX: {
        id: 'TR_CONFIRMING_TX',
        defaultMessage: 'Confirming transaction',
    },
    TR_CURRENT_FEE: {
        id: 'TR_CURRENT_FEE',
        defaultMessage: 'Current',
    },
    TR_NEW_FEE: {
        id: 'TR_NEW_FEE',
        defaultMessage: 'New',
    },
    TR_INCREASE_FEE_BY: {
        id: 'TR_INCREASE_FEE_BY',
        defaultMessage: 'Increase your fee by',
    },
    TR_INCREASED_FEE: {
        id: 'TR_INCREASED_FEE',
        defaultMessage: 'New transaction fee',
    },
    TR_DECREASE_TX: {
        id: 'TR_DECREASE_TX',
        defaultMessage: 'No funds left for fee. Final amount needs to be reduced to bump fee.',
    },
    TR_REDUCE_FROM: {
        id: 'TR_REDUCE_FROM',
        defaultMessage: 'Reduce from {value}',
    },
    TR_DECREASE_AMOUNT_BY: {
        id: 'TR_DECREASE_AMOUNT_BY',
        defaultMessage: 'Decrease amount by',
    },
    TR_DECREASED_AMOUNT: {
        id: 'TR_DECREASED_AMOUNT',
        defaultMessage: 'New amount',
    },
    TR_FEE_RATE: {
        id: 'TR_FEE_RATE',
        defaultMessage: 'Fee rate',
    },
    TR_SEARCH_TOKENS: {
        id: 'TR_SEARCH_TOKENS',
        defaultMessage: 'Search tokens',
    },
    TR_TOKENS_SEARCH_TOOLTIP: {
        id: 'TR_TOKENS_SEARCH_TOOLTIP',
        defaultMessage: 'Search by token, symbol, or contract address.',
    },
    TR_SEARCH_TRANSACTIONS: {
        id: 'TR_SEARCH_TRANSACTIONS',
        defaultMessage: 'Search transactions',
    },
    TR_NO_SEARCH_RESULTS: {
        id: 'TR_NO_SEARCH_RESULTS',
        defaultMessage: 'No results for your search criterion',
    },
    TR_TRANSACTIONS_SEARCH_TOOLTIP: {
        id: 'TR_TRANSACTIONS_SEARCH_TOOLTIP',
        defaultMessage:
            'Search by transaction ID, label or amount or use operators such as < > | & = !=.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_1: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_1',
        defaultMessage:
            'Tip: You can search for transaction IDs, addresses, tokens, labels, amounts, and dates.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_2: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_2',
        defaultMessage:
            'Tip: Use the greater than (>) and less than (<) symbols for amount searches. For example <strong> 1</strong> will show all transactions that have an amount of 1 and higher.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_3: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_3',
        defaultMessage:
            'Tip: You can search for exact amounts using the equal (=) symbol. For example <strong>= 0.01</strong> will show only transactions that have an amount of exactly 0.01.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_4: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_4',
        defaultMessage:
            'Tip: You can exclude an amount by using the exclamation mark and equal symbols together (!=). For example <strong>!= -0.01</strong> will show all transactions except the ones with an amount of -0.01.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_5: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_5',
        defaultMessage:
            'Tip: Dates can be searched using the <strong>YYYY-MM-DD</strong> format. For example <strong>{lastYear}-12-14</strong> will show all transactions on December 14th, {lastYear}.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_6: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_6',
        defaultMessage:
            'Tip: Use greater than (>) and lesser than (<) symbols on date searches. For example <strong>> {lastYear}-12-01</strong> will show all transactions on and after December 1st, {lastYear}.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_7: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_7',
        defaultMessage:
            'Tip: You can exclude a date by using the exclamation mark and equal symbols together (!=). For example <strong>!= {lastYear}-12-14</strong> will show all transactions except the ones on December 14th, {lastYear}.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_8: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_8',
        defaultMessage:
            'Tip: You can display results matching at least one of multiple searches by grouping them with the OR operator (|). For example <strong>{lastYear}-11-30 | {lastYear}-12-01</strong> will show all transactions that have happened on the 30th of November or the 1st of December {lastYear}.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_9: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_9',
        defaultMessage:
            'Tip: Display results matching multiple searches by grouping them with the AND operator (&). For example <strong>> {lastYear}-12-01 & < {lastYear}-12-31 & > 0</strong> will show all incoming (amount higher than 0) transactions in December {lastYear}.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_10: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_10',
        defaultMessage:
            'Tip: Combine AND (&) and OR (|) operators for more complex searches. For example <strong>> {lastYear}-01-01 & < {lastYear}-01-31 | > {lastYear}-12-01 & < {lastYear}-12-31</strong> will show all transactions in January or December {lastYear}.',
    },
    TR_INTERNAL_TRANSACTIONS: {
        id: 'TR_INTERNAL_TRANSACTIONS',
        defaultMessage: 'Internal Transfers',
    },
    TR_TOKEN_TRANSFERS: {
        id: 'TR_TOKEN_TRANSFERS',
        defaultMessage: '{standard} Token Transfers',
    },
    TR_CONTRACT_ADDRESS: {
        id: 'TR_CONTRACT_ADDRESS',
        defaultMessage: 'Contract address:',
    },
    TR_POLICY_ID_ADDRESS: {
        id: 'TR_POLICY_ID_ADDRESS',
        defaultMessage: 'Policy ID:',
    },
    TR_FINGERPRINT_ADDRESS: {
        id: 'TR_FINGERPRINT_ADDRESS',
        defaultMessage: 'Fingerprint:',
    },
    TR_ANALYZE_IN_BLOCKBOOK: {
        id: 'TR_ANALYZE_IN_BLOCKBOOK',
        defaultMessage: 'Analyze in Trezor Blockbook',
    },
    TR_ANALYZE_IN_BLOCKBOOK_DESC: {
        id: 'TR_ANALYZE_IN_BLOCKBOOK_DESC',
        defaultMessage:
            'See inputs and outputs in Trezor Blockbook as it might be easier to analyze there.',
    },
    TR_ANALYZE_IN_BLOCKBOOK_OPEN: {
        id: 'TR_ANALYZE_IN_BLOCKBOOK_OPEN',
        defaultMessage: 'Open',
    },
    TR_PAGINATION_NEWER: {
        id: 'TR_PAGINATION_NEWER',
        defaultMessage: 'Newer',
    },
    TR_PAGINATION_OLDER: {
        id: 'TR_PAGINATION_OLDER',
        defaultMessage: 'Older',
    },
    TR_TXID: {
        id: 'TR_TXID',
        defaultMessage: 'TX ID',
    },
    TR_TXID_RBF: {
        id: 'TR_TXID_RBF',
        defaultMessage: 'Original TX ID to be replaced',
    },
    TR_SIZE: {
        id: 'TR_SIZE',
        defaultMessage: 'Size',
    },
    TR_BYTES: {
        id: 'TR_BYTES',
        defaultMessage: 'bytes',
    },
    TR_GRAPH_LINEAR: {
        id: 'TR_GRAPH_LINEAR',
        defaultMessage: 'Linear',
    },
    TR_GRAPH_LOGARITHMIC: {
        id: 'TR_GRAPH_LOGARITHMIC',
        defaultMessage: 'Logarithmic',
    },
    TR_GRAPH_VIEW: {
        id: 'TR_GRAPH_VIEW',
        defaultMessage: 'Graph View',
    },
    TR_SHOW_GRAPH: {
        id: 'TR_SHOW_GRAPH',
        defaultMessage: 'Show Graph',
    },
    TR_HIDE_GRAPH: {
        id: 'TR_HIDE_GRAPH',
        defaultMessage: 'Hide graph',
    },
    TR_DATE_DAY_LONG: {
        id: 'TR_DATE_DAY_LONG',
        defaultMessage: '1 day',
    },
    TR_DATE_DAY_SHORT: {
        id: 'TR_DATE_DAY_SHORT',
        defaultMessage: '1D',
    },
    TR_DATE_WEEK_LONG: {
        id: 'TR_DATE_WEEK_LONG',
        defaultMessage: '1 week',
    },
    TR_DATE_WEEK_SHORT: {
        id: 'TR_DATE_WEEK_SHORT',
        defaultMessage: '1W',
    },
    TR_DATE_MONTH_LONG: {
        id: 'TR_DATE_MONTH_LONG',
        defaultMessage: '1 month',
    },
    TR_DATE_MONTH_SHORT: {
        id: 'TR_DATE_MONTH_SHORT',
        defaultMessage: '1M',
    },
    TR_DATE_YEAR_LONG: {
        id: 'TR_DATE_YEAR_LONG',
        defaultMessage: '1 year',
    },
    TR_DATE_YEAR_SHORT: {
        id: 'TR_DATE_YEAR_SHORT',
        defaultMessage: '1Y',
    },
    TR_SUITE_META_DESCRIPTION: {
        id: 'TR_SUITE_META_DESCRIPTION',
        defaultMessage:
            'New desktop & browser app for Trezor hardware wallets. Trezor Suite brings significant improvements across our three key pillars of usability, security, and privacy.',
    },
    TR_DATABASE_UPGRADE_BLOCKED: {
        id: 'TR_DATABASE_UPGRADE_BLOCKED',
        defaultMessage: 'Database upgrade blocked by another app instance',
    },
    TR_THIS_INSTANCE_IS_BLOCKING: {
        id: 'TR_THIS_INSTANCE_IS_BLOCKING',
        defaultMessage: 'This instance is blocking a database upgrade',
    },
    TR_RUNNING_MULTIPLE_INSTANCES: {
        id: 'TR_RUNNING_MULTIPLE_INSTANCES',
        defaultMessage:
            'It seems you are running multiple instances of the app. If you are using Suite in other window or tab, close it and refresh the app.',
    },
    TR_BUG: {
        id: 'TR_BUG',
        defaultMessage: 'Bug',
    },
    TR_SUGGESTION: {
        id: 'TR_SUGGESTION',
        defaultMessage: 'Feedback',
    },
    TR_GUIDE_DASHBOARD: {
        id: 'TR_GUIDE_DASHBOARD',
        defaultMessage: 'Dashboard',
    },
    TR_GUIDE_BUG_LABEL: {
        id: 'TR_GUIDE_BUG_LABEL',
        defaultMessage: 'Is something wrong?',
    },
    TR_GUIDE_SUGGESTION_LABEL: {
        id: 'TR_GUIDE_SUGGESTION_LABEL',
        defaultMessage: 'How are we doing?',
    },
    TR_GUIDE_SUPPORT: {
        id: 'TR_GUIDE_SUPPORT',
        defaultMessage: 'Contact Trezor Support',
    },
    TR_GUIDE_FORUM: {
        id: 'TR_GUIDE_FORUM',
        defaultMessage: 'Trezor Forum',
    },
    TR_GUIDE_FORUM_LABEL: {
        id: 'TR_GUIDE_FORUM_LABEL',
        defaultMessage: 'Connect with the Trezor community',
    },
    TR_GUIDE_SUPPORT_AND_FEEDBACK: {
        id: 'TR_GUIDE_SUPPORT_AND_FEEDBACK',
        defaultMessage: 'Support & Feedback',
    },
    TR_GUIDE_ARTICLES: {
        id: 'TR_GUIDE_ARTICLES',
        defaultMessage: 'Articles',
    },
    TR_GUIDE_VIEW_HEADLINE_LEARN_AND_DISCOVER: {
        id: 'TR_GUIDE_VIEW_HEADLINE_LEARN_AND_DISCOVER',
        defaultMessage: 'Suite Guide',
    },
    TR_GUIDE_VIEW_HEADLINES_SUPPORT_FEEDBACK_SELECTION: {
        id: 'TR_GUIDE_VIEW_HEADLINES_SUPPORT_FEEDBACK_SELECTION',
        defaultMessage: 'Support & Feedback',
    },
    TR_GUIDE_VIEW_HEADLINE_HELP_US_IMPROVE: {
        id: 'TR_GUIDE_VIEW_HEADLINE_HELP_US_IMPROVE',
        defaultMessage: 'Help us improve',
    },
    TR_GUIDE_VIEW_HEADLINE_NEED_HELP: {
        id: 'TR_GUIDE_VIEW_HEADLINE_NEED_HELP',
        defaultMessage: 'Need help?',
    },
    TR_GUIDE_VIEW_HEADLINE_REPORT_BUG: {
        id: 'TR_GUIDE_VIEW_HEADLINE_REPORT_BUG',
        defaultMessage: 'Report a bug',
    },
    TR_GUIDE_VIEW_HEADLINE_SUGGEST: {
        id: 'TR_GUIDE_VIEW_HEADLINE_SUGGEST',
        defaultMessage: 'Feedback',
    },
    TR_GUIDE_FEEDBACK_CATEGORY_HEADLINE: {
        id: 'TR_GUIDE_FEEDBACK_CATEGORY_HEADLINE',
        defaultMessage: 'Location in the app',
    },
    TR_GUIDE_FEEDBACK_BUG_TEXT_HEADLINE: {
        id: 'TR_GUIDE_FEEDBACK_BUG_TEXT_HEADLINE',
        defaultMessage: "What's the issue?",
    },
    TR_GUIDE_FEEDBACK_RATING_HEADLINE: {
        id: 'TR_GUIDE_FEEDBACK_RATING_HEADLINE',
        defaultMessage: 'Enjoying Suite?',
    },
    TR_GUIDE_FEEDBACK_SUGGESTION_TEXT_HEADLINE: {
        id: 'TR_GUIDE_FEEDBACK_SUGGESTION_TEXT_HEADLINE',
        defaultMessage: 'How can we improve?',
    },
    TR_GUIDE_FEEDBACK_SEND_REPORT: {
        id: 'TR_GUIDE_FEEDBACK_SEND_REPORT',
        defaultMessage: 'Submit',
    },
    TR_GUIDE_FEEDBACK_SYSTEM_INFO_NOTICE: {
        id: 'TR_GUIDE_FEEDBACK_SYSTEM_INFO_NOTICE',
        defaultMessage: 'Your basic system info will be shared anonymously',
    },
    TR_GUIDE_FEEDBACK_SENT: {
        id: 'TR_GUIDE_FEEDBACK_SENT',
        defaultMessage: 'The message has been sent. Thank you!',
    },
    TR_GUIDE_FEEDBACK_ERROR: {
        id: 'TR_GUIDE_FEEDBACK_ERROR',
        defaultMessage: 'A server error has occurred. Please try again later.',
    },
    TR_ONBOARDING_STEP_WALLET: {
        id: 'TR_ONBOARDING_STEP_WALLET',
        defaultMessage: 'Wallet',
    },
    TR_ONBOARDING_CURRENT_VERSION: {
        id: 'TR_ONBOARDING_CURRENT_VERSION',
        defaultMessage: 'Current version',
    },
    TR_ONBOARDING_NEW_VERSION: {
        id: 'TR_ONBOARDING_NEW_VERSION',
        defaultMessage: 'Latest version',
    },
    TR_RECOVERY_MATRIX_DISPLAYED_ON_TREZOR: {
        id: 'TR_RECOVERY_MATRIX_DISPLAYED_ON_TREZOR',
        defaultMessage: 'The letters are displayed on your Trezor',
    },
    TR_PIN_MATRIX_DISPLAYED_ON_TREZOR: {
        id: 'TR_PIN_MATRIX_DISPLAYED_ON_TREZOR',
        defaultMessage: 'The numbers are displayed on your Trezor',
    },
    TR_DEVICE_CONNECTED: {
        id: 'TR_DEVICE_CONNECTED',
        defaultMessage: 'Device connected',
    },
    TR_DEVICE_CONNECTED_WRONG_STATE: {
        id: 'TR_DEVICE_CONNECTED_WRONG_STATE',
        defaultMessage: 'Device detected in incorrect state',
    },
    TR_DEVICE_CONNECTED_BOOTLOADER: {
        id: 'TR_DEVICE_CONNECTED_BOOTLOADER',
        defaultMessage: 'Device connected in bootloader',
    },
    TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT: {
        id: 'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT',
        defaultMessage: 'In bootloader by mistake?',
    },
    TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_NO_BUTTON: {
        id: 'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_NO_BUTTON',
        defaultMessage: 'Reconnect the device without touching any buttons.',
    },
    TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_NO_TOUCH: {
        id: 'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_NO_TOUCH',
        defaultMessage: 'Reconnect the device without touching the screen.',
    },
    TR_WIPE_OR_UPDATE: {
        id: 'TR_WIPE_OR_UPDATE',
        defaultMessage: 'Reset device or update firmware',
    },
    TR_WIPE_OR_UPDATE_DESCRIPTION: {
        id: 'TR_WIPE_OR_UPDATE_DESCRIPTION',
        defaultMessage: 'Go to device settings.',
    },
    TR_YOU_HAVE_CONNECTED: {
        id: 'TR_YOU_HAVE_CONNECTED',
        defaultMessage: "You've connected a",
    },
    TR_CONNECTED_DIFFERENT_DEVICE: {
        id: 'TR_CONNECTED_DIFFERENT_DEVICE',
        defaultMessage: 'Connected a different device?',
    },
    TR_ONBOARDING_DEVICE_CHECK: {
        id: 'TR_ONBOARDING_DEVICE_CHECK',
        defaultMessage: 'Device security check',
        description:
            'Heading for an onboarding step where we ask the user to verify authenticity of his device',
    },
    TR_USED_TREZOR_BEFORE: {
        id: 'TR_USED_TREZOR_BEFORE',
        defaultMessage: 'Have you used this Trezor before?',
    },
    TR_ONBOARDING_DEVICE_CHECK_1: {
        id: 'TR_ONBOARDING_DEVICE_CHECK_1',
        defaultMessage: 'My <strong>hologram</strong> was intact and untampered with.',
    },
    TR_ONBOARDING_DEVICE_CHECK_2: {
        id: 'TR_ONBOARDING_DEVICE_CHECK_2',
        defaultMessage:
            'My device was bought from the <shop>official Trezor Shop</shop> or a <reseller>trusted reseller</reseller>.',
    },
    TR_ONBOARDING_DEVICE_CHECK_3: {
        id: 'TR_ONBOARDING_DEVICE_CHECK_3',
        defaultMessage: 'The device package was intact and untampered with.',
    },
    TR_ONBOARDING_DEVICE_CHECK_4: {
        id: 'TR_ONBOARDING_DEVICE_CHECK_4',
        description: 'Shown only if device has firmware already installed',
        defaultMessage:
            'Firmware is already installed on the connected Trezor. Only continue with setup if you have used this Trezor before.',
    },
    TR_I_HAVE_NOT_USED_IT: {
        id: 'TR_I_HAVE_NOT_USED_IT',
        defaultMessage: "No, I haven't",
    },
    TR_I_HAVE_DOUBTS: {
        id: 'TR_I_HAVE_DOUBTS',
        defaultMessage: 'I have doubts',
    },
    TR_DEVICE_COMPROMISED_HEADING: {
        id: 'TR_DEVICE_COMPROMISED_HEADING',
        defaultMessage: 'Your device may have been compromised',
    },
    TR_DEVICE_COMPROMISED_TEXT: {
        id: 'TR_DEVICE_COMPROMISED_TEXT',
        defaultMessage:
            "Contact Trezor Support to figure out what's going on with your device and what to do next.",
    },
    TR_DEVICE_COMPROMISED_HEADING_SOFT: {
        id: 'TR_PLAY_IT_SAFE',
        defaultMessage: "Let's play it safe",
    },
    TR_DEVICE_COMPROMISED_TEXT_SOFT: {
        id: 'TR_DEVICE_COMPROMISED_TEXT_SOFT',
        defaultMessage:
            'We want to be sure that your device is in tip-top shape before you start using it. Reach out to Trezor Support to find out what to do next.',
    },
    TR_DISCONNECT_DEVICE: {
        id: 'TR_DISCONNECT_DEVICE',
        defaultMessage: 'Disconnect your device from your laptop or computer.',
    },
    TR_AVOID_USING_DEVICE: {
        id: 'TR_AVOID_USING_DEVICE',
        defaultMessage: 'Avoid using this device or sending any funds to it.',
    },
    TR_USE_CHAT: {
        id: 'TR_USE_CHAT',
        defaultMessage: 'Click below and use the <b>Chat</b> option on the next page.',
    },
    TR_CONTACT_TREZOR_SUPPORT: {
        id: 'TR_CONTACT_TREZOR_SUPPORT',
        defaultMessage: 'Contact Trezor Support',
    },
    TR_LETS_CHECK_YOUR_DEVICE: {
        id: 'TR_LETS_CHECK_YOUR_DEVICE',
        defaultMessage: 'Let’s check your device',
    },
    TR_CHECKING_YOUR_DEVICE: {
        id: 'TR_CHECKING_YOUR_DEVICE',
        defaultMessage: 'Checking your device',
    },
    TR_AUTHENTICATE_DEVICE_DESCRIPTION: {
        id: 'TR_AUTHENTICATE_DEVICE_DESCRIPTION',
        defaultMessage: 'We just want to make sure that your Trezor is legit.',
    },
    TR_DEVICE_AUTHENTICITY_ITEM_1: {
        id: 'TR_DEVICE_AUTHENTICITY_ITEM_1',
        defaultMessage:
            "This check is a must-do step to ensure your device's reliability, integrity, and secure use.",
    },
    TR_DEVICE_AUTHENTICITY_ITEM_2: {
        id: 'TR_DEVICE_AUTHENTICITY_ITEM_2',
        defaultMessage:
            'This confirms that the chip inside your hardware wallet is genuine and from Trezor.',
    },
    TR_DEVICE_AUTHENTICITY_ITEM_3: {
        id: 'TR_DEVICE_AUTHENTICITY_ITEM_3',
        defaultMessage:
            'Once your device has been given a clean bill of health, you’re all set to Trezor with confidence.',
    },
    TR_START_CHECK: {
        id: 'TR_START_CHECK',
        defaultMessage: 'Start',
    },
    TR_CONGRATS: {
        id: 'TR_CONGRATS',
        defaultMessage: 'Congrats!',
    },
    TR_DEVICE_AUTHENTICITY_SUCCESS_DESCRIPTION: {
        id: 'TR_DEVICE_AUTHENTICITY_SUCCESS_DESCRIPTION',
        defaultMessage: 'Your {deviceName} is ready to go!',
    },
    TR_CHECK_DEVICE_ORIGIN_TITLE: {
        id: 'TR_CHECK_DEVICE_ORIGIN_TITLE',
        defaultMessage: 'Check device',
    },
    TR_CHECK_DEVICE_ORIGIN_DESCRIPTION: {
        id: 'TR_CHECK_DEVICE_ORIGIN_DESCRIPTION',
        defaultMessage:
            "We'll verify the integrity of your Trezor device, ensuring its safety and confirming the authenticity of the chip.",
    },
    TR_CHECK_ORIGIN: {
        id: 'TR_CHECK_ORIGIN',
        defaultMessage: 'Check device',
    },
    TR_DEVICE_AUTHENTICITY_OPT_OUT_TITLE: {
        id: 'TR_DEVICE_AUTHENTICITY_OPT_OUT_TITLE',
        defaultMessage: 'Turn off device check',
    },
    TR_DEVICE_AUTHENTICITY_OPT_OUT_TITLE_DISABLED: {
        id: 'TR_DEVICE_AUTHENTICITY_OPT_OUT_TITLE_DISABLED',
        defaultMessage: 'Turn on device check',
    },
    TR_DEVICE_AUTHENTICITY_OPT_OUT_DESCRIPTION: {
        id: 'TR_DEVICE_AUTHENTICITY_OPT_OUT_DESCRIPTION',
        defaultMessage:
            'Device check is a vital security feature that keeps you safe from potentially using a fake or compromised device. We don’t recommend turning it off.',
    },
    TR_DEVICE_AUTHENTICITY_OPT_OUT_DESCRIPTION_DISABLED: {
        id: 'TR_DEVICE_AUTHENTICITY_OPT_OUT_DESCRIPTION_DISABLED',
        defaultMessage:
            'Device check is a vital security feature that keeps you safe from potentially using a fake or compromised device. We strongly recommend turning it on.',
    },
    TR_DEVICE_AUTHENTICITY_OPT_OUT_BUTTON: {
        id: 'TR_DEVICE_AUTHENTICITY_OPT_OUT_BUTTON',
        defaultMessage: 'Turn off',
    },
    TR_DEVICE_AUTHENTICITY_OPT_OUT_BUTTON_DISABLED: {
        id: 'TR_DEVICE_AUTHENTICITY_OPT_OUT_BUTTON_DISABLED',
        defaultMessage: 'Turn on',
    },
    TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_BUTTON: {
        id: 'TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_BUTTON',
        defaultMessage: 'Turn off',
    },
    TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_CHECKBOX_TITLE: {
        id: 'TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_CHECKBOX_TITLE',
        defaultMessage: 'I’ve read and understood the above',
    },
    TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_1: {
        id: 'TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_1',
        defaultMessage:
            "Only turn off the device check if you're fully aware of what you're doing and have clear reasons for doing so. If you're uncertain, contact Trezor Support for assistance.",
    },
    TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_2: {
        id: 'TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_2',
        defaultMessage:
            'Don’t turn off this feature unless your device has successfully passed the check before. Using an unverified device may lead to the loss of your funds.',
    },
    TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_3: {
        id: 'TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_3',
        defaultMessage:
            'Trezor Support will never ask you to turn off the device check. This feature has been designed to ensure your security.',
    },
    TR_DEVICE_FIRMWARE_REVISION_CHECK_TITLE: {
        id: 'TR_DEVICE_FIRMWARE_REVISION_CHECK_TITLE',
        defaultMessage: 'Turn off firmware revision check',
    },
    TR_DEVICE_FIRMWARE_REVISION_CHECK_TITLE_DISABLED: {
        id: 'TR_DEVICE_FIRMWARE_REVISION_CHECK_TITLE_DISABLED',
        defaultMessage: 'Turn on firmware revision check',
    },
    TR_DEVICE_FIRMWARE_REVISION_CHECK_DESCRIPTION: {
        id: 'TR_DEVICE_FIRMWARE_REVISION_CHECK_DESCRIPTION',
        defaultMessage:
            'Firmware revision check is a crucial security feature. We strongly recommend keeping it turned on.',
    },
    TR_DEVICE_FIRMWARE_REVISION_CHECK_DESCRIPTION_DISABLED: {
        id: 'TR_DEVICE_FIRMWARE_REVISION_CHECK_DESCRIPTION_DISABLED',
        defaultMessage:
            'Firmware revision check is a crucial security feature. We strongly recommend keeping it turned on.',
    },
    TR_DEVICE_FIRMWARE_REVISION_CHECK_BUTTON: {
        id: 'TR_DEVICE_FIRMWARE_REVISION_CHECK_BUTTON',
        defaultMessage: 'Turn off',
    },
    TR_DEVICE_FIRMWARE_REVISION_CHECK_BUTTON_DISABLED: {
        id: 'TR_DEVICE_FIRMWARE_REVISION_CHECK_BUTTON_DISABLED',
        defaultMessage: 'Turn on',
    },
    TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_BUTTON: {
        id: 'TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_BUTTON',
        defaultMessage: 'Turn off',
    },
    TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_DESCRIPTION_1: {
        id: 'TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_DESCRIPTION_1',
        defaultMessage:
            'Turn off the firmware revision check only if you fully understand the risks and have a valid reason. If unsure, contact Trezor Support for help.',
    },
    TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_DESCRIPTION_2: {
        id: 'TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_DESCRIPTION_2',
        defaultMessage:
            'Only turn off this feature if your device has successfully passed the check before. Using an unverified device could result in the loss of your funds.',
    },
    TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_DESCRIPTION_3: {
        id: 'TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_DESCRIPTION_3',
        defaultMessage:
            'Trezor Support will never ask you to turn off the firmware revision check. This feature is designed to protect your security.',
    },
    TR_FIRMWARE_REVISION_CHECK_FAILED: {
        id: 'TR_FIRMWARE_REVISION_CHECK_FAILED',
        defaultMessage: 'Firmware revision check failed. Your Trezor may be counterfeit.',
    },
    TR_DEVICE_FIRMWARE_REVISION_CHECK_UNABLE_TO_PERFORM: {
        id: 'TR_DEVICE_FIRMWARE_REVISION_CHECK_UNABLE_TO_PERFORM',
        defaultMessage:
            "Firmware revision check couldn't be performed. Go online to verify your firmware version.",
    },
    TR_FIRMWARE_REVISION_CHECK_OTHER_ERROR: {
        id: 'TR_FIRMWARE_REVISION_CHECK_OTHER_ERROR',
        defaultMessage: "Couldn't perform firmware revision check.",
    },
    TR_DEVICE_FIRMWARE_HASH_CHECK_HASH_MISMATCH: {
        id: 'TR_DEVICE_FIRMWARE_HASH_CHECK_HASH_MISMATCH',
        defaultMessage: 'Firmware hash check failed. Your Trezor may be counterfeit.',
    },
    TR_DEVICE_FIRMWARE_HASH_CHECK_UNKNOWN_RELEASE: {
        id: 'TR_DEVICE_FIRMWARE_HASH_CHECK_UNKNOWN_RELEASE',
        defaultMessage: 'Firmware unrecognized. Your Trezor may be counterfeit.',
    },
    TR_DEVICE_FIRMWARE_HASH_CHECK_OTHER_ERROR: {
        id: 'TR_DEVICE_FIRMWARE_HASH_CHECK_OTHER_ERROR',
        defaultMessage:
            "Firmware hash check couldn't be performed. Your Trezor may be counterfeit.",
    },
    TR_ONBOARDING_COINS_STEP: {
        id: 'TR_ONBOARDING_COINS_STEP',
        defaultMessage: 'Activate coins',
    },
    TR_ONBOARDING_COINS_STEP_DESCRIPTION: {
        id: 'TR_ONBOARDING_COINS_STEP_DESCRIPTION',
        defaultMessage:
            'Select which coins to show in Trezor Suite. You can change this setting anytime.',
    },
    TR_ONBOARDING_COINS_STEP_DESCRIPTION_BITCOIN_ONLY: {
        id: 'TR_ONBOARDING_COINS_STEP_DESCRIPTION_BITCOIN_ONLY',
        defaultMessage:
            'Select which coins to show in Trezor Suite. You can change this setting anytime.',
    },
    TR_WHAT_DATA_WE_COLLECT: {
        id: 'TR_WHAT_DATA_WE_COLLECT',
        defaultMessage: 'What data do we collect?',
    },
    TR_ONBOARDING_TROUBLESHOOTING_FAILED: {
        id: 'TR_ONBOARDING_TROUBLESHOOTING_FAILED',
        defaultMessage: 'Still not working?',
        decription:
            "If troubleshooting steps for connecting a device in Onboarding didn't do the trick there is at the end link to contact a support",
    },
    TR_STILL_DONT_SEE_YOUR_TREZOR: {
        id: 'TR_STILL_DONT_SEE_YOUR_TREZOR',
        defaultMessage: 'Still don’t see your Trezor?',
    },
    TR_ONBOARDING_ADVANCED: {
        id: 'TR_ONBOARDING_ADVANCED',
        defaultMessage: 'Advanced',
    },
    TR_ONBOARDING_DOWNLOAD_DESKTOP_APP: {
        id: 'TR_ONBOARDING_DOWNLOAD_DESKTOP_APP',
        defaultMessage: 'Download desktop app',
    },
    TR_DATA_ANALYTICS_CATEGORY_1: {
        id: 'TR_DATA_ANALYTICS_CATEGORY_1',
        defaultMessage: 'Platform',
    },
    TR_DATA_ANALYTICS_CATEGORY_1_ITEM_1: {
        id: 'TR_DATA_ANALYTICS_CATEGORY_1_ITEM_1',
        defaultMessage: 'OS, Trezor model, version etc.',
    },
    TR_DATA_ANALYTICS_CATEGORY_2: {
        id: 'TR_DATA_ANALYTICS_CATEGORY_2',
        defaultMessage: 'Usage',
    },
    TR_DATA_ANALYTICS_CATEGORY_2_ITEM_1: {
        id: 'TR_DATA_ANALYTICS_CATEGORY_2_ITEM_1',
        defaultMessage: 'How you use Suite',
    },
    TR_DATA_ANALYTICS_CATEGORY_3: {
        id: 'TR_DATA_ANALYTICS_CATEGORY_3',
        defaultMessage: 'Audience',
    },
    TR_DATA_ANALYTICS_CATEGORY_3_ITEM_1: {
        id: 'TR_DATA_ANALYTICS_CATEGORY_3_ITEM_1',
        defaultMessage: 'Language, user count, etc.',
    },
    TR_TROUBLESHOOTING_DEVICE_NOT_DETECTED: {
        defaultMessage: 'Try these steps to solve this issue.',
        id: 'TR_TROUBLESHOOTING_DEVICE_NOT_DETECTED',
    },
    TR_TROUBLESHOOTING_TIP_BRIDGE_STATUS_TITLE: {
        defaultMessage: 'Ensure the Trezor Bridge process is running',
        id: 'TR_TROUBLESHOOTING_TIP_BRIDGE_STATUS_TITLE',
    },
    TR_TROUBLESHOOTING_TIP_BRIDGE_STATUS_DESCRIPTION: {
        defaultMessage: 'Visit <a>Trezor Bridge status page</a>',
        id: 'TR_TROUBLESHOOTING_TIP_BRIDGE_STATUS_DESCRIPTION',
    },
    TR_TROUBLESHOOTING_TIP_BROWSER_WEBUSB_TITLE: {
        defaultMessage: 'Use a Chromium-based browser',
        id: 'TR_TROUBLESHOOTING_TIP_BROWSER_WEBUSB_TITLE',
    },
    TR_TROUBLESHOOTING_TIP_BROWSER_WEBUSB_DESCRIPTION: {
        defaultMessage:
            'Only Chromium-based browsers currently allow direct communication with USB devices.',
        id: 'TR_TROUBLESHOOTING_TIP_BROWSER_WEBUSB_DESCRIPTION',
    },
    TR_TROUBLESHOOTING_TIP_SUITE_DESKTOP_TITLE: {
        id: 'TR_TROUBLESHOOTING_TIP_SUITE_DESKTOP_TITLE',
        defaultMessage: 'Use the Trezor Suite desktop app',
    },
    TR_TROUBLESHOOTING_TIP_SUITE_DESKTOP_DESCRIPTION: {
        id: 'TR_TROUBLESHOOTING_TIP_SUITE_DESKTOP_DESCRIPTION',
        defaultMessage: 'Run the  <a>Trezor Suite</a> desktop app',
    },
    TR_TROUBLESHOOTING_TIP_UDEV_INSTALL_DESCRIPTION: {
        id: 'TR_TROUBLESHOOTING_TIP_UDEV_INSTALL_DESCRIPTION',
        defaultMessage:
            'Try installing <a>udev rules</a>. Make sure they are saved to the desktop before opening.',
    },
    TR_TROUBLESHOOTING_CLOSE_TABS: {
        defaultMessage: 'Close other tabs and windows that might be using your Trezor',
        id: 'TR_TROUBLESHOOTING_CLOSE_TABS',
    },
    TR_TROUBLESHOOTING_CLOSE_TABS_DESCRIPTION: {
        defaultMessage: 'After closing other tabs and windows, try refreshing this page.',
        id: 'TR_TROUBLESHOOTING_CLOSE_TABS_DESCRIPTION',
    },
    TR_TROUBLESHOOTING_CLOSE_TABS_DESCRIPTION_DESKTOP: {
        defaultMessage:
            'After closing other browser tabs and windows, try quitting and reopening Trezor Suite.',
        id: 'TR_TROUBLESHOOTING_CLOSE_TABS_DESCRIPTION_DESKTOP',
    },
    TR_TROUBLESHOOTING_TIP_CABLE_TITLE: {
        id: 'TR_TROUBLESHOOTING_TIP_CABLE_TITLE',
        defaultMessage: 'Try a different cable',
    },
    TR_TROUBLESHOOTING_TIP_CABLE_DESCRIPTION: {
        id: 'TR_TROUBLESHOOTING_TIP_CABLE_DESCRIPTION',
        defaultMessage:
            'The cable must be fully inserted. In case of a USB-C connected device, the cable should click into place.',
    },
    TR_TROUBLESHOOTING_TIP_USB_PORT_TITLE: {
        id: 'TR_TROUBLESHOOTING_TIP_USB_PORT_TITLE',
        defaultMessage: 'Try a different USB port',
    },
    TR_TROUBLESHOOTING_TIP_USB_PORT_DESCRIPTION: {
        id: 'TR_TROUBLESHOOTING_TIP_USB_PORT_DESCRIPTION',
        defaultMessage: 'Connect it directly to your computer (without a USB hub).',
    },
    TR_TROUBLESHOOTING_TIP_COMPUTER_TITLE: {
        id: 'TR_TROUBLESHOOTING_TIP_COMPUTER_TITLE',
        defaultMessage: 'Try using a different computer, if you can',
    },
    TR_TROUBLESHOOTING_TIP_COMPUTER_DESCRIPTION: {
        id: 'TR_TROUBLESHOOTING_TIP_COMPUTER_DESCRIPTION',
        defaultMessage: 'With Trezor Bridge installed.',
    },
    TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_TITLE: {
        id: 'TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_TITLE',
        defaultMessage: 'Restart your computer',
    },
    TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_DESCRIPTION: {
        id: 'TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_DESCRIPTION',
        defaultMessage:
            'Restarting your computer may fix the communication issue between your browser and device.',
    },
    TR_TROUBLESHOOTING_UNREADABLE_WEBUSB: {
        id: 'TR_TROUBLESHOOTING_UNREADABLE_WEBUSB',
        defaultMessage:
            "Your device is connected properly, but your browser can't communicate with it at the moment. You need to install Trezor Bridge.",
    },
    TR_TROUBLESHOOTING_UNREADABLE_UDEV: {
        id: 'TR_TROUBLESHOOTING_UNREADABLE_UDEV',
        defaultMessage: 'Missing udev rules',
    },
    TR_TROUBLESHOOTING_UNREADABLE_UNKNOWN: {
        id: 'TR_TROUBLESHOOTING_UNREADABLE_UNKNOWN',
        defaultMessage: 'Unexpected state: {error}',
    },
    TR_TROUBLESHOOTING_UDEV_INSTALL_TITLE: {
        id: 'TR_TROUBLESHOOTING_UDEV_INSTALL_TITLE',
        defaultMessage: 'Install rules automatically',
    },
    TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_TITLE: {
        id: 'TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_TITLE',
        defaultMessage: "Seedless setup isn't supported in Trezor Suite",
    },
    TR_VERIFYING_PIN: {
        id: 'TR_VERIFYING_PIN',
        defaultMessage: 'Verifying...',
    },
    TR_ONBOARDING_CLICK_TO_CONFIRM: {
        id: 'TR_ONBOARDING_CLICK_TO_CONFIRM',
        defaultMessage: 'Click to confirm you understand the instructions below',
    },
    TR_LEARN_ADVANCED_RECOVERY: {
        id: 'TR_LEARN_ADVANCED_RECOVERY',
        defaultMessage: 'Learn how to enter letters',
    },
    TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_DESCRIPTION: {
        id: 'TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_DESCRIPTION',
        defaultMessage:
            "Devices set up in seedless mode can't access Trezor Suite. This is to avoid irreversible coin loss, which happens when using an improperly set up device for the wrong purpose.",
    },
    TR_DO_YOU_REALLY_WANT_TO_SKIP: {
        id: 'TR_DO_YOU_REALLY_WANT_TO_SKIP',
        defaultMessage: 'Skip this step?',
    },
    TR_FORMAT: {
        id: 'TR_FORMAT',
        defaultMessage: 'Format',
    },
    TR_FORMAT_TOOLTIP: {
        id: 'TR_FORMAT_TOOLTIP',
        defaultMessage:
            '<FormatDescription> <span>Trezor</span> – standard signature format according to BIP137 </FormatDescription> <FormatDescription> <span>Electrum</span> – compatibility signature format </FormatDescription>',
    },
    TR_BIP_SIG_FORMAT: {
        id: 'TR_BIP_SIG_FORMAT',
        defaultMessage: 'Trezor',
    },
    TR_COMPATIBILITY_SIG_FORMAT: {
        id: 'TR_COMPATIBILITY_SIG_FORMAT',
        defaultMessage: 'Electrum',
    },
    TR_COPY_AND_CLOSE: {
        id: 'TR_COPY_AND_CLOSE',
        defaultMessage: 'Copy & Close',
    },
    TR_COPY_SIGNED_MESSAGE: {
        id: 'TR_COPY_SIGNED_MESSAGE',
        defaultMessage: 'Copy signed message',
    },
    TR_NAV_STAKING: {
        defaultMessage: 'Staking',
        id: 'TR_NAV_STAKING',
    },
    TR_ACCOUNT_TYPE_SHELLEY: {
        defaultMessage: 'Shelley',
        id: 'TR_ACCOUNT_TYPE_SHELLEY',
    },
    TR_NETWORK_CARDANO_TESTNET: {
        defaultMessage: 'Cardano Testnet',
        id: 'TR_NETWORK_CARDANO_TESTNET',
    },
    TR_STAKING_REWARDS_TITLE: {
        id: 'TR_STAKING_REWARDS_TITLE',
        defaultMessage: 'Cardano Staking is Active',
    },
    TR_STAKING_STAKE_TITLE: {
        id: 'TR_STAKING_STAKE_TITLE',
        defaultMessage: 'Cardano Staking is NOT Active',
    },
    TR_STAKING_STAKE_ADDRESS: {
        id: 'TR_STAKING_STAKE_ADDRESS',
        defaultMessage: 'Your stake address',
    },
    TR_STAKING_DELEGATE: {
        id: 'TR_STAKING_DELEGATE',
        defaultMessage: 'Delegate',
    },
    TR_STAKING_REDELEGATE: {
        id: 'TR_STAKING_REDELEGATE',
        defaultMessage: 'Redelegate',
    },
    TR_STAKING_WITHDRAW: {
        id: 'TR_STAKING_WITHDRAW',
        defaultMessage: 'Withdraw',
    },
    TR_STAKING_ESTIMATED_GAINS: {
        id: 'TR_STAKING_ESTIMATED_GAINS',
        defaultMessage: 'Estimated gains',
    },
    TR_STAKING_ONCE_YOU_CONFIRM: {
        id: 'TR_STAKING_ONCE_YOU_CONFIRM',
        defaultMessage: 'Once you confirm',
    },
    TR_STAKING_YOUR_EARNINGS: {
        id: 'TR_STAKING_YOUR_EARNINGS',
        defaultMessage:
            'Your earnings are automatically restaked, allowing you to earn <a>compound interest</a>.',
    },
    TR_STAKE_ON_EVERSTAKE: {
        id: 'TR_STAKE_ON_EVERSTAKE',
        defaultMessage: 'Stake {symbol} on Everstake?',
    },
    TR_CLAIM_FROM_EVERSTAKE: {
        id: 'TR_CLAIM_FROM_EVERSTAKE',
        defaultMessage: 'Claim {symbol} from Everstake?',
    },
    TR_UNSTAKE_FROM_EVERSTAKE: {
        id: 'TR_UNSTAKE_FROM_EVERSTAKE',
        defaultMessage: 'Unstake {symbol} from Everstake?',
    },
    TR_TX_WITHDRAWAL: {
        id: 'TR_TX_WITHDRAWAL',
        defaultMessage: 'Withdrawal',
        description: 'Label for withdrawal amount in transaction detail',
    },
    TR_TX_DEPOSIT: {
        id: 'TR_TX_DEPOSIT',
        defaultMessage: 'Deposit',
        description: 'Label for a deposit amount in transaction detail',
    },
    TR_STAKING_DEPOSIT: {
        id: 'TR_STAKING_DEPOSIT',
        defaultMessage: 'Refundable Deposit',
    },
    TR_STAKING_FEE: {
        id: 'TR_STAKING_FEE',
        defaultMessage: 'Fee',
    },
    TR_STAKING_REWARDS: {
        id: 'TR_STAKING_REWARDS',
        defaultMessage: 'Available Rewards',
    },
    TR_STAKING_REWARDS_DESCRIPTION: {
        id: 'TR_STAKING_REWARDS_DESCRIPTION',
        defaultMessage:
            'Please note that it can take up to 20 days until you start receiving your rewards after initial stake registration and delegation. After this period is completed you will receive your reward every 5 days.',
    },
    TR_STAKING_STAKE_DESCRIPTION: {
        id: 'TR_STAKING_STAKE_DESCRIPTION',
        defaultMessage:
            'Staking Cardano is a great way to earn ADA staking rewards as a form of passive income for holding Cardano.{br}By staking your ADA, you actively support the Cardano network and contribute to the stability of the network.',
    },
    TR_STAKING_DEPOSIT_FEE_DECRIPTION: {
        id: 'TR_STAKING_DEPOSIT_FEE_DECRIPTION',
        defaultMessage:
            'The deposit fee is {feeAmount} ADA and is required to register your address to start staking. If you choose to unstake your Cardano you will get the deposit back.',
    },
    TR_STAKING_NOT_ENOUGH_FUNDS: {
        id: 'TR_STAKING_NOT_ENOUGH_FUNDS',
        defaultMessage: "You don't have enough funds on your account.",
    },
    TR_STAKING_TREZOR_POOL_FAIL: {
        id: 'TR_STAKING_TREZOR_POOL_FAIL',
        defaultMessage: "Couldn't reach Trezor stake pool to delegate on.",
    },
    TR_STAKING_TX_PENDING: {
        id: 'TR_STAKING_TX_PENDING',
        defaultMessage:
            'Your transaction {txid} was successfully sent to the blockchain and is waiting for confirmation.',
    },
    TR_STAKING_ON_3RD_PARTY_TITLE: {
        id: 'TR_STAKING_ON_3RD_PARTY_TITLE',
        defaultMessage: 'You are delegating on a third-party stake pool',
    },
    TR_STAKING_ON_3RD_PARTY_DESCRIPTION: {
        id: 'TR_STAKING_ON_3RD_PARTY_DESCRIPTION',
        defaultMessage:
            'By staking on a Trezor stake pool you are directly supporting Trezor and the Cardano ecosystem within Trezor Suite.',
    },
    TR_STAKING_POOL_OVERSATURATED_TITLE: {
        id: 'TR_STAKING_POOL_OVERSATURATED_TITLE',
        defaultMessage: 'Stake pool is oversaturated',
    },
    TR_STAKING_POOL_OVERSATURATED_DESCRIPTION: {
        id: 'TR_STAKING_POOL_OVERSATURATED_DESCRIPTION',
        defaultMessage:
            'The stake pool you are delegating on is oversaturated. Please redelegate your stake to maximize your staking rewards',
    },
    TR_STAKING_IS_NOT_SUPPORTED: {
        id: 'TR_STAKING_IS_NOT_SUPPORTED',
        defaultMessage: 'Staking is not supported on this network.',
    },
    TR_STAKING_INSTANT_STAKING: {
        id: 'TR_INSTANT_STAKING',
        defaultMessage: 'Staked instantly',
    },
    TR_STAKING_AMOUNT_STAKED_INSTANTLY: {
        id: 'TR_STAKING_AMOUNT_STAKED_INSTANTLY',
        defaultMessage: '{amount} {symbol} staked instantly!',
    },
    TR_STAKING_AMOUNT_UNSTAKED_INSTANTLY: {
        id: 'TR_STAKING_AMOUNT_UNSTAKED_INSTANTLY',
        defaultMessage: '{amount} {symbol} unstaked instantly!',
    },
    TR_STAKING_INSTANT_UNSTAKING: {
        id: 'TR_INSTANT_UNSTAKING',
        defaultMessage: 'Unstaked instantly',
    },
    TR_STAKING_INSTANTLY_STAKED: {
        id: 'TR_STAKING_INSTANTLY_STAKED',
        defaultMessage:
            "You've instantly staked {amount} {symbol}. {days, plural, =0 {} one {The remaining {symbol} will be staked within # day.} other { The remaining {symbol} will be staked within # days}}",
    },
    TR_STAKING_INSTANTLY_UNSTAKED: {
        id: 'TR_STAKE_INSTANTLY_UNSTAKED_WITH_DAYS',
        defaultMessage:
            'You received {amount} {symbol} "Instantly". {days, plural, =0 {} one {The rest will be payed out within # day.} other { The rest will be payed out within # days}}',
    },
    TR_STAKING_GETTING_READY: {
        id: 'TR_STAKING_GETTING_READY',
        defaultMessage: 'Your {symbol} is getting ready to work',
    },
    TR_STAKING_REWARDS_ARE_RESTAKED: {
        id: 'TR_STAKING_REWARDS_ARE_RESTAKED',
        defaultMessage: 'Rewards are automatically restaked',
    },
    TR_STAKING_YOU_ARE_HERE: {
        id: 'TR_STAKING_YOU_ARE_HERE',
        defaultMessage: "You're here",
    },
    TR_STAKING_CONSOLIDATING_FUNDS: {
        id: 'TR_STAKING_CONSOLIDATING_FUNDS',
        defaultMessage: 'Consolidating your {symbol} for you',
    },
    TR_STAKING_YOUR_UNSTAKED_FUNDS: {
        id: 'TR_STAKING_YOUR_UNSTAKED_FUNDS',
        defaultMessage: 'Your unstaked {symbol} is ready for you',
    },
    TR_RECEIVING_SYMBOL: {
        id: 'TR_RECEIVING_SYMBOL',
        defaultMessage:
            'Receiving {multiple, select, true {multiple tokens} false {{symbol}} other {{symbol}}}',
    },
    TR_RECEIVED_SYMBOL: {
        id: 'TR_RECEIVED_SYMBOL',
        defaultMessage:
            'Received {multiple, select, true {multiple tokens} false {{symbol}} other {{symbol}}}',
    },
    TR_SENDING_SYMBOL: {
        id: 'TR_SENDING_SYMBOL',
        defaultMessage:
            'Sending {multiple, select, true {multiple tokens} false {{symbol}} other {{symbol}}}',
    },
    TR_SENT_SYMBOL: {
        id: 'TR_SENT_SYMBOL',
        defaultMessage:
            'Sent {multiple, select, true {multiple tokens} false {{symbol}} other {{symbol}}}',
    },
    TR_SENDING_SYMBOL_TO_SELF: {
        id: 'TR_SENDING_SYMBOL_TO_SELF',
        defaultMessage:
            'Sending {multiple, select, true {multiple tokens} false {{symbol}} other {{symbol}}} to myself',
    },
    TR_SENT_SYMBOL_TO_SELF: {
        id: 'TR_SENT_SYMBOL_TO_SELF',
        defaultMessage:
            'Sent {multiple, select, true {multiple tokens} false {{symbol}} other {{symbol}}} to myself',
    },
    TR_REWARDS_WITHDRAWAL: {
        id: 'TR_REWARDS_WITHDRAWAL',
        defaultMessage: 'Rewards withdrawal',
    },
    TR_STAKE_DELEGATED: {
        id: 'TR_STAKE_DELEGATED',
        defaultMessage: 'Stake delegation',
    },
    TR_STAKE_REGISTERED: {
        id: 'TR_STAKE_REGISTERED',
        defaultMessage: 'Registration of a stake address',
    },
    TR_STAKE_DEREGISTERED: {
        id: 'TR_STAKE_DEREGISTERED',
        defaultMessage: 'Deregistration of a stake address',
    },
    TR_ERROR_CARDANO_DELEGATE: {
        id: 'TR_ERROR_CARDANO_DELEGATE',
        defaultMessage: 'Amount is not enough',
    },
    TR_ERROR_CARDANO_WITHDRAWAL: {
        id: 'TR_ERROR_CARDANO_WITHDRAWAL',
        defaultMessage: 'Amount is not enough',
    },
    TR_ACCOUNT_TYPE_SHELLEY_DESC: {
        id: 'TR_ACCOUNT_TYPE_SHELLEY_DESC',
        defaultMessage:
            'Shelley era addresses have introduced a new type of wallet that can support stake delegation and earning rewards.',
    },
    TR_CARDANO_TREZOR_AMOUNT_HEADLINE: {
        id: 'TR_CARDANO_TREZOR_AMOUNT_HEADLINE',
        defaultMessage: 'Trezor amount',
    },
    TR_CARDANO_FINGERPRINT_HEADLINE: {
        id: 'TR_CARDANO_FINGERPRINT_HEADLINE',
        defaultMessage: 'Fingerprint',
    },
    TR_EXCEEDS_MAX: {
        id: 'TR_EXCEEDS_MAX',
        defaultMessage: 'Exceeds max length',
    },
    TR_ABORT: {
        id: 'TR_ABORT',
        defaultMessage: 'Abort',
    },
    FAILED_TO_ENABLE_TOR: {
        id: 'FAILED_TO_ENABLE_TOR',
        defaultMessage: 'Failed to enable Tor',
    },
    FAILED_TO_DISABLE_TOR: {
        id: 'FAILED_TO_DISABLE_TOR',
        defaultMessage: 'Failed to disable Tor',
    },
    TR_FIRMWARE_HASH_MISMATCH: {
        id: 'TR_FIRMWARE_HASH_MISMATCH',
        defaultMessage:
            'Your Trezor is running unofficial firmware. Please contact help@trezor.io immediately.',
    },
    TR_TO_SATOSHIS: {
        id: 'TR_TO_SATOSHIS',
        defaultMessage: 'To sats',
    },
    TR_TO_BTC: {
        id: 'TR_TO_BTC',
        defaultMessage: 'To BTC',
    },
    TR_BTC_UNITS: {
        id: 'TR_BTC_UNITS',
        defaultMessage: 'Bitcoin units',
    },
    TR_FAILED: {
        id: 'TR_FAILED',
        defaultMessage: 'Failed',
    },
    TR_ENABLING_TOR: {
        id: 'TR_ENABLING_TOR',
        defaultMessage: 'Enabling Tor',
    },
    TR_ENABLING_TOR_FAILED: {
        id: 'TR_ENABLING_TOR_FAILED',
        defaultMessage: 'Enabling Tor Failed',
    },
    TR_DISABLING_TOR: {
        id: 'TR_DISABLING_TOR',
        defaultMessage: 'Disabling Tor',
    },
    TR_TOR_IS_SLOW_MESSAGE: {
        id: 'TR_TOR_IS_SLOW_MESSAGE',
        defaultMessage: 'Tor is connecting to the network.<br></br>Hang in there.',
    },
    TR_CUSTOM_FIRMWARE_GITHUB: {
        id: 'TR_CUSTOM_FIRMWARE_GITHUB',
        defaultMessage: 'You can find all official releases on',
    },
    TR_FIRMWARE_CHECK_AUTHENTICITY_SUCCESS: {
        id: 'TR_FIRMWARE_CHECK_AUTHENTICITY_SUCCESS',
        defaultMessage: 'Firmware authentic',
    },
    TR_DEVICE_AUTHENTICITY_SUCCESS: {
        id: 'TR_DEVICE_AUTHENTICITY_SUCCESS',
        defaultMessage: 'Device check passed',
    },
    TR_DEVICE_AUTHENTICITY_ERROR: {
        id: 'TR_DEVICE_AUTHENTICITY_ERROR',
        defaultMessage: "We can't authenticate your device",
    },
    TR_FEE_ROUNDING_DEFAULT_WARNING: {
        id: 'TR_FEE_ROUNDING_DEFAULT_WARNING',
        defaultMessage: 'The fee rate of {feeRate} has been increased due to fee rounding',
        description: 'previously stored under key TR_FEE_ROUNDING_WARNING',
    },
    TR_FEE_ROUNDING_BASEFEE_WARNING: {
        id: 'TR_FEE_ROUNDING_BASEFEE_WARNING',
        defaultMessage:
            'The fee rate of {feeRate} has been increased to pay for the chained transactions within the mempool',
        description: 'previously stored under key TR_FEE_ROUNDING_WARNING',
    },
    TR_FEE_RATE_CHANGED: {
        id: 'TR_FEE_RATE_CHANGED',
        defaultMessage: 'Fee rate has changed to complete transaction.',
    },
    TR_COINJOIN_ROUND_COUNTDOWN_PLURAL: {
        id: 'TR_COINJOIN_ROUND_COUNTDOWN_PLURAL',
        description:
            'value including unit i.e. 5 minutes 15 seconds, firstValue for handling plural',
        defaultMessage: 'Next transaction signing starts in {value}',
    },
    TR_COINJOIN_ROUND_COUNTDOWN_OVERTIME: {
        id: 'TR_COINJOIN_ROUND_COUNTDOWN_OVERTIME',
        defaultMessage: 'a moment',
        description: 'when TR_COINJOIN_ROUND_COUNTDOWN runs out of time',
    },
    TR_VIEW: {
        id: 'TR_VIEW',
        defaultMessage: 'View',
    },
    TR_MY_COINS: {
        id: 'TR_MY_COINS',
        defaultMessage: 'Privacy',
    },
    TR_ANONYMIZING: {
        id: 'TR_ANONYMIZING',
        defaultMessage: 'Running',
    },
    TR_NOT_PRIVATE: {
        id: 'TR_NOT_PRIVATE',
        defaultMessage: 'Not Private',
    },
    TR_PRIVATE: {
        id: 'TR_PRIVATE',
        defaultMessage: 'Private',
    },
    TR_SERVICE_FEE: {
        id: 'TR_SERVICE_FEE',
        description: 'Heading in coin join settings',
        defaultMessage: 'One-time service fee',
    },
    TR_COINJOIN_SETUP: {
        id: 'TR_COINJOIN_SETUP',
        description: 'Heading in coin join settings',
        defaultMessage: 'Your coins will be mixed with other peoples’ to achieve privacy.',
    },
    TR_COINJOIN_SETUP_HEADING: {
        id: 'TR_COINJOIN_SETUP_HEADING',
        description: 'Heading in coinjoin account details',
        defaultMessage: 'Coinjoin setup',
    },
    TR_RECOMMENDED: {
        id: 'TR_RECOMMENDED',
        description: 'Coinjoin setup option',
        defaultMessage: 'Recommended',
    },
    TR_CUSTOM: {
        id: 'TR_CUSTOM',
        description: 'Coinjoin setup option',
        defaultMessage: 'Custom',
    },
    TR_COINJOIN_TILE_1_TITLE: {
        id: 'TR_COINJOIN_TILE_1_TITLE',
        description: 'Tile in coinjoin settings',
        defaultMessage: 'Takes a few hours',
    },
    TR_COINJOIN_TILE_2_TITLE: {
        id: 'TR_COINJOIN_TILE_2_TITLE',
        description: 'Tile in coinjoin settings',
        defaultMessage: 'Works when connected',
    },
    TR_COINJOIN_TILE_3_TITLE: {
        id: 'TR_COINJOIN_TILE_3_TITLE',
        description: 'Tile in coinjoin settings',
        defaultMessage: 'Protected by your Trezor',
    },
    TR_COINJOIN_TILE_1_DESCRIPTION: {
        id: 'TR_COINJOIN_TILE_1_DESCRIPTION',
        description: 'Tile in coinjoin settings',
        defaultMessage: 'You can keep your laptop and Trezor locked',
    },
    TR_COINJOIN_TILE_2_DESCRIPTION: {
        id: 'TR_COINJOIN_TILE_2_DESCRIPTION',
        description: 'Tile in coinjoin settings',
        defaultMessage: 'You can safely pause coinjoin',
    },
    TR_COINJOIN_TILE_3_DESCRIPTION: {
        id: 'TR_COINJOIN_TILE_3_DESCRIPTION',
        description: 'Tile in coinjoin settings',
        defaultMessage: 'Your bitcoin is always under your control',
    },
    TR_SERVICE_FEE_NOTE: {
        id: 'TR_SERVICE_FEE_NOTE',
        description: 'Note in coinjoin strategy settings',
        defaultMessage: 'Note: You’re also paying a mining fee',
    },
    TR_MINING_FEE_NOTE: {
        id: 'TR_MINING_FEE_NOTE',
        description: 'Note in coinjoin strategy settings',
        defaultMessage: 'Mining fee might be lower. Selected fee is the max value.',
    },
    TR_SKIP_ROUNDS: {
        id: 'TR_SKIP_ROUNDS',
        description: 'Coinjoin strategy item - average ratio of skipped coin join rounds',
        defaultMessage: 'Round skipping',
    },
    TR_SKIP_ROUNDS_HEADING: {
        id: 'TR_SKIP_ROUNDS_HEADING',
        description: 'Heading in coin join settings',
        defaultMessage: 'Allow Trezor to skip rounds',
    },
    TR_SKIP_ROUNDS_DESCRIPTION: {
        id: 'TR_SKIP_ROUNDS_DESCRIPTION',
        description: 'Description in coin join settings',
        defaultMessage:
            'By allowing rounds to be skipped, you make it more difficult to prove any relation between your inputs. This means you can further obfuscate the origin of the funds.',
    },
    TR_MAX_MINING_FEE: {
        id: 'TR_MAX_MINING_FEE',
        description: 'Coinjoin strategy item - fee amount',
        defaultMessage: 'Max mining fee',
    },
    TR_TERMS_AND_PRIVACY_CONFIRMATION: {
        id: 'TR_TERMS_AND_PRIVACY_CONFIRMATION',
        description: 'Checkbox in coinjoin settings',
        defaultMessage:
            'I agree to the <trezor>Trezor Suite Terms</trezor> and <coordinator>zkSNACKs Coordinator Terms</coordinator>',
    },
    TR_CONFIRM_CONDITIONS: {
        id: 'TR_CONFIRM_CONDITIONS',
        description: 'Tooltip content for disabled button in coinjoin section',
        defaultMessage: 'Confirm the conditions before you proceed.',
    },
    TR_NOTHING_TO_ANONYMIZE: {
        id: 'TR_NOTHING_TO_ANONYMIZE',
        description: 'Tooltip content for disabled button in coinjoin section',
        defaultMessage: 'Nothing to make private',
    },
    TR_COINJOIN_PHASE_0_MESSAGE: {
        id: 'TR_COINJOIN_PHASE_0_MESSAGE',
        defaultMessage: 'Collecting inputs',
    },
    TR_COINJOIN_PHASE_1_MESSAGE: {
        id: 'TR_COINJOIN_PHASE_1_MESSAGE',
        defaultMessage: 'Establishing connection',
    },
    TR_COINJOIN_PHASE_2_MESSAGE: {
        id: 'TR_COINJOIN_PHASE_2_MESSAGE',
        defaultMessage: 'Registering outputs',
    },
    TR_COINJOIN_PHASE_3_MESSAGE: {
        id: 'TR_COINJOIN_PHASE_3_MESSAGE',
        defaultMessage: 'Signing transactions',
    },
    TR_COINJOIN_PHASE_4_MESSAGE: {
        id: 'TR_COINJOIN_PHASE_4_MESSAGE',
        defaultMessage: 'Ending the round',
    },
    TR_LEFT: {
        id: 'TR_LEFT',
        description: 'As in "{time} Left"',
        defaultMessage: 'left',
    },
    TR_STOP: {
        id: 'TR_STOP',
        defaultMessage: 'Stop',
    },
    TR_AUTO_STOP_TOOLTIP: {
        id: 'TR_AUTO_STOP_TOOLTIP',
        defaultMessage: 'Coinjoin is in the signing phase. Click to stop it after this round.',
        description: 'Tooltip for TR_AUTO_STOP button',
    },
    TR_STOPPING: {
        id: 'TR_STOPPING',
        defaultMessage: 'Stopping',
        description:
            'Button in coinjoin summary. Session is not in critical phase and auto stop is enabled',
    },
    TR_RESUME: {
        id: 'TR_RESUME',
        defaultMessage: 'Resume',
        description:
            'Button hover in coinjoin summary. Session is not in critical phase and auto stop is enabled',
    },
    TR_CANCEL_COINJOIN: {
        id: 'TR_CANCEL_COINJOIN',
        defaultMessage: 'Cancel coinjoin',
    },
    TR_CANCEL_COINJOIN_QUESTION: {
        id: 'TR_CANCEL_COINJOIN_QUESTION',
        defaultMessage: 'Do you really want to cancel this coinjoin?',
    },
    TR_CANCEL_COINJOIN_NO: {
        id: 'TR_CANCEL_COINJOIN_NO',
        defaultMessage: 'No, continue',
    },
    TR_CANCEL_COINJOIN_YES: {
        id: 'TR_CANCEL_COINJOIN_YES',
        defaultMessage: 'Yes, cancel it',
    },
    TR_PAUSED: {
        id: 'TR_PAUSED',
        defaultMessage: 'Paused',
    },
    TR_ANONYMIZATION_PAUSED: {
        id: 'TR_ANONYMIZATION_PAUSED',
        defaultMessage: 'Coinjoin paused',
    },
    TR_RESUMING: {
        id: 'TR_RESUMING',
        defaultMessage: 'Resuming',
    },
    TR_COINJOIN_RUNNING: {
        id: 'TR_COINJOIN_RUNNING',
        defaultMessage: 'Coinjoin running',
    },
    TR_DO_NOT_DISCONNECT_DEVICE: {
        id: 'TR_DO_NOT_DISCONNECT_DEVICE',
        defaultMessage: "Don't disconnect your device",
    },
    TR_DISMISS: {
        id: 'TR_DISMISS',
        defaultMessage: 'Dismiss',
    },
    TR_VIEW_ACCOUNT: {
        id: 'TR_VIEW_ACCOUNT',
        defaultMessage: 'View account',
    },
    TR_COINJOIN_COMPLETED: {
        id: 'TR_COINJOIN_COMPLETED',
        defaultMessage: 'Coinjoin successfully completed!',
    },
    TR_COINJOIN_COMPLETED_DESCRIPTION: {
        id: 'TR_COINJOIN_COMPLETED_DESCRIPTION',
        defaultMessage: 'All your funds were successfully coinjoined',
    },
    TR_COINJOIN_ENDED: {
        id: 'TR_COINJOIN_ENDED',
        description: 'Modal subheading when coinjoin ends',
        defaultMessage: 'Coinjoin ended',
    },
    TR_MORE_ROUNDS_NEEDED: {
        id: 'TR_MORE_ROUNDS_NEEDED',
        description: 'Modal heading when coinjoin ends',
        defaultMessage: 'A few more rounds needed',
    },
    TR_MORE_ROUNDS_NEEDED_DESCRIPTION: {
        id: 'TR_MORE_ROUNDS_NEEDED_DESCRIPTION',
        description: 'Modal description when coinjoin ends',
        defaultMessage:
            'We were unable to reach your desired privacy level within the reserved rounds. Please run another coinjoin. You will not pay any service fees twice.',
    },
    TR_OK: {
        id: 'TR_OK',
        description: 'Button text',
        defaultMessage: 'OK',
    },
    NEXT_PAGE: {
        id: 'NEXT_PAGE',
        defaultMessage: 'Next page',
    },
    TR_COINJOIN_ANONYMITY_LEVEL_SETUP_TITLE: {
        id: 'TR_COINJOIN_ANONYMITY_LEVEL_SETUP_TITLE',
        defaultMessage: 'Desired privacy level',
    },
    TR_COINJOIN_ANONYMITY_LEVEL_SETUP_DESCRIPTION: {
        id: 'TR_COINJOIN_ANONYMITY_LEVEL_SETUP_DESCRIPTION',
        defaultMessage:
            'Shows the number of people with whom your resources are indistinguishable.',
    },
    TR_NOT_ENOUGH_ANONYMIZED_FUNDS_WARNING: {
        id: 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS_WARNING',
        description: 'Warning in coinjoin send form',
        defaultMessage:
            'Not enough private funds. You can either make more coins private, manually select UTXOs in Coin Control, or lower the privacy level.',
    },
    TR_NOT_ENOUGH_ANONYMIZED_FUNDS_RBF_WARNING: {
        id: 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS_RBF_WARNING',
        description: 'Warning in coinjoin rbf form',
        defaultMessage:
            'Not enough private funds. You can either make more coins private or lower the privacy level.',
    },
    TR_UTXO_REGISTERED_IN_COINJOIN_RBF_WARNING: {
        id: 'TR_UTXO_REGISTERED_IN_COINJOIN_RBF_WARNING',
        description: 'Warning in coinjoin rbf form',
        defaultMessage: 'Your coins are in use. Please turn off the coinjoin first.',
    },
    TR_BREAKING_ANONYMITY_CHECKBOX: {
        id: 'TR_BREAKING_ANONYMITY_CHECKBOX',
        description: 'Checkbox in coinjoin send form',
        defaultMessage: "I understand I'm damaging my anonymity",
    },
    TR_NOT_ENOUGH_ANONYMIZED_FUNDS_TOOLTIP: {
        id: 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS_TOOLTIP',
        description: 'Tooltip in coinjoin send form',
        defaultMessage: 'You can:',
    },
    TR_COINJOIN_LOGS_TITLE: {
        id: 'TR_COINJOIN_LOGS_TITLE',
        defaultMessage: 'Coinjoin debug log',
    },
    TR_COINJOIN_LOGS_DESCRIPTION: {
        id: 'TR_COINJOIN_LOGS_DESCRIPTION',
        defaultMessage: 'Open folder with log files.',
    },
    TR_COINJOIN_LOGS_ACTION: {
        id: 'TR_COINJOIN_LOGS_ACTION',
        defaultMessage: 'Find logs',
    },
    TR_ANONYMIZATION_OPTION_1: {
        id: 'TR_ANONYMIZATION_OPTION_1',
        description: 'Tooltip in coinjoin send form',
        defaultMessage: 'Make more coins private',
    },
    TR_ANONYMIZATION_OPTION_2: {
        id: 'TR_ANONYMIZATION_OPTION_2',
        description: 'Tooltip in coinjoin send form',
        defaultMessage: 'Select UTXOs in <button>Coin Control</button>',
    },
    TR_ANONYMIZATION_OPTION_3: {
        id: 'TR_ANONYMIZATION_OPTION_3',
        description: 'Tooltip in coinjoin send form',
        defaultMessage: 'Reduce privacy level',
    },
    TR_NOT_ENOUGH_ANONYMIZED_FUNDS: {
        id: 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS',
        description: 'Secondary button text in coinjoin send form',
        defaultMessage: 'Not enough private funds',
    },
    TR_SEND_NOT_ANONYMIZED_COINS: {
        id: 'TR_SEND_NOT_ANONYMIZED_COINS',
        description: 'Send button text in coinjoin account when low-anonymity UTXOs are selected',
        defaultMessage: 'Send non-private coins',
    },
    TR_SIGN_WITH_NOT_ANONYMIZED_COINS: {
        id: 'TR_SIGN_WITH_NOT_ANONYMIZED_COINS',
        description: 'Sign button text in coinjoin account when low-anonymity UTXOs are selected',
        defaultMessage: 'Sign with non-private coins',
    },
    TR_YOU_SHOULD_ANONYMIZE: {
        id: 'TR_YOU_SHOULD_ANONYMIZE',
        description: 'Secondary button text in coinjoin send form',
        defaultMessage: 'You should make them private',
    },
    TR_LOOKING_FOR_COINJOIN_ROUND: {
        id: 'TR_LOOKING_FOR_COINJOIN_ROUND',
        defaultMessage: 'Waiting for a round',
    },
    TR_COINJOIN_SESSION_COUNTDOWN_PLURAL: {
        id: 'TR_COINJOIN_SESSION_COUNTDOWN_PLURAL',
        description: 'value including unit i.e. 5 hours 15 minutes, firstValue for handling plural',
        defaultMessage: '{value} {firstValue, plural, one {left} other {left}}',
    },
    TR_COINJOIN_ACCOUNT_RESCAN_TITLE: {
        id: 'TR_COINJOIN_ACCOUNT_RESCAN_TITLE',
        defaultMessage: 'Rescan account',
    },
    TR_COINJOIN_ACCOUNT_RESCAN_DESCRIPTION: {
        id: 'TR_COINJOIN_ACCOUNT_RESCAN_DESCRIPTION',
        defaultMessage:
            'In case of incorrect transaction history, you can fully rescan the account without optimizations. It may take longer than usual.',
    },
    TR_COINJOIN_ACCOUNT_RESCAN_ACTION: {
        id: 'TR_COINJOIN_ACCOUNT_RESCAN_ACTION',
        defaultMessage: 'Rescan account',
    },
    TR_COINJOIN_DISCOVERY_BLOCK_FETCHING: {
        id: 'TR_COINJOIN_DISCOVERY_BLOCK_FETCHING',
        defaultMessage: 'Fetching block filters',
    },
    TR_COINJOIN_DISCOVERY_MEMPOOL_FETCHING: {
        id: 'TR_COINJOIN_DISCOVERY_MEMPOOL_FETCHING',
        defaultMessage: 'Fetching mempool filters',
    },
    TR_COINJOIN_DISCOVERY_BLOCK_PROGRESS: {
        id: 'TR_COINJOIN_DISCOVERY_BLOCK_PROGRESS',
        defaultMessage: '{current} out of {total} blocks scanned',
    },
    TR_COINJOIN_DISCOVERY_MEMPOOL_PROGRESS: {
        id: 'TR_COINJOIN_DISCOVERY_MEMPOOL_PROGRESS',
        defaultMessage: '{current} out of {total} transactions analyzed',
    },
    TR_LOADING_FUNDS: {
        id: 'TR_LOADING_FUNDS',
        defaultMessage: 'Loading Funds...',
    },
    TR_LOADING_ACCOUNTS: {
        id: 'TR_LOADING_ACCOUNTS',
        defaultMessage: 'Loading accounts...',
    },
    TR_LOADING_ACCOUNTS_DESCRIPTION: {
        id: 'TR_LOADING_ACCOUNTS_DESCRIPTION',
        defaultMessage: 'You can change these settings after accounts have loaded.',
    },
    TR_LOADING_FACT_TITLE: {
        id: 'TR_LOADING_FACT_TITLE',
        defaultMessage: 'Did you know?',
    },
    TR_LOADING_FACT_0: {
        id: 'TR_LOADING_FACT_0',
        description: '140 symbols max',
        defaultMessage:
            "Your coinjoin account isn't detected automatically. If you haven't enabled view-only mode on this wallet, you'll need to manually re-add the account after reconnecting your Trezor.",
    },
    TR_LOADING_FACT_1: {
        id: 'TR_LOADING_FACT_1',
        description: '140 symbols max',
        defaultMessage:
            'The Trezor Model One was the world’s first hardware wallet, released on July 29, 2014. The follow-up Trezor Model T launched in 2018.',
    },
    TR_LOADING_FACT_2: {
        id: 'TR_LOADING_FACT_2',
        description: '140 symbols max',
        defaultMessage:
            "Your coinjoin account isn't detected automatically. If you haven't enabled view-only mode on this wallet, you'll need to manually re-add the account after reconnecting your Trezor.",
    },
    TR_LOADING_FACT_3: {
        id: 'TR_LOADING_FACT_3',
        defaultMessage:
            'Suite will not remember your coinjoin account in order to protect your privacy, unless you explicitly choose to remember the wallet.',
    },
    TR_LOADING_FACT_4: {
        id: 'TR_LOADING_FACT_4',
        description: '140 symbols max',
        defaultMessage:
            'About 20% of Bitcoin is stuck in wallets by users who have lost access to their private keys. This equates to about 3.67M BTC.',
    },
    TR_LOADING_FACT_5: {
        id: 'TR_LOADING_FACT_5',
        description: '140 symbols max',
        defaultMessage:
            'On October 29th 2013 the first Bitcoin ATM was set up in a coffee shop in Vancouver, Canada. There were over 38,000 Bitcoin ATMs across the globe in 2022.',
    },
    TR_LOADING_FACT_6: {
        id: 'TR_LOADING_FACT_6',
        description: '140 symbols max',
        defaultMessage:
            'Bitcoin was created in the aftermath of the 2008 financial crisis by an anonymous person (or even group of people) known only by the pseudonym Satoshi Nakamoto.',
    },
    TR_LOADING_FACT_7: {
        id: 'TR_LOADING_FACT_7',
        description: '140 symbols max',
        defaultMessage: 'One bitcoin is equivalent to 100M satoshis (sats).',
    },
    TR_LOADING_FACT_8: {
        id: 'TR_LOADING_FACT_8',
        description: '140 symbols max',
        defaultMessage: 'Less than 2% of the population owned Bitcoin in 2022.',
    },
    TR_LOADING_FACT_9: {
        id: 'TR_LOADING_FACT_9',
        description: '140 symbols max',
        defaultMessage:
            '"Privacy is not something that I\'m merely entitled to, it\'s an absolute prerequisite." - Marlon Brando',
    },
    TR_LOADING_FACT_11: {
        id: 'TR_LOADING_FACT_11',
        description: '140 symbols max',
        defaultMessage: '"Privacy is not secrecy." - Eric Hughes',
    },
    TR_LOADING_FACT_12: {
        id: 'TR_LOADING_FACT_12',
        description: '140 symbols max',
        defaultMessage:
            "Like cash, you don't keep your entire net worth in your pocket, you keep walking around money for incidental expenses - Satoshi Nakamoto",
    },
    TR_LOADING_FACT_13: {
        id: 'TR_LOADING_FACT_13',
        description: '140 symbols max',
        defaultMessage: 'Privacy is not secrecy - Eric Hughes',
    },
    TR_LOADING_FACT_14: {
        id: 'TR_LOADING_FACT_14',
        description: '140 symbols max',
        defaultMessage:
            'Privacy is the power to selectively reveal oneself to the world - Eric Hughes',
    },
    TR_LOADING_FACT_15: {
        id: 'TR_LOADING_FACT_15',
        description: '140 symbols max',
        defaultMessage:
            '"Privacy is the power to selectively reveal oneself to the world." - Eric Hughes',
    },
    TR_LOADING_FACT_16: {
        id: 'TR_LOADING_FACT_16',
        description: '140 symbols max',
        defaultMessage: 'Coinjoin accounts use taproot addresses',
    },
    TR_LOADING_FACT_17: {
        id: 'TR_LOADING_FACT_17',
        description: '140 symbols max',
        defaultMessage:
            'El Salvador became the first nation to accept Bitcoin as legal tender in September 2021',
    },
    TR_LOADING_FACT_18: {
        id: 'TR_LOADING_FACT_18',
        description: '140 symbols max',
        defaultMessage:
            'Laszlo Hanyecz made first commercial BTC transaction. He bought 2 pizzas for 10,000 BTC',
    },
    TR_LOADING_FACT_19: {
        id: 'TR_LOADING_FACT_19',
        description: '140 symbols max',
        defaultMessage: 'The last Bitcoin should be mined some time around the year 2140',
    },
    TR_LOADING_FACT_20: {
        id: 'TR_LOADING_FACT_20',
        description: '140 symbols max',
        defaultMessage:
            "Mel B, better known as 'Scary Spice', was the first mainstream musician to accept Bitcoin payments for a single",
    },
    TR_LOADING_FACT_21: {
        id: 'TR_LOADING_FACT_21',
        description: '140 symbols max',
        defaultMessage:
            'Bitcoin transactions are grouped together in blocks. These blocks are organized in a chronological sequence on the blockchain.',
    },
    TR_LOADING_FACT_22: {
        id: 'TR_LOADING_FACT_22',
        description: '140 symbols max',
        defaultMessage:
            'Halving is the mechanism by which the reward for mining BTC is cut in half every four years. In the beginning, mining one block would earn you 50 BTC, whereas in 2020 it earned you 6.25 BTC',
    },
    TR_LOADING_FACT_23: {
        id: 'TR_LOADING_FACT_23',
        description: '140 symbols max',
        defaultMessage: 'Bitcoin has a maximum market cap of 21M coins',
    },
    TR_LOADING_FACT_24: {
        id: 'TR_LOADING_FACT_24',
        description: '140 symbols max',
        defaultMessage:
            '"Privacy is not something that I\'m merely entitled to, it\'s an absolute prerequisite." - Marlon Brando',
    },
    TR_LOADING_FACT_25: {
        id: 'TR_LOADING_FACT_25',
        description: '140 symbols max',
        defaultMessage: 'Bitcoin first reached parity with the US Dollar in February 2011',
    },
    TR_LOADING_FACT_26: {
        id: 'TR_LOADING_FACT_26',
        description: '140 symbols max',
        defaultMessage:
            'Slush Pool is the oldest Bitcoin mining pool, and also the first to be publicly available. Today it is operated by Braiins Pool',
    },
    TR_REMEMBER_WALLET_TITLE: {
        id: 'TR_REMEMBER_WALLET_TITLE',
        description: 'Displayed during coinjoin account discovery',
        defaultMessage: 'Remember wallet',
    },
    TR_REMEMBER_WALLET_NOTE: {
        id: 'TR_REMEMBER_WALLET_NOTE',
        description: 'Displayed during coinjoin account discovery',
        defaultMessage: 'This will remember all assets on this wallet',
    },
    TR_REMEMBER_WALLET_DESCRIPTION: {
        id: 'TR_REMEMBER_WALLET_DESCRIPTION',
        description: 'Displayed during coinjoin account discovery',
        defaultMessage:
            'It will still be loaded privately, but with faster loading times and saved custom setups.',
    },
    TR_TIMER_PAST_DEADLINE: {
        id: 'TR_TIMER_PAST_DEADLINE',
        defaultMessage: 'Almost there...',
    },
    TR_UNAVAILABLE_WHILE_LOADING: {
        id: 'TR_UNAVAILABLE_WHILE_LOADING',
        description: 'Coinjoin account navigation button tooltip during discovery',
        defaultMessage: 'Unavailable while loading',
    },
    TR_VIEW_ALL: {
        id: 'TR_VIEW_ALL',
        description: 'Button opening changelog',
        defaultMessage: 'View all',
    },
    TR_DISABLED_ANONYMITY_CHANGE_MESSAGE: {
        id: 'TR_DISABLED_ANONYMITY_CHANGE_MESSAGE',
        defaultMessage: 'Editing disabled while coinjoin is running.',
    },
    TR_LOW_ANONYMITY_WARNING: {
        id: 'TR_LOW_ANONYMITY_WARNING',
        defaultMessage:
            "<red>Very low privacy.</red> We recommend using at least 1 in 5, as anything below this threshold isn't private.",
    },
    TR_SESSION_PHASE_ROUND_SEARCH: {
        id: 'TR_SESSION_PHASE_ROUND_SEARCH',
        defaultMessage: 'Looking for a round',
    },
    TR_SESSION_PHASE_COIN_SELECTION: {
        id: 'TR_SESSION_PHASE_COIN_SELECTION',
        defaultMessage: 'Choosing coins',
    },
    TR_SESSION_PHASE_ROUND_PAIRING: {
        id: 'TR_SESSION_PHASE_ROUND_PAIRING',
        defaultMessage: 'Selecting coins for the next round',
    },
    TR_SESSION_PHASE_COIN_REGISTRATION: {
        id: 'TR_SESSION_PHASE_COIN_REGISTRATION',
        defaultMessage: 'Registering coins',
    },
    TR_SESSION_ERROR_PHASE_MISSING_UTXOS: {
        id: 'TR_SESSION_ERROR_PHASE_MISSING_UTXOS',
        defaultMessage: 'Looking for available coins',
    },
    TR_SESSION_ERROR_PHASE_SKIPPING_ROUND: {
        id: 'TR_SESSION_ERROR_PHASE_SKIPPING_ROUND',
        defaultMessage: 'Skipping round',
    },
    TR_SESSION_ERROR_PHASE_RETRYING_PAIRING: {
        id: 'TR_SESSION_ERROR_PHASE_RETRYING_PAIRING',
        defaultMessage: 'Retrying pairing',
    },
    TR_SESSION_ERROR_PHASE_AFFILIATE_SERVERS_OFFLINE: {
        id: 'TR_SESSION_ERROR_PHASE_AFFILIATE_SERVERS_OFFLINE',
        defaultMessage: 'The coinjoin service is temporarily unavailable',
    },
    TR_SESSION_ERROR_PHASE_CRITICAL_ERROR: {
        id: 'TR_SESSION_ERROR_PHASE_CRITICAL_ERROR',
        defaultMessage: 'Critical error, stopping coinjoin.',
    },
    TR_SESSION_ERROR_PHASE_BLOCKED_UTXOS: {
        id: 'TR_SESSION_ERROR_PHASE_BLOCKED_UTXOS',
        defaultMessage: 'Coins not ready. Wait to try again.',
        description: 'Some of utxos are temporary banned, disable session for a while',
    },
    TR_SESSION_PHASE_AWAITING_CONFIRMATION: {
        id: 'TR_SESSION_PHASE_AWAITING_CONFIRMATION',
        defaultMessage: 'Confirming availability',
    },
    TR_SESSION_PHASE_WAITING_FOR_OTHERS: {
        id: 'TR_SESSION_PHASE_WAITING_FOR_OTHERS',
        defaultMessage: 'Waiting for participants',
    },
    TR_SESSION_PHASE_REGISTERING_OUTPUTS: {
        id: 'TR_SESSION_PHASE_REGISTERING_OUTPUTS',
        defaultMessage: 'Registering outputs',
    },
    TR_SESSION_PHASE_WAITING_FOR_COORDINATOR: {
        id: 'TR_SESSION_PHASE_WAITING_FOR_COORDINATOR',
        defaultMessage: 'Waiting for coordinator',
    },
    TR_SESSION_ERROR_PHASE_REGISTRATION_FAILED: {
        id: 'TR_SESSION_ERROR_PHASE_REGISTRATION_FAILED',
        defaultMessage: 'Verification failed, retrying',
    },
    TR_SESSION_PHASE_AWAITING_TRANSACTION: {
        id: 'TR_SESSION_PHASE_AWAITING_TRANSACTION',
        defaultMessage: 'Waiting for transaction',
    },
    TR_SESSION_PHASE_TRANSACTION_SIGNING: {
        id: 'TR_SESSION_PHASE_TRANSACTION_SIGNING',
        defaultMessage: 'Signing transaction',
    },
    TR_SESSION_PHASE_SENDING_SIGNATURE: {
        id: 'TR_SESSION_PHASE_SENDING_SIGNATURE',
        defaultMessage: 'Sending to coordinator',
    },
    TR_SESSION_PHASE_AWAITING_SIGNATURES: {
        id: 'TR_SESSION_PHASE_AWAITING_SIGNATURES',
        defaultMessage: 'Waiting for signatures',
    },
    TR_SESSION_PHASE_SIGNING_FAILED: {
        id: 'TR_SESSION_PHASE_SIGNING_FAILED',
        defaultMessage: 'Signing failed, retrying',
    },
    TR_COINJOIN_EXPLANATION_TITLE: {
        id: 'TR_COINJOIN_EXPLANATION_TITLE',
        defaultMessage: 'How it works',
    },
    TR_EMPTY_ACCOUNT_TITLE: {
        id: 'TR_EMPTY_ACCOUNT_TITLE',
        defaultMessage: 'No Funds',
    },
    TR_EMPTY_COINJOIN_ACCOUNT_SUBTITLE: {
        id: 'TR_EMPTY_COINJOIN_ACCOUNT_SUBTITLE',
        defaultMessage: 'Receive some funds and start coinjoining.',
    },
    TR_STEP: {
        id: 'TR_STEP',
        defaultMessage: 'Step {number}',
    },
    TR_STEP_OF_TOTAL: {
        id: 'TR_STEP_OF_TOTAL',
        defaultMessage: 'Select a token',
    },
    TR_COINJOIN_STEP_1_TITLE: {
        id: 'TR_COINJOIN_STEP_1_TITLE',
        defaultMessage: 'Add bitcoin',
    },
    TR_COINJOIN_STEP_1_DESCRIPTION: {
        id: 'TR_COINJOIN_STEP_1_DESCRIPTION',
        defaultMessage: 'Send yourself some bitcoin to make private',
    },
    TR_START_COINJOIN: {
        id: 'TR_START_COINJOIN',
        defaultMessage: 'Start coinjoin',
    },
    TR_COINJOIN_STEP_2_DESCRIPTION: {
        id: 'TR_COINJOIN_STEP_2_DESCRIPTION',
        defaultMessage: 'Click the button and confirm it on your Trezor.',
    },
    TR_COINJOIN_STEP_3_TITLE: {
        id: 'TR_COINJOIN_STEP_3_TITLE',
        defaultMessage: 'Wait for the magic',
    },
    TR_COINJOIN_STEP_3_DESCRIPTION: {
        id: 'TR_COINJOIN_STEP_3_DESCRIPTION',
        defaultMessage: 'Your coins will be mixed with other peoples’ to achieve privacy',
    },
    TR_COINJOIN_CEX_WARNING: {
        id: 'TR_COINJOIN_CEX_WARNING',
        defaultMessage: 'Exchanges may not serve you if you use coinjoin.',
    },
    TR_ZERO_PHISHING_TOOLTIP: {
        id: 'TR_ZERO_PHISHING_TOOLTIP',
        defaultMessage:
            'Address poisoning alert! This transaction looks suspicious. <a>Learn more.</a>',
    },
    TR_ZERO_PHISHING_BANNER: {
        id: 'TR_ZERO_PHISHING_BANNER',
        defaultMessage:
            'Proceed with caution. This may be a fraudulent transaction. <a>Read more here.</a>',
    },
    TR_SENDFORM_LABELING_EXAMPLE_1: {
        id: 'TR_SENDFORM_LABELING_EXAMPLE_1',
        defaultMessage: 'Savings',
    },
    TR_SENDFORM_LABELING_EXAMPLE_2: {
        id: 'TR_SENDFORM_LABELING_EXAMPLE_2',
        defaultMessage: 'Rent',
    },
    TR_ANONYMITY_SET_ERROR: {
        id: 'TR_ANONYMITY_SET_ERROR',
        defaultMessage: 'Error calculating your privacy, try again later',
    },
    TR_COINJOIN_INTERRUPTED_ERROR: {
        id: 'TR_COINJOIN_INTERRUPTED_ERROR',
        defaultMessage: 'Coinjoin has been interrupted because of an external error',
    },
    TR_ERROR: {
        id: 'TR_ERROR',
        defaultMessage: 'Error',
    },
    TR_COINJOIN_RECEIVE_WARNING_TITLE: {
        id: 'TR_COINJOIN_RECEIVE_WARNING_TITLE',
        defaultMessage: 'You should know',
    },
    TR_UNECO_COINJOIN_RECEIVE_WARNING: {
        id: 'TR_UNECO_COINJOIN_RECEIVE_WARNING',
        defaultMessage:
            'You can receive funds into this account and use it like any other. Please note that the coinjoin feature will be discontinued as of June 1st 2024.',
    },
    TR_UNECO_COINJOIN_AGREE: {
        id: 'TR_UNECO_COINJOIN_AGREE',
        defaultMessage: 'I understand',
    },
    TR_UNECO_COINJOIN_TITLE: {
        id: 'TR_UNECO_COINJOIN_TITLE',
        defaultMessage: 'Uneconomical coinjoin',
    },
    TR_UNECO_COINJOIN_WARNING: {
        id: 'TR_UNECO_COINJOIN_WARNING',
        defaultMessage:
            'Coinjoining less than {crypto} {isAccountWithRate, select, true {(~{fiat})} false {} other {}} is not recommended',
    },
    TR_UNECO_COINJOIN_EXPLANATION: {
        id: 'TR_UNECO_COINJOIN_EXPLANATION',
        defaultMessage:
            'If your account balance is below the recommended minimum ({crypto}) coinjoin may be uneconomical. Press <b>Cancel</b> to go back and add more funds, or <b>I understand</b> to proceed with the coinjoin.',
    },
    TR_AMOUNT_SENT: {
        id: 'TR_AMOUNT_SENT',
        defaultMessage: 'Amount sent',
    },
    TR_TOTAL_AMOUNT: {
        id: 'TR_TOTAL_AMOUNT',
        defaultMessage: 'Total amount',
    },
    TR_INCLUDING_FEE: {
        id: 'TR_INCLUDING_FEE',
        defaultMessage: 'Including fee',
    },
    TR_DESKTOP_APP_PROMO_HEADING: {
        id: 'TR_DESKTOP_APP_PROMO_HEADING',
        defaultMessage: 'Get the most out of Trezor Suite',
    },
    TR_DESKTOP_APP_PROMO_TEXT: {
        id: 'TR_DESKTOP_APP_PROMO_TEXT',
        defaultMessage: 'Simple crypto management directly on your desktop',
    },
    TR_DESKTOP_APP_PROMO_GET: {
        id: 'TR_DESKTOP_APP_PROMO_GET',
        defaultMessage: 'Get for desktop',
    },
    TR_DESKTOP_APP_PROMO_TEXT_FOOTER: {
        id: 'TR_MOBILE_APP_PROMO_TEXT',
        defaultMessage: 'With more security features',
    },
    TR_MOBILE_APP_PROMO_TEXT_FOOTER: {
        id: 'TR_MOBILE_APP_PROMO_TEXT_FOOTER',
        defaultMessage: 'Sync & track on your phone with <b>Trezor Suite Lite</b>',
    },
    TR_PROMO_BANNER_DASHBOARD: {
        id: 'TR_PROMO_BANNER_DASHBOARD',
        defaultMessage:
            '<underline>The most convenient</underline> <rest>hardware wallet to securely manage your crypto</rest>',
    },
    TR_CANDIDATE_TRANSACTION_HEADER: {
        id: 'TR_CANDIDATE_TRANSACTION_HEADER',
        defaultMessage: 'Candidate transactions',
    },
    TR_CANDIDATE_TRANSACTION: {
        id: 'TR_CANDIDATE_TRANSACTION',
        defaultMessage: 'Coinjoin candidate',
    },
    TR_CANDIDATE_TRANSACTION_DESCRIPTION: {
        id: 'TR_CANDIDATE_TRANSACTION_DESCRIPTION',
        defaultMessage: 'Signed by you, waiting for others',
    },
    TR_CANDIDATE_TRANSACTION_EXPLANATION: {
        id: 'TR_CANDIDATE_TRANSACTION_EXPLANATION',
        defaultMessage:
            "You've signed the transaction, but it still needs signatures from all participants. We can't guarantee transaction processing unless everyone signs.",
    },
    TR_ENABLE_AUTOSTOP_COINJOIN: {
        id: 'TR_ENABLE_AUTOSTOP_COINJOIN',
        defaultMessage: 'Stop coinjoin after this round',
    },
    TR_AUTOSTOP_COINJOIN_ENABLED: {
        id: 'TR_AUTOSTOP_COINJOIN_ENABLED',
        defaultMessage: 'Coinjoin will be stopped after this round',
    },
    TR_DISABLE_AUTOSTOP_COINJOIN: {
        id: 'TR_DISABLE_AUTOSTOP_COINJOIN',
        defaultMessage: "Don't stop",
    },
    TR_TREZOR_DEVICE_TUTORIAL_HEADING: {
        id: 'TR_TREZOR_DEVICE_TUTORIAL_HEADING',
        defaultMessage: 'Know your Trezor',
    },
    TR_TREZOR_DEVICE_TUTORIAL_DESCRIPTION: {
        id: 'TR_TREZOR_DEVICE_TUTORIAL_DESCRIPTION',
        defaultMessage: 'Learn how to use your device with the help of a short tutorial',
    },
    TR_CONTINUE_ON_TREZOR: {
        id: 'TR_CONTINUE_ON_TREZOR',
        defaultMessage: 'Continue on Trezor',
    },
    TR_TREZOR_DEVICE_TUTORIAL_COMPLETED_HEADING: {
        id: 'TR_TREZOR_DEVICE_TUTORIAL_COMPLETED_HEADING',
        defaultMessage: 'Tutorial completed',
    },
    TR_TREZOR_DEVICE_TUTORIAL_CANCELED_HEADING: {
        id: 'TR_TREZOR_DEVICE_TUTORIAL_CANCELED_HEADING',
        defaultMessage: 'Tutorial canceled',
    },
    TR_RESTART_TREZOR_DEVICE_TUTORIAL: {
        id: 'TR_RESTART_TREZOR_DEVICE_TUTORIAL',
        defaultMessage: 'Restart tutorial',
    },
    TR_HIDE_BALANCES: {
        id: 'TR_HIDE_BALANCES',
        defaultMessage: 'Hide balances',
    },
    TR_SHOW_BALANCES: {
        id: 'TR_SHOW_BALANCES',
        defaultMessage: 'Show balances',
    },
    TR_SEND_ADDRESS_SECTION: {
        id: 'TR_SEND_ADDRESS_SECTION',
        defaultMessage: 'To',
    },
    TR_SEND_RECIPIENT_ADDRESS: {
        id: 'TR_SEND_RECIPIENT_ADDRESS',
        defaultMessage:
            '{index, selectordinal, one {#st} two {#nd} few {#rd} other {#th} } Recipient',
    },
    TR_DISCOVERY_NEW_COINS: {
        id: 'TR_DISCOVERY_NEW_COINS',
        defaultMessage: 'Activate coins',
    },
    TR_DISCOVERY_NEW_COINS_TEXT: {
        id: 'TR_DISCOVERY_NEW_COINS_TEXT',
        defaultMessage: "Don't see an account after activating a coin?",
    },
    TR_SIDEBAR_ADD_COIN: {
        id: 'TR_SIDEBAR_ADD_COIN',
        defaultMessage: 'Add a coin',
    },
    TR_EVM_EXPLANATION_TITLE: {
        id: 'TR_EVM_EXPLANATION_TITLE',
        defaultMessage: '{network} is its own network',
    },
    TR_EVM_EXPLANATION_DESCRIPTION: {
        id: 'TR_EVM_EXPLANATION_DESCRIPTION',
        defaultMessage:
            "It shares the same address style as Ethereum but has its own unique coins and tokens that can't be used on other networks.",
    },
    TR_CONFIRM_EVM_EXPLANATION_RECEIVE_TITLE: {
        id: 'TR_CONFIRM_EVM_EXPLANATION_RECEIVE_TITLE',
        defaultMessage: 'Receive through the {network} network',
    },
    TR_CONFIRM_EVM_EXPLANATION_RECEIVE_DESCRIPTION_ETH: {
        id: 'TR_CONFIRM_EVM_EXPLANATION_RECEIVE_DESCRIPTION_ETH',
        defaultMessage:
            'Make sure you receive your crypto only through the Ethereum network. If coins or tokens are sent outside the Ethereum network (e.g., Polygon or Avalanche), you may not be able to access them.',
    },
    TR_CONFIRM_EVM_EXPLANATION_RECEIVE_DESCRIPTION_OTHER: {
        id: 'TR_CONFIRM_EVM_EXPLANATION_RECEIVE_DESCRIPTION_OTHER',
        defaultMessage:
            'Make sure you receive your crypto only through the {network} network. If coins or tokens are sent outside the {network} network, you may not be able to access them.',
    },
    TR_CONFIRM_EVM_EXPLANATION_SEND_TITLE: {
        id: 'TR_CONFIRM_EVM_EXPLANATION_SEND_TITLE',
        defaultMessage: 'Send through the {network} network',
    },
    TR_CONFIRM_EVM_EXPLANATION_SEND_DESCRIPTION: {
        id: 'TR_CONFIRM_EVM_EXPLANATION_SEND_DESCRIPTION',
        defaultMessage:
            'Make sure you send your crypto only through the {network} network. If coins or tokens are sent outside the {network} network, the receiver may not be able to access them.',
    },
    TR_EVM_EXPLANATION_RECEIVE_DESCRIPTION: {
        id: 'TR_EVM_EXPLANATION_RECEIVE_DESCRIPTION',
        defaultMessage:
            'This receive address is only for {network} coins and tokens. If someone sends you crypto from outside the {network} network, you may not receive them.',
    },
    TR_EVM_EXPLANATION_SEND_DESCRIPTION: {
        id: 'TR_EVM_EXPLANATION_SEND_DESCRIPTION',
        defaultMessage:
            'Send only through the {network} network. The address must be on the {network} network for the sent crypto to be received.',
    },
    TR_EVM_EXPLANATION_EXCHANGE_DESCRIPTION: {
        id: 'TR_EVM_EXPLANATION_EXCHANGE_DESCRIPTION',
        defaultMessage:
            "You selected {coin} on the {network} network, but it seems you don't have any {networkSymbol} coins. Did you mean to choose {coin} on another network?",
    },
    TR_EVM_EXPLANATION_SEND_MODAL_DESCRIPTION: {
        id: 'TR_EVM_EXPLANATION_SEND_MODAL_DESCRIPTION',
        defaultMessage:
            'You can only send {network} tokens to a <b>receive address on the {network} network</b>, otherwise your tokens <b>may be lost</b>.',
    },
    TR_TX_DATA_METHOD_NAME: {
        id: 'TR_TX_DATA_METHOD_NAME',
        defaultMessage: 'Method name',
    },
    TR_TX_DATA_METHOD: {
        id: 'TR_TX_DATA_METHOD',
        defaultMessage: 'Method',
    },
    TR_TX_DATA_FUNCTION: {
        id: 'TR_TX_DATA_FUNCTION',
        defaultMessage: 'Function',
    },
    TR_TX_DATA_PARAMS: {
        id: 'TR_TX_DATA_PARAMS',
        defaultMessage: 'Params',
    },
    TR_TX_DATA_INPUT_DATA: {
        id: 'TR_TX_DATA_INPUT_DATA',
        defaultMessage: 'Input data',
    },
    TR_FROM: {
        id: 'TR_FROM',
        defaultMessage: 'From',
    },
    TR_TO: {
        id: 'TR_TO',
        defaultMessage: 'To',
    },
    TR_STAKE_ETH: {
        id: 'TR_STAKE_ETH',
        defaultMessage: 'Stake Ethereum',
    },
    TR_STAKE_RESTAKED_BADGE: {
        id: 'TR_STAKE_RESTAKED_BADGE',
        defaultMessage: 'Restaked',
    },
    TR_STAKE_ETH_CARD_TITLE: {
        id: 'TR_STAKE_ETH_CARD_TITLE',
        defaultMessage: 'The easiest way to earn {symbol}',
    },
    TR_STAKE_ETH_EARN_REPEAT: {
        id: 'TR_STAKE_ETH_EARN_REPEAT',
        defaultMessage: 'Stake. Earn rewards. Repeat.',
    },
    TR_STAKE_ETH_SEE_MONEY_DANCE: {
        id: 'TR_STAKE_ETH_SEE_MONEY_DANCE',
        defaultMessage: 'Watch your money dance',
    },
    TR_STAKE_ETH_SEE_MONEY_DANCE_DESC: {
        id: 'TR_STAKE_ETH_SEE_MONEY_DANCE_DESC',
        defaultMessage: 'Earn {apyPercent}% <t>APY</t> by staking your Ethereum with Trezor.',
    },
    TR_STAKE_APY_DESC: {
        id: 'TR_STAKE_APY_DESC',
        defaultMessage: '*Annual Percentage Yield',
    },
    TR_STAKE_ETH_LOCK_FUNDS: {
        id: 'TR_STAKE_ETH_LOCK_FUNDS',
        defaultMessage: 'Lock in funds with flexibility',
    },
    TR_STAKE_ETH_LOCK_FUNDS_DESC: {
        id: 'TR_STAKE_ETH_LOCK_FUNDS_DESC',
        defaultMessage: 'Staking locks in your funds, but you can unstake them anytime.',
    },
    TR_STAKE_ETH_EVERSTAKE: {
        id: 'TR_STAKE_ETH_EVERSTAKE',
        defaultMessage: 'Trezor & Everstake',
    },
    TR_STAKE_ETH_EVERSTAKE_DESC: {
        id: 'TR_STAKE_ETH_EVERSTAKE_DESC',
        defaultMessage: 'Everstake is a global leader and supplier of staking technology',
    },
    TR_STAKE_ETH_MAXIMIZE_REWARDS: {
        id: 'TR_STAKE_ETH_MAXIMIZE_REWARDS',
        defaultMessage: 'Maximize your rewards',
    },
    TR_STAKE_ETH_MAXIMIZE_REWARDS_DESC: {
        id: 'TR_STAKE_ETH_MAXIMIZE_REWARDS_DESC',
        defaultMessage: 'Soar high! Earn rewards on your rewards. Staking has never felt so good.',
    },
    TR_AVAILABLE_NOW_FOR: {
        id: 'TR_AVAILABLE_NOW_FOR',
        defaultMessage: 'Available now for',
    },
    TR_STAKE_START_STAKING: {
        id: 'TR_STAKE_START_STAKING',
        defaultMessage: 'Start staking',
    },
    TR_MAYBE_LATER: {
        id: 'TR_MAYBE_LATER',
        defaultMessage: 'Maybe later',
    },
    TR_STAKE_WHAT_IS_STAKING: {
        id: 'TR_STAKE_WHAT_IS_STAKING',
        defaultMessage: 'What is staking?',
    },
    TR_STAKE_STAKING_IS: {
        id: 'TR_STAKE_STAKING_IS',
        defaultMessage:
            "Staking involves temporarily locking your Ethereum assets to support the blockchain's operation. In return, you'll earn additional Ethereum as a reward.",
    },
    TR_STAKE_ANY_AMOUNT_ETH: {
        id: 'TR_STAKE_ANY_AMOUNT_ETH',
        defaultMessage:
            'Stake a minimum amount of {amount} {symbol} and start earning rewards. With our current APY rate of {apyPercent}%, your rewards earn too!',
    },
    TR_STAKE_LEARN_MORE: {
        id: 'TR_STAKE_LEARN_MORE',
        defaultMessage: 'Learn more',
    },
    TR_STAKE_STAKING_IN_A_NUTSHELL: {
        id: 'TR_STAKE_STAKING_IN_A_NUTSHELL',
        defaultMessage: 'Staking in a nutshell',
    },
    TR_STAKE_STAKING_PROCESS: {
        id: 'TR_STAKE_STAKING_PROCESS',
        defaultMessage: 'Staking process',
    },
    TR_STAKE_UNSTAKING_PROCESS: {
        id: 'TR_STAKE_UNSTAKING_PROCESS',
        defaultMessage: 'Unstaking process',
    },
    TR_STAKE_SIGN_TRANSACTION: {
        id: 'TR_STAKE_SIGN_TRANSACTION',
        defaultMessage: 'Sign transaction',
    },
    TR_STAKE_ENTER_THE_STAKING_POOL: {
        id: 'TR_STAKE_ENTER_THE_STAKING_POOL',
        defaultMessage: 'Enter the staking pool',
    },
    TR_STAKE_EARN_REWARDS_WEEKLY: {
        id: 'TR_STAKE_EARN_REWARDS_WEEKLY',
        defaultMessage: 'Earn rewards weekly',
    },
    TR_STAKE_SIGN_UNSTAKING_TRANSACTION: {
        id: 'TR_STAKE_SIGN_UNSTAKING_TRANSACTION',
        defaultMessage: 'Sign unstaking transaction',
    },
    TR_STAKE_LEAVE_STAKING_POOL: {
        id: 'TR_STAKE_LEAVE_STAKING_POOL',
        defaultMessage: 'Leave staking pool',
    },
    TR_STAKE_CLAIM_UNSTAKED: {
        id: 'TR_STAKE_CLAIM_UNSTAKED',
        defaultMessage: 'Claim unstaked {symbol}',
    },
    TR_STAKE_IN_ACCOUNT: {
        id: 'TR_STAKE_IN_ACCOUNT',
        defaultMessage: '{symbol} in account',
    },
    TR_STAKE_STAKED_ETH_AMOUNT_LOCKED: {
        id: 'TR_STAKE_STAKED_ETH_AMOUNT_LOCKED',
        defaultMessage: 'The staked amount of {symbol} is locked and can’t be traded or sent.',
    },
    TR_STAKE_UNSTAKING_TAKES: {
        id: 'TR_STAKE_UNSTAKING_TAKES',
        defaultMessage:
            'Unstaking currently takes {count, plural, one {# day} other {# days}}. Once completed, you can trade or send your funds.',
    },
    TR_STAKE_ETH_REWARDS_EARN: {
        id: 'TR_STAKE_ETH_REWARDS_EARN',
        defaultMessage:
            'Your rewards also earn. Keep them staked and watch your {symbol} rewards soar.',
    },
    TR_STAKE_AVAILABLE: {
        id: 'TR_STAKE_AVAILABLE',
        defaultMessage: 'Available',
    },
    TR_STAKE_MAX_FEE_DESC: {
        id: 'TR_STAKE_MAX_FEE_DESC',
        defaultMessage:
            'Maximum fee is the network transaction fee that you’re willing to pay on the network to ensure your transaction gets processed.',
    },
    TR_STAKE_MAX: {
        id: 'TR_STAKE_MAX',
        defaultMessage: 'Max',
    },
    TR_STAKE_LEFT_AMOUNT_FOR_WITHDRAWAL: {
        id: 'TR_STAKE_LEFT_AMOUNT_FOR_WITHDRAWAL',
        defaultMessage: 'We’ve left {amount} {symbol} out so you can pay for withdrawal fees.',
    },
    TR_STAKE_LEFT_SMALL_AMOUNT_FOR_WITHDRAWAL: {
        id: 'TR_STAKE_LEFT_SMALL_AMOUNT_FOR_WITHDRAWAL',
        defaultMessage:
            'We’ve left a small amount of {symbol} out so you can pay for withdrawal fees.',
    },
    TR_STAKE_RECOMMENDED_AMOUNT_FOR_WITHDRAWALS: {
        id: 'TR_STAKE_RECOMMENDED_AMOUNT_FOR_WITHDRAWALS',
        defaultMessage:
            "It's recommended to leave {amount} {symbol} so you can pay for withdrawal fees.",
    },
    TR_STAKE_CONFIRM_ENTRY_PERIOD: {
        id: 'TR_STAKE_CONFIRM_ENTRY_PERIOD',
        defaultMessage: 'Confirm entry period',
    },
    TR_STAKE_CONFIRM_AND_STAKE: {
        id: 'TR_STAKE_CONFIRM_AND_STAKE',
        defaultMessage: 'Confirm & stake',
    },
    TR_STAKE_ENTERING_POOL_MAY_TAKE: {
        id: 'TR_STAKE_ENTERING_POOL_MAY_TAKE',
        defaultMessage:
            'Entering the staking pool may take up to {count, plural, one {# day} other {# days}}',
    },
    TR_STAKE_ETH_WILL_BE_BLOCKED: {
        id: 'TR_STAKE_ETH_WILL_BE_BLOCKED',
        defaultMessage:
            'Your {symbol} will be blocked during this period, and you can’t cancel this. <a>Learn more</a>',
    },
    TR_STAKE_ACKNOWLEDGE_ENTRY_PERIOD: {
        id: 'TR_STAKE_ACKNOWLEDGE_ENTRY_PERIOD',
        defaultMessage: 'I acknowledge the above entry period',
    },
    TR_STAKE_STAKE: {
        id: 'TR_STAKE_STAKE',
        defaultMessage: 'Stake',
    },
    TR_STAKE_UNSTAKE: {
        id: 'TR_STAKE_UNSTAKE',
        defaultMessage: 'Unstake',
    },
    TR_STAKE_CLAIM: {
        id: 'TR_STAKE_CLAIM',
        defaultMessage: 'Claim',
    },
    TR_STAKE_STAKED_AMOUNT: {
        id: 'TR_STAKE_STAKED_AMOUNT',
        defaultMessage: 'Staked amount',
    },
    TR_STAKE_APY: {
        id: 'TR_STAKE_APY',
        defaultMessage: 'Annual Percentage Yield',
    },
    TR_STAKE_APY_ABBR: {
        id: 'TR_STAKE_APY_ABBR',
        defaultMessage: 'APY',
    },
    TR_STAKE_WEEKLY: {
        id: 'TR_STAKE_WEEKLY',
        defaultMessage: 'Weekly',
    },
    TR_STAKE_MONTHLY: {
        id: 'TR_STAKE_MONTHLY',
        defaultMessage: 'Monthly',
    },
    TR_STAKE_YEARLY: {
        id: 'TR_STAKE_YEARLY',
        defaultMessage: 'Yearly',
    },
    TR_STAKE_DAYS: {
        id: 'TR_STAKE_DAYS',
        defaultMessage: '{count, plural, one {# day} other {# days}}',
    },
    TR_STAKE_MAX_REWARD_DAYS: {
        id: 'TR_STAKE_MAX_REWARD_DAYS',
        defaultMessage: 'Max {count, plural, one {# day} other {# days}}',
    },
    TR_STAKE_NEXT_PAYOUT: {
        id: 'TR_STAKE_NEXT_PAYOUT',
        defaultMessage: 'Next reward payout',
    },
    TR_STAKE_STAKE_MORE: {
        id: 'TR_STAKE_STAKE_MORE',
        defaultMessage: 'Stake more',
    },
    TR_STAKE_UNSTAKE_TO_CLAIM: {
        id: 'TR_STAKE_UNSTAKE_TO_CLAIM',
        defaultMessage: 'Unstake to claim',
    },
    TR_STAKE_ETH_REWARDS_EARN_APY: {
        id: 'TR_STAKE_ETH_REWARDS_EARN_APY',
        defaultMessage:
            'Your {symbol} rewards also earn the APY rate. Keep your funds staked or add more to increase your rewards.',
    },
    TR_STAKE_REWARDS: {
        id: 'TR_STAKE_REWARDS',
        defaultMessage: 'Rewards',
    },
    TR_TX_CONFIRMED: {
        id: 'TR_TX_CONFIRMED',
        defaultMessage: 'Transaction confirmed',
    },
    TR_TX_CONFIRMING: {
        id: 'TR_TX_CONFIRMING',
        defaultMessage: 'Confirming transaction',
    },
    ZERO_BALANCE_TOKENS: {
        id: 'ZERO_BALANCE_TOKENS',
        defaultMessage: 'Zero-balance tokens',
    },
    TR_STAKE_ADDING_TO_POOL: {
        id: 'TR_STAKE_ADDING_TO_POOL',
        defaultMessage: 'Adding to staking pool',
    },
    TR_STAKE_STAKED_AND_EARNING: {
        id: 'TR_STAKE_STAKED_AND_EARNING',
        defaultMessage: 'Staked & earning rewards',
    },
    TR_STAKE_CLAIM_AFTER_UNSTAKING: {
        id: 'TR_STAKE_CLAIM_AFTER_UNSTAKING',
        defaultMessage: 'You can claim once the unstaking period is complete.',
    },
    TR_STAKE_UNSTAKING_PERIOD: {
        id: 'TR_STAKE_UNSTAKING_PERIOD',
        defaultMessage: 'Unstaking period',
    },
    TR_STAKE_UNSTAKING_APPROXIMATE: {
        id: 'TR_STAKE_UNSTAKING_APPROXIMATE',
        defaultMessage: 'Approximate {symbol} available instantly',
    },

    TR_STAKE_UNSTAKING_APPROXIMATE_DESCRIPTION: {
        id: 'TR_STAKE_UNSTAKING_APPROXIMATE_DESCRIPTION',
        defaultMessage:
            'Liquidity of the staking pool can allow for instant unstake of some funds. Remaining funds will follow the unstaking period',
    },
    TR_UP_TO_DAYS: {
        id: 'TR_UP_TO_DAYS',
        defaultMessage: 'up to {count, plural, one {# day} other {# days}}',
    },
    TR_STAKE_PAID_FROM_BALANCE: {
        id: 'TR_STAKE_PAID_FROM_BALANCE',
        defaultMessage: 'Paid from your balance',
    },
    TR_STAKE_OTHER_AMOUNT: {
        id: 'TR_STAKE_OTHER_AMOUNT',
        defaultMessage: 'Other amount',
    },
    TR_UP_TO: {
        id: 'TR_UP_TO',
        defaultMessage: 'up to',
    },
    TR_STAKE_ONLY_REWARDS: {
        id: 'TR_STAKE_ONLY_REWARDS',
        defaultMessage: 'Only rewards',
    },
    TR_STAKE_UNSTAKED_AND_READY_TO_CLAIM: {
        id: 'TR_STAKE_UNSTAKED_AND_READY_TO_CLAIM',
        defaultMessage: 'Unstaked and ready to claim',
    },
    TR_STAKE_TIME_TO_CLAIM: {
        id: 'TR_STAKE_TIME_TO_CLAIM',
        defaultMessage: 'Time to claim',
    },
    TR_STAKE_INSTANT: {
        id: 'TR_STAKE_INSTANT',
        defaultMessage: 'Instant',
    },
    TR_STAKE_CLAIM_PENDING: {
        id: 'TR_STAKE_CLAIM_PENDING',
        defaultMessage: 'Claim pending',
    },
    TR_STAKE_CLAIMED_AMOUNT_TRANSFERRED: {
        id: 'TR_STAKE_CLAIMED_AMOUNT_TRANSFERRED',
        defaultMessage: 'The claimed amount is transferred to your {symbol} account.',
    },
    TR_STAKE_CLAIMING_PERIOD: {
        id: 'TR_STAKE_CLAIMING_PERIOD',
        defaultMessage: 'Claiming period',
    },
    TR_STAKE_MIN_AMOUNT_TOOLTIP: {
        id: 'TR_STAKE_MIN_AMOUNT_TOOLTIP',
        defaultMessage: 'Minimum amount to stake is {amount} {symbol}',
    },
    TOAST_TX_STAKED: {
        id: 'TOAST_TX_STAKED',
        defaultMessage: '{amount} staked from {account}',
    },
    TOAST_TX_UNSTAKED: {
        id: 'TOAST_TX_UNSTAKED',
        defaultMessage: '{amount} unstaked',
    },
    TOAST_TX_CLAIMED: {
        id: 'TOAST_TX_CLAIMED',
        defaultMessage: '{amount} claimed',
    },
    TOAST_SUCCESSFUL_CLAIM: {
        id: 'TOAST_SUCCESSFUL_CLAIM',
        defaultMessage: '{symbol} claimed successfully',
    },
    TOAST_ESTIMATED_FEE_ERROR: {
        id: 'TOAST_ESTIMATED_FEE_ERROR',
        defaultMessage: 'Fee estimation from network failed. Using backup value.',
    },
    TR_STAKE_TOTAL_PENDING: {
        id: 'TR_STAKE_TOTAL_PENDING',
        defaultMessage: 'Total stake pending:',
    },
    TR_STAKE_UNSTAKING: {
        id: 'TR_STAKE_UNSTAKING',
        defaultMessage: 'Unstaking',
    },
    TR_STAKE_CAN_CLAIM_WARNING: {
        id: 'TR_STAKE_CAN_CLAIM_WARNING',
        defaultMessage:
            'You can already claim {amount} {symbol}. {br}Please claim or wait until new unstake is processed.',
    },
    TR_STAKE_CLAIM_IN_NEXT_BLOCK: {
        id: 'TR_STAKE_CLAIM_IN_NEXT_BLOCK',
        defaultMessage: 'in the next block',
    },
    TR_STAKE_NOT_ENOUGH_FUNDS: {
        id: 'TR_STAKE_NOT_ENOUGH_FUNDS',
        defaultMessage: 'Not enough {symbol} to pay network fees',
    },
    TR_STAKE_PROVIDED_BY: {
        id: 'TR_STAKE_PROVIDED_BY',
        defaultMessage: 'Powered by',
    },
    TR_STAKE_YOUR_FUNDS_MAINTAINED: {
        id: 'TR_STAKE_YOUR_FUNDS_MAINTAINED',
        defaultMessage: 'Your staked funds are maintained by Everstake',
    },
    TR_STAKE_EVERSTAKE_MANAGES: {
        id: 'TR_STAKE_EVERSTAKE_MANAGES',
        defaultMessage:
            'Everstake maintains and protects your staked {symbol} <t>with their smart contracts, infrastructure, and technology.</t>',
    },
    TR_STAKE_TREZOR_NO_LIABILITY: {
        id: 'TR_STAKE_TREZOR_NO_LIABILITY',
        defaultMessage:
            "When staking, the responsibility for your funds' security transitions from your Trezor to Everstake.",
    },
    TR_STAKE_CONSENT_TO_STAKING_WITH_EVERSTAKE: {
        id: 'TR_STAKE_CONSENT_TO_STAKING_WITH_EVERSTAKE',
        defaultMessage: 'I acknowledge and consent to staking with Everstake',
    },
    TR_SOLANA_TX_CONFIRMATION_MAY_TAKE_UP_TO_1_MIN: {
        id: 'TR_SOLANA_TX_CONFIRMATION_MAY_TAKE_UP_TO_1_MIN',
        defaultMessage: 'Confirmation of transaction may take up to <nowrap>1 minute</nowrap>',
    },
    TR_VIEW_ONLY_PROMO_YES: {
        id: 'TR_VIEW_ONLY_PROMO_YES',
        defaultMessage: 'Enable',
    },
    TR_VIEW_ONLY_PROMO_NOT_NOW: {
        id: 'TR_VIEW_ONLY_PROMO_NOT_NOW',
        defaultMessage: 'Skip',
    },
    TR_VIEW_ONLY_TOOLTIP_DESCRIPTION: {
        id: 'TR_VIEW_ONLY_TOOLTIP_DESCRIPTION',
        defaultMessage: 'Change view-only and access passphrase here.',
    },
    TR_GOT_IT_BUTTON: {
        id: 'TR_GOT_IT_BUTTON',
        defaultMessage: 'Got it',
    },
    TR_VIEW_ONLY_ENABLED: {
        id: 'TR_VIEW_ONLY_ENABLED',
        defaultMessage: 'View-only enabled',
    },
    TR_VIEW_ONLY_DISABLED: {
        id: 'TR_VIEW_ONLY_DISABLED',
        defaultMessage: 'View-only disabled',
    },
    TR_VIEW_ONLY_RADIOS_ENABLED_TITLE: {
        id: 'TR_VIEW_ONLY_RADIOS_ENABLED_TITLE',
        defaultMessage: 'Enabled',
    },
    TR_VIEW_ONLY_RADIOS_DISABLED_TITLE: {
        id: 'TR_VIEW_ONLY_RADIOS_DISABLED_TITLE',
        defaultMessage: 'Disabled',
    },
    TR_VIEW_ONLY_RADIOS_ENABLED_DESCRIPTION: {
        id: 'TR_VIEW_ONLY_RADIOS_ENABLED_DESCRIPTION',
        defaultMessage:
            'Balances & transactions <strong>remain visible</strong> in app after Trezor is disconnected.',
    },
    TR_VIEW_ONLY_RADIOS_DISABLED_DESCRIPTION: {
        id: 'TR_VIEW_ONLY_RADIOS_DISABLED_DESCRIPTION',
        defaultMessage:
            'Balances & transactions <strong>aren’t visible</strong> in the app after Trezor is disconnected.',
    },
    TR_VIEW_ONLY_SEND_COINS_INFO: {
        id: 'TR_VIEW_ONLY_SEND_COINS_INFO',
        defaultMessage: 'You always need to connect your Trezor to move coins.',
    },
    TR_SWITCH_DEVICE_EJECT_CONFIRMATION_TITLE: {
        id: 'TR_SWITCH_DEVICE_EJECT_CONFIRMATION_TITLE',
        defaultMessage: 'Eject this wallet?',
    },
    TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DESCRIPTION: {
        id: 'TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DESCRIPTION',
        defaultMessage:
            'Your funds and transactions won’t be visible until you reconnect your device.',
    },
    TR_SWITCH_DEVICE_EJECT_CONFIRMATION_PRIMARY_BUTTON: {
        id: 'TR_SWITCH_DEVICE_EJECT_CONFIRMATION_PRIMARY_BUTTON',
        defaultMessage: 'Eject',
    },
    TR_SWITCH_DEVICE_EJECT_CONFIRMATION_CANCEL_BUTTON: {
        id: 'TR_SWITCH_DEVICE_EJECT_CONFIRMATION_CANCEL_BUTTON',
        defaultMessage: 'Cancel',
    },
    TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DISABLE_VIEW_ONLY_TITLE: {
        id: 'TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DISABLE_VIEW_ONLY_TITLE',
        defaultMessage: 'Disabling view-only will eject this wallet',
    },
    TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DISABLE_VIEW_ONLY_DESCRIPTION: {
        id: 'TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DISABLE_VIEW_ONLY_DESCRIPTION',
        defaultMessage:
            "Your funds and transactions won't be visible until you reconnect your device.",
    },
    TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DISABLE_VIEW_ONLY_PRIMARY_BUTTON: {
        id: 'TR_SWITCH_DEVICE_EJECT_CONFIRMATION_DISABLE_VIEW_ONLY_PRIMARY_BUTTON',
        defaultMessage: 'Disable & eject',
    },
    TR_DO_NOT_SHOW_AGAIN: {
        id: 'TR_DO_NOT_SHOW_AGAIN',
        defaultMessage: "Don't show again",
    },
    TR_VIEW_ONLY: {
        id: 'TR_VIEW_ONLY',
        defaultMessage: 'View-only',
    },
    TR_URL_IN_TOKEN: {
        id: 'TR_URL_IN_TOKEN',
        defaultMessage: "Never visit URLs in token names or symbols; they're usually scams.",
    },
    TR_DEVICE_SETTINGS_WALLET_LOADING: {
        id: 'TR_DEVICE_SETTINGS_WALLET_LOADING',
        defaultMessage: 'Wallet loading',
    },
    TR_DEVICE_SETTINGS_DEFAULT_WALLET_LOADING_TITLE: {
        id: 'TR_DEVICE_SETTINGS_DEFAULT_WALLET_LOADING_TITLE',
        defaultMessage: 'Wallet type to open on start',
    },
    TR_DEVICE_SETTINGS_DEFAULT_WALLET_LOADING_DESC: {
        id: 'TR_DEVICE_SETTINGS_DEFAULT_WALLET_LOADING_DESC',
        defaultMessage:
            'Set "Standard" or "Passphrase" as your default wallet option when Trezor Suite starts. Selecting "Passphrase" displays the passphrase entry box when you open the app. ',
    },
    TR_DEFAULT_WALLET_LOADING_STANDARD: {
        id: 'TR_DEFAULT_WALLET_LOADING_STANDARD',
        defaultMessage: 'Standard',
    },
    TR_DEFAULT_WALLET_LOADING_PASSPHRASE: {
        id: 'TR_DEFAULT_WALLET_LOADING_PASSPHRASE',
        defaultMessage: 'Passphrase',
    },
    TR_DEVICE_SETTINGS_ENABLE_VIEW_ONLY_TITLE: {
        id: 'TR_DEVICE_SETTINGS_ENABLE_VIEW_ONLY_TITLE',
        defaultMessage: 'Enable view-only to see balances in app even after Trezor is disconnected',
    },
    TR_DEVICE_SETTINGS_ENABLE_VIEW_ONLY_DESC: {
        id: 'TR_DEVICE_SETTINGS_ENABLE_VIEW_ONLY_DESC',
        defaultMessage: 'Connect Trezor to move or trade coins.',
    },
    TR_DEVICE_SETTINGS_ENABLE_VIEW_ONLY_CHANGE_BUTTON: {
        id: 'TR_DEVICE_SETTINGS_ENABLE_VIEW_ONLY_CHANGE_BUTTON',
        defaultMessage: 'Change',
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_HINT: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_HINT',
        defaultMessage: 'Learn how a passphrase works',
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_HINT_LINK: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_HINT_LINK',
        defaultMessage: 'Go',
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_TITLE: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_TITLE',
        defaultMessage: 'This passphrase wallet is empty',
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_UNUSED_WALLET_DESCRIPTION: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_UNUSED_WALLET_DESCRIPTION',
        defaultMessage: "This wallet is empty and hasn't been used before. Do you want to open it?",
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_UNUSED_WALLET_BUTTON: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_UNUSED_WALLET_BUTTON',
        defaultMessage: 'Yes, open',
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_WITH_FUNDS_DESCRIPTION: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_WITH_FUNDS_DESCRIPTION',
        defaultMessage: 'Expecting a passphrase wallet with funds?',
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_WITH_FUNDS_BUTTON: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_WITH_FUNDS_BUTTON',
        defaultMessage: 'Try again',
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_TITLE: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_TITLE',
        defaultMessage: 'Passphrase best practices',
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_WARNING: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_WARNING',
        defaultMessage: 'No one can recover it, not even Trezor Support.',
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM1_DESCRIPTION: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM1_DESCRIPTION',
        defaultMessage:
            'Write your passphrase on paper & keep it away from anything digital (no cloud, USB, internet, phone).',
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM2_DESCRIPTION: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM2_DESCRIPTION',
        defaultMessage:
            'Store it in a secure location, separate from both your wallet backup and Trezor device.',
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM3_DESCRIPTION: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM3_DESCRIPTION',
        defaultMessage: 'Never share it with anyone, not even with Trezor Support.',
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_BUTTON: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_BUTTON',
        defaultMessage: 'Got it, continue',
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_TITLE: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_TITLE',
        defaultMessage: 'Confirm passphrase',
    },
    TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_WARNING: {
        id: 'TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_WARNING',
        defaultMessage:
            'Write it down on paper, keep it away from anything digital, and store it in a safe place. No one can recover it, not even Trezor Support.',
    },
    TR_PASSPHRASE_DESCRIPTION_ITEM1: {
        id: 'TR_PASSPHRASE_DESCRIPTION_ITEM1',
        defaultMessage: "It's important to first learn how a passphrase works",
    },
    TR_PASSPHRASE_DESCRIPTION_ITEM2: {
        id: 'TR_PASSPHRASE_DESCRIPTION_ITEM2',
        defaultMessage: 'A passphrase opens a wallet secured by that phrase',
    },
    TR_PASSPHRASE_DESCRIPTION_ITEM3: {
        id: 'TR_PASSPHRASE_DESCRIPTION_ITEM3',
        defaultMessage: 'No one can recover it, not even Trezor Support',
    },
    TR_CONNECT_DEVICE_SEND_PROMO_TITLE: {
        id: 'TR_CONNECT_DEVICE_SEND_PROMO_TITLE',
        defaultMessage: "Your Trezor isn't connected",
    },
    TR_CONNECT_DEVICE_SEND_PROMO_DESCRIPTION: {
        id: 'TR_CONNECT_DEVICE_SEND_PROMO_DESCRIPTION',
        defaultMessage: 'To send coins, connect your Trezor.',
    },
    TR_CONNECT_DEVICE_RECEIVE_PROMO_TITLE: {
        id: 'TR_CONNECT_DEVICE_RECEIVE_PROMO_TITLE',
        defaultMessage: "Receive address can't be verified",
    },
    TR_CONNECT_DEVICE_RECEIVE_PROMO_DESCRIPTION: {
        id: 'TR_CONNECT_DEVICE_RECEIVE_PROMO_DESCRIPTION',
        defaultMessage:
            "Verify on Trezor to confirm receive address. Continuing without confirming isn't recommended.",
    },
    TR_CONNECT_DEVICE_PASSPHRASE_BANNER_TITLE: {
        id: 'TR_CONNECT_DEVICE_PASSPHRASE_BANNER_TITLE',
        defaultMessage: 'Do you primarily use a passphrase?',
    },
    TR_CONNECT_DEVICE_PASSPHRASE_BANNER_DESCRIPTION: {
        id: 'TR_CONNECT_DEVICE_PASSPHRASE_BANNER_DESCRIPTION',
        defaultMessage: 'Enable the passphrase entry dialog to open when you open Trezor Suite.',
    },
    TR_CONNECT_DEVICE_PASSPHRASE_BANNER_BUTTON: {
        id: 'TR_CONNECT_DEVICE_PASSPHRASE_BANNER_BUTTON',
        defaultMessage: 'Manage',
    },
    TR_SELECT_TREZOR: {
        id: 'TR_SELECT_TREZOR',
        defaultMessage: 'Select Trezor',
    },
    TR_SELECT_TREZOR_TO_CONTINUE: {
        id: 'TR_SELECT_TREZOR_TO_CONTINUE',
        defaultMessage: 'Select your Trezor to continue.',
    },
    TR_KEEP_RUNNING_IN_BACKGROUND: {
        id: 'TR_KEEP_RUNNING_IN_BACKGROUND',
        defaultMessage: 'Keep running in background',
    },
    TR_BRIDGE: {
        id: 'TR_BRIDGE',
        defaultMessage: 'Trezor Bridge',
    },
    TR_BRIDGE_REQUESTED_DESCRIPTION: {
        id: 'TR_BRIDGE_REQUESTED_DESCRIPTION',
        defaultMessage:
            'Another app requested Trezor Suite to connect with your Trezor device. Keep Trezor Suite running in the background and retry the action in the other app.',
    },
    TR_BRIDGE_GO_TO_WALLET_DESCRIPTION: {
        id: 'TR_BRIDGE_GO_TO_WALLET_DESCRIPTION',
        defaultMessage:
            "Are you sure? Your device can only be used by one app at a time. If you're currently using another app with your Trezor device, finish that session first.",
    },
    TR_BRIDGE_NEEDED_DESCRIPTION: {
        id: 'TR_BRIDGE_NEEDED_DESCRIPTION',
        defaultMessage:
            "Your browser isn't supported. For the best experience, download and run the Trezor Suite desktop app in the background, or use a supported Chromium-based browser that is compatible with WebUSB.",
    },
    TR_OPEN_TREZOR_SUITE_DESKTOP: {
        id: 'TR_OPEN_TREZOR_SUITE_DESKTOP',
        defaultMessage: 'Open the Trezor Suite desktop app',
    },
    TR_AUTO_START: {
        id: 'TR_AUTO_START',
        defaultMessage: 'Start Trezor Suite automatically',
    },
    TR_AUTO_START_DESCRIPTION: {
        id: 'TR_AUTO_START_DESCRIPTION',
        defaultMessage: 'Start Trezor Suite in the background when you log into your computer.',
    },
    TR_CUSTOM_FEE_WARNING: {
        id: 'TR_CUSTOM_FEE_WARNING',
        defaultMessage:
            'Setting a low fee might cause your transaction to fail or experience significant delays.',
    },
    TR_BUMP_FEE_DISABLED_TOOLTIP: {
        id: 'TR_BUMP_FEE_DISABLED_TOOLTIP',
        defaultMessage:
            'To speed up your transactions, increase the fee on the oldest (by nonce) pending transaction in the queue. Transactions must be confirmed in order. <a>Learn more</a>',
    },
});
