import { defineMessages } from 'react-intl';

export default defineMessages({
    TR_404_DESCRIPTION: {
        defaultMessage: 'Whoops-a-daisy..! Our apologies. Looks like a wrong URL or broken link.',
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
        defaultMessage: 'Access Hidden wallet',
        id: 'TR_ACCESS_HIDDEN_WALLET',
    },
    TR_WALLET_SELECTION_ACCESS_HIDDEN_WALLET: {
        defaultMessage: 'Access Hidden wallet',
        id: 'TR_WALLET_SELECTION_ACCESS_HIDDEN_WALLET',
    },
    TR_WALLET_SELECTION_HIDDEN_WALLET: {
        defaultMessage: 'Hidden wallet',
        id: 'TR_WALLET_SELECTION_HIDDEN_WALLET',
    },
    TR_HIDDEN_WALLET_TOOLTIP: {
        id: 'TR_HIDDEN_WALLET_TOOLTIP',
        defaultMessage:
            'Passphrases add a custom phrase (e.g. a word, sentence, or string of characters) to your recovery seed. This creates a hidden wallet; each hidden wallet can use its own passphrase. Your standard wallet will still be accessible without a passphrase.',
    },
    TR_HIDDEN_WALLET_MODAL_DESCRIPTION: {
        id: 'TR_HIDDEN_WALLET_MODAL_DESCRIPTION',
        defaultMessage:
            'Passphrase is a custom word, sentence, or string of characters added to your recovery seed. Entering a new one creates a new hidden wallet.',
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
        defaultMessage:
            'All coins are currently disabled in Settings. Please add a new account or enable some coins in Settings. ',
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
        defaultMessage: '{networkName} not enabled in settings.',
        id: 'TR_ACCOUNT_EXCEPTION_NOT_ENABLED',
    },
    TR_ACCOUNT_EXCEPTION_NOT_EXIST: {
        defaultMessage: 'Account does not exist',
        id: 'TR_ACCOUNT_EXCEPTION_NOT_EXIST',
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
    TR_ACQUIRE_DEVICE_DESCRIPTION: {
        defaultMessage:
            'Your Trezor seems to be in use in another window. Please close all other windows or tabs that might be using your Trezor.',
        id: 'TR_ACQUIRE_DEVICE_DESCRIPTION',
    },
    TR_RECONNECT_DEVICE_DESCRIPTION: {
        defaultMessage:
            'If closing tabs and refreshing this page didn’t help, try reconnecting your Trezor.',
        id: 'TR_RECONNECT_DEVICE_DESCRIPTION',
    },
    TR_RECONNECT_DEVICE_DESCRIPTION_DESKTOP: {
        defaultMessage:
            'If closing tabs and reopening the Trezor Suite app didn’t help, try reconnecting your Trezor.',
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
    TR_ADD_ACCOUNT: {
        defaultMessage: 'Add account',
        id: 'TR_ADD_ACCOUNT',
    },
    TR_ADD_HIDDEN_WALLET: {
        defaultMessage: 'Add hidden wallet',
        id: 'TR_ADD_HIDDEN_WALLET',
    },
    TR_ADD_WALLET: {
        defaultMessage: 'Add wallet',
        id: 'TR_ADD_WALLET',
    },
    TR_ADDITIONAL_SECURITY_FEATURES: {
        defaultMessage: 'In the meantime, make sure you have completed all security steps below.',
        id: 'TR_ADDITIONAL_SECURITY_FEATURES',
    },
    TR_ADDRESS: {
        defaultMessage: 'Address',
        description: 'Used as label for receive/send address input',
        id: 'TR_ADDRESS',
    },
    TR_ADDRESSES_FRESH: {
        id: 'TR_ADDRESSES_FRESH',
        defaultMessage: 'Fresh addresses',
    },
    TR_ADDRESSES_USED: {
        id: 'TR_ADDRESSES_USED',
        defaultMessage: 'Used addresses',
    },
    TR_TRADE_REDIRECTING: {
        defaultMessage: 'Redirecting ...',
        id: 'TR_TRADE_REDIRECTING',
    },
    TR_FRACTION_BUTTONS_ALL: {
        defaultMessage: 'All',
        id: 'TR_FRACTION_BUTTONS_ALL',
    },
    TR_SPEND_NO_PROVIDERS: {
        defaultMessage: 'No providers',
        id: 'TR_SPEND_NO_PROVIDERS',
    },
    TR_SPEND_PROVIDER_CONTENT: {
        defaultMessage: 'This content is fully provided by our partner',
        id: 'TR_SPEND_PROVIDER_CONTENT',
    },
    TR_SPEND_PROVIDER_CONTENT_WINDOW: {
        defaultMessage:
            'Spend content is fully provided by our partner Bitrefill. You’ll choose your purchase on their website and finish the transaction in Trezor Suite.',
        id: 'TR_SPEND_PROVIDER_CONTENT_WINDOW',
    },
    TR_SPEND_STATUS_FINISHED: {
        defaultMessage: 'Finished',
        id: 'TR_SPEND_STATUS_FINISHED',
    },
    TR_EXCHANGE_NO_PROVIDERS: {
        defaultMessage: 'No providers',
        id: 'TR_EXCHANGE_NO_PROVIDERS',
    },
    TR_EXCHANGE_PROVIDER: {
        defaultMessage: 'Provider',
        id: 'TR_EXCHANGE_PROVIDER',
    },
    TR_EXCHANGE_GET_THIS_OFFER: {
        id: 'TR_EXCHANGE_GET_THIS_OFFER',
        defaultMessage: 'Get this deal',
    },
    TR_EXCHANGE_KYC: {
        id: 'TR_EXCHANGE_KYC',
        defaultMessage: 'KYC',
    },
    TR_EXCHANGE_KYC_INFO: {
        id: 'TR_EXCHANGE_KYC_INFO',
        defaultMessage:
            '"Know your customer" (KYC) refers to providing identifying information to the exchange provider, usually a phone number and a copy of an identification document. This varies from provider to provider and may depend on the amount you\'re exchanging, so check this information carefully before proceeding.',
    },
    TR_EXCHANGE_FIXED_OFFERS: {
        id: 'TR_EXCHANGE_FIXED_OFFERS',
        defaultMessage: 'Fixed-rate offers',
    },
    TR_EXCHANGE_FIXED_OFFERS_INFO: {
        id: 'TR_EXCHANGE_FIXED_OFFERS_INFO',
        defaultMessage:
            "Fixed rates show you exactly how much you'll end up with at the end of the exchange—the amount won't change between when you select the rate and when your transaction is complete. You're guaranteed the amount shown, but these rates are usually less generous, meaning your money won't buy as much crypto.",
    },
    TR_EXCHANGE_FLOAT_OFFERS: {
        id: 'TR_EXCHANGE_FLOAT_OFFERS',
        defaultMessage: 'Floating-rate offers',
    },
    TR_EXCHANGE_FLOAT_OFFERS_INFO: {
        id: 'TR_EXCHANGE_FLOAT_OFFERS_INFO',
        defaultMessage:
            "Floating rates mean that the final amount you'll get may change slightly due to fluctuations in the market between when you select the rate and when your transaction is complete. These rates are usually higher, meaning you could end up with more crypto in the end.",
    },
    TR_EXCHANGE_DEX_OFFERS: {
        id: 'TR_EXCHANGE_DEX_OFFERS',
        defaultMessage: 'Decentralized exchange offers',
    },
    TR_EXCHANGE_DEX_OFFERS_INFO: {
        id: 'TR_EXCHANGE_DEX_OFFERS_INFO',
        defaultMessage:
            'Decentralized exchange (DEX) swaps are performed via smart contracts running on the blockchain. They may be faster and offer better rates, especially for large amounts.',
    },
    TR_EXCHANGE_DEX_OFFER_NO_FUNDS_FEES: {
        id: 'TR_EXCHANGE_DEX_OFFER_NO_FUNDS_FEES',
        defaultMessage:
            'No funds remaining for the transaction fees. Please lower the exchange amount to max {symbol} {max}',
    },
    TR_EXCHANGE_DEX_OFFER_FEE_INFO: {
        defaultMessage:
            'The fees to perform this swap are estimated at {symbol} {approvalFee} ({approvalFeeFiat}) for approval (if required) and {symbol} {swapFee} ({swapFeeFiat}) for the swap.',
        id: 'TR_EXCHANGE_DEX_OFFER_FEE_INFO',
    },
    TR_EXCHANGE_FEES_INFO: {
        id: 'TR_EXCHANGE_FEES_INFO',
        defaultMessage:
            'All fees included; the transaction fee is estimated at {feeAmount} ({feeAmountFiat}).',
    },
    TR_EXCHANGE_DEX_FEES_INFO: {
        id: 'TR_EXCHANGE_DEX_FEES_INFO',
        defaultMessage: 'See info about fees in each DEX offer.',
    },
    TR_EXCHANGE_DEX_FEES_INFO_TOOLTIP: {
        id: 'TR_EXCHANGE_DEX_FEES_INFO_TOOLTIP',
        defaultMessage:
            'To perform a DEX swap, it may be necessary to perform two blockchain transactions: an approval transaction and a swap transaction. Each transaction has a different fee.',
    },
    TR_EXCHANGE_FEES_INCLUDED: {
        id: 'TR_EXCHANGE_FEES_INCLUDED',
        defaultMessage: 'All fees included',
    },
    TR_EXCHANGE_FEES_INCLUDED_INFO: {
        id: 'TR_EXCHANGE_FEES_INCLUDED_INFO',
        defaultMessage:
            "What you see is close to what you'll get—the amount shown is the best estimate of the final amount you'll receive, all exchange fees included. For float-rate offers, there may be slight changes between accepting the offer and completing the transaction.",
    },
    TR_EXCHANGE_VALIDATION_ERROR_MINIMUM_CRYPTO: {
        defaultMessage: 'Minimum is {minimum} {currency}',
        id: 'TR_EXCHANGE_VALIDATION_ERROR_MINIMUM_CRYPTO',
    },
    TR_EXCHANGE_VALIDATION_ERROR_MAXIMUM_CRYPTO: {
        defaultMessage: 'Maximum is {maximum} {currency}',
        id: 'TR_EXCHANGE_VALIDATION_ERROR_MAXIMUM_CRYPTO',
    },
    TR_EXCHANGE_SHOW_OFFERS: {
        defaultMessage: 'Compare offers',
        id: 'TR_EXCHANGE_SHOW_OFFERS',
    },
    TR_EXCHANGE_OFFERS_REFRESH: {
        defaultMessage: 'Offers refresh in',
        id: 'TR_EXCHANGE_OFFERS_REFRESH',
    },
    TR_EXCHANGE_FOR_YOUR_SAFETY: {
        defaultMessage: 'Keep your security in mind',
        id: 'TR_EXCHANGE_FOR_YOUR_SAFETY',
    },
    TR_EXCHANGE_I_UNDERSTAND: {
        defaultMessage: 'I understand and agree to all of the above',
        id: 'TR_EXCHANGE_I_UNDERSTAND',
    },
    TR_EXCHANGE_CONFIRM: {
        defaultMessage: 'Confirm',
        id: 'TR_EXCHANGE_CONFIRM',
    },
    TR_EXCHANGE_TERMS_1: {
        defaultMessage:
            "You're here to exchange cryptocurrency. If you were directed to this site for any other reason, please contact {provider} support before proceeding.",
        id: 'TR_EXCHANGE_TERMS_1',
    },
    TR_EXCHANGE_TERMS_2: {
        defaultMessage:
            "You're using this feature to exchange funds that will be sent to an account under your direct personal control.",
        id: 'TR_EXCHANGE_TERMS_2',
    },
    TR_EXCHANGE_TERMS_3: {
        defaultMessage:
            "You're not using this feature for gambling or any other violation of the provider’s terms of service.",
        id: 'TR_EXCHANGE_TERMS_3',
    },
    TR_EXCHANGE_TERMS_4: {
        defaultMessage:
            'You understand that cryptocurrencies are an emerging financial tool and that regulations may be limited in some areas. This may put you at a higher risk of fraud, theft, or market instability.',
        id: 'TR_EXCHANGE_TERMS_4',
    },
    TR_EXCHANGE_TERMS_5: {
        defaultMessage:
            'You understand that cryptocurrency transactions are irreversible and you won’t be able to receive a refund for your purchase.',
        id: 'TR_EXCHANGE_TERMS_5',
    },
    TR_EXCHANGE_DEX_TERMS_1: {
        defaultMessage:
            "You're here to exchange cryptocurrency using DEX (Decentralized Exchange) by using {provider}'s contract.",
        id: 'TR_EXCHANGE_DEX_TERMS_1',
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
            'The provider has marked this transaction as "suspicious"; you may be required to complete their KYC process to finish the trade. Please contact the provider\'s support to proceed.',
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
    TR_EXCHANGE_RECEIVING_ACCOUNT: {
        defaultMessage: 'Receiving account',
        id: 'TR_EXCHANGE_RECEIVING_ACCOUNT',
    },
    TR_EXCHANGE_VERIFY_ADDRESS_STEP: {
        defaultMessage: 'Receiving address',
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
        defaultMessage: "{provider}'s contract",
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
        defaultMessage: 'Slippage must be in range 0.01% - 50%',
        id: 'TR_EXCHANGE_SWAP_SLIPPAGE_NOT_IN_RANGE',
    },
    TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND: {
        defaultMessage: 'Confirm on Trezor & send',
        id: 'TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND',
    },
    TR_EXCHANGE_RECEIVE_ACCOUNT_QUESTION_TOOLTIP: {
        id: 'TR_EXCHANGE_RECEIVE_ACCOUNT_QUESTION_TOOLTIP',
        defaultMessage:
            "This is the account within your wallet where you'll find your coins once the transaction is finished.",
    },
    TR_EXCHANGE_RECEIVE_NON_SUITE_ACCOUNT_QUESTION_TOOLTIP: {
        id: 'TR_EXCHANGE_RECEIVE_NON_SUITE_ACCOUNT_QUESTION_TOOLTIP',
        defaultMessage: 'Receiving account is outside of Suite.',
    },
    TR_EXCHANGE_RECEIVE_NON_SUITE_ADDRESS_QUESTION_TOOLTIP: {
        id: 'TR_EXCHANGE_RECEIVE_NON_SUITE_ADDRESS_QUESTION_TOOLTIP',
        defaultMessage: 'This is the specific alphanumeric address that will receive your coins.',
    },
    TR_EXCHANGE_SELECT_RECEIVE_ACCOUNT: {
        id: 'TR_EXCHANGE_SELECT_RECEIVE_ACCOUNT',
        defaultMessage: 'Select {symbol} receiving account',
    },
    TR_EXCHANGE_RECEIVING_ADDRESS_INFO: {
        defaultMessage: "Your address is where you'll receive your {symbol}.",
        id: 'TR_EXCHANGE_RECEIVING_ADDRESS_INFO',
    },
    TR_EXCHANGE_RECEIVING_ADDRESS: {
        defaultMessage: 'Receiving address',
        id: 'TR_EXCHANGE_RECEIVING_ADDRESS',
    },
    TR_EXCHANGE_RECEIVING_ADDRESS_REQUIRED: {
        defaultMessage: 'Receiving address is required',
        id: 'TR_EXCHANGE_RECEIVING_ADDRESS_REQUIRED',
    },
    TR_EXCHANGE_RECEIVING_ADDRESS_INVALID: {
        defaultMessage: 'Receiving address is invalid',
        id: 'TR_EXCHANGE_RECEIVING_ADDRESS_INVALID',
    },
    TR_EXCHANGE_RECEIVE_ADDRESS_QUESTION_TOOLTIP: {
        id: 'TR_EXCHANGE_RECEIVE_ADDRESS_QUESTION_TOOLTIP',
        defaultMessage:
            'This is the specific alphanumeric address that will receive your coins. Verify this address on your Trezor.',
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
        defaultMessage: "Use a {symbol} account that isn't in Suite",
        id: 'TR_EXCHANGE_USE_NON_SUITE_ACCOUNT',
    },
    TR_EXCHANGE_CONFIRMED_ON_TREZOR: {
        defaultMessage: 'Confirmed on Trezor',
        id: 'TR_EXCHANGE_CONFIRMED_ON_TREZOR',
    },
    TR_EXCHANGE_CONFIRM_ON_TREZOR: {
        defaultMessage: 'Confirm on Trezor',
        id: 'TR_EXCHANGE_CONFIRM_ON_TREZOR',
    },
    TR_EXCHANGE_GO_TO_PAYMENT: {
        defaultMessage: 'Continue transaction',
        id: 'TR_EXCHANGE_GO_TO_PAYMENT',
    },
    TR_EXCHANGE_SELL: {
        defaultMessage: 'Exchange',
        id: 'TR_EXCHANGE_SELL',
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
    TR_SELL_NO_PROVIDERS: {
        defaultMessage: 'No providers',
        id: 'TR_SELL_NO_PROVIDERS',
    },
    TR_SELL_OFFERS_FOR: {
        defaultMessage: 'Offers for',
        id: 'TR_SELL_OFFERS_FOR',
    },
    TR_SELL_SHOW_OFFERS: {
        defaultMessage: 'Show offers',
        id: 'TR_SELL_SHOW_OFFERS',
    },
    TR_REQUIRED_FIELD: {
        defaultMessage: 'Required',
        id: 'TR_REQUIRED_FIELD',
    },
    TR_SELL_VALIDATION_ERROR_MINIMUM_CRYPTO: {
        defaultMessage: 'Minimum is {minimum} {currency}',
        id: 'TR_SELL_VALIDATION_ERROR_MINIMUM_CRYPTO',
    },
    TR_SELL_VALIDATION_ERROR_MAXIMUM_CRYPTO: {
        defaultMessage: 'Maximum is {maximum} {currency}',
        id: 'TR_SELL_VALIDATION_ERROR_MAXIMUM_CRYPTO',
    },
    TR_SELL_VALIDATION_ERROR_MINIMUM_FIAT: {
        defaultMessage: 'Minimum is {minimum} {currency}',
        id: 'TR_SELL_VALIDATION_ERROR_MINIMUM_FIAT',
    },
    TR_SELL_VALIDATION_ERROR_MAXIMUM_FIAT: {
        defaultMessage: 'Maximum is {maximum} {currency}',
        id: 'TR_SELL_VALIDATION_ERROR_MAXIMUM_FIAT',
    },
    TR_SELL_FOR_YOUR_SAFETY: {
        defaultMessage: 'For your safety',
        id: 'TR_SELL_FOR_YOUR_SAFETY',
    },
    TR_SELL_I_UNDERSTAND: {
        defaultMessage: 'I understand and agree to all of the above',
        id: 'TR_SELL_I_UNDERSTAND',
    },
    TR_SELL_CONFIRM: {
        defaultMessage: 'Confirm',
        id: 'TR_SELL_CONFIRM',
    },
    TR_SELL_TERMS_1: {
        defaultMessage:
            "I'm here to sell cryptocurrency. If you were directed to this site for any other reason, please contact {provider} support before proceeding.",
        id: 'TR_SELL_TERMS_1',
    },
    TR_SELL_TERMS_2: {
        defaultMessage:
            "I'm using Invity to purchase funds that will be sent to an account under my direct personal control.",
        id: 'TR_SELL_TERMS_2',
    },
    TR_SELL_TERMS_3: {
        defaultMessage:
            "I'm not using Invity for gambling or any other violation of Invity’s Terms of service.",
        id: 'TR_SELL_TERMS_3',
    },
    TR_SELL_TERMS_4: {
        defaultMessage:
            'I understand that cryptocurrencies are an emerging financial tool and that regulations may be limited in some areas. This may put me at a higher risk of fraud, theft, or market instability.',
        id: 'TR_SELL_TERMS_4',
    },
    TR_SELL_TERMS_5: {
        defaultMessage:
            'I understand that cryptocurrency transactions are irreversible and I won’t be able to receive a refund for my purchase.',
        id: 'TR_SELL_TERMS_5',
    },
    TR_SELL_OTHER_OFFERS_IN: {
        defaultMessage: 'Other Offers in',
        id: 'TR_SELL_OTHER_OFFERS_IN',
    },
    TR_SELL_NO_OFFERS: {
        defaultMessage: 'Sorry, none of our partners can provide an offer at this time.',
        id: 'TR_SELL_NO_OFFERS',
    },
    TR_SELL_OFFERS_REFRESH: {
        defaultMessage: 'Refresh in',
        id: 'TR_SELL_OFFERS_REFRESH',
    },
    TR_SELL_GET_THIS_OFFER: {
        id: 'TR_SELL_GET_THIS_OFFER',
        defaultMessage: 'Get this Offer',
    },
    TR_SELL_REGISTER: {
        id: 'TR_SELL_REGISTER',
        defaultMessage: 'Register',
    },
    TR_SELL_PROVIDER: {
        defaultMessage: 'provider',
        id: 'TR_SELL_PROVIDER',
    },
    TR_SELL_FEES: {
        defaultMessage: 'Fees',
        id: 'TR_SELL_FEES',
    },
    TR_SELL_PAID_BY: {
        defaultMessage: 'paid by',
        id: 'TR_SELL_PAID_BY',
    },
    TR_SELL_BANK_ACCOUNT_VERIFICATION_INFO: {
        defaultMessage: '1-3 days to verify bank account',
        id: 'TR_SELL_BANK_ACCOUNT_VERIFICATION_INFO',
    },
    TR_SELL_ALL_FEES_INCLUDED: {
        defaultMessage: 'All fees included',
        id: 'TR_SELL_ALL_FEES_INCLUDED',
    },
    TR_SELL_SPEND: {
        defaultMessage: 'spend',
        id: 'TR_SELL_SPEND',
    },
    TR_SELL_RECEIVE: {
        defaultMessage: 'receive',
        id: 'TR_SELL_RECEIVE',
    },
    TR_SELL_BANK_ACCOUNT_STEP: {
        defaultMessage: 'Bank Account',
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
        defaultMessage: 'Bank accounts that you registered at your provider',
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
    TR_SAVINGS_KYC_SUCCESS_NOTIFICATION: {
        defaultMessage: 'KYC verification was successful.',
        id: 'TR_SAVINGS_KYC_SUCCESS_NOTIFICATION',
    },
    TR_SAVINGS_KYC_FAILED_NOTIFICATION: {
        defaultMessage: 'KYC verification was unsuccessful.',
        id: 'TR_SAVINGS_KYC_FAILED_NOTIFICATION',
    },
    TR_SAVINGS_NO_PROVIDERS: {
        defaultMessage: 'No providers',
        id: 'TR_SAVINGS_NO_PROVIDERS',
    },
    TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_REQUIRED: {
        defaultMessage: 'Amount is required.',
        id: 'TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_REQUIRED',
    },
    TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_INVALID_FORMAT: {
        defaultMessage: 'Amount must be a number.',
        id: 'TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_INVALID_FORMAT',
    },
    TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_MINIMUM: {
        defaultMessage: 'Minimum amount is {amount}.',
        id: 'TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_MINIMUM',
    },
    TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_MAXIMUM: {
        defaultMessage: 'Maximum amount is {amount}.',
        id: 'TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_MAXIMUM',
    },
    TR_SAVINGS_SETUP_HEADER: {
        defaultMessage: 'Your savings account setup',
        id: 'TR_SAVINGS_SETUP_HEADER',
    },
    TR_SAVINGS_SETUP_COUNTRY_LOCATION_DESCRIPTION: {
        defaultMessage:
            '{cryptoCurrencyName} savings account is a location specific feature. We are only able to provide offers to users from the supported countries listed below.',
        id: 'TR_SAVINGS_SETUP_COUNTRY_LOCATION_DESCRIPTION',
    },
    TR_SAVINGS_SETUP_COUNTRY_MISMATCH_DESCRIPTION: {
        defaultMessage:
            "If your country isn't listed above, you can always stack sats with {oneTimeBuyLink}.",
        id: 'TR_SAVINGS_SETUP_COUNTRY_MISMATCH_DESCRIPTION',
    },
    TR_SAVINGS_SETUP_ONE_TIME_BUY_LINK: {
        defaultMessage: 'one time buy',
        id: 'TR_SAVINGS_SETUP_ONE_TIME_BUY_LINK',
    },
    TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_LABEL: {
        defaultMessage: 'Frequency',
        id: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_LABEL',
    },
    TR_SAVINGS_SETUP_FIAT_AMOUNT_LABEL: {
        defaultMessage: 'Amount',
        id: 'TR_SAVINGS_SETUP_FIAT_AMOUNT_LABEL',
    },
    TR_SAVINGS_SETUP_RECEIVING_ADDRESS: {
        defaultMessage: 'Receiving address',
        id: 'TR_SAVINGS_SETUP_RECEIVING_ADDRESS',
    },
    TR_SAVINGS_SETUP_RECEIVING_ADDRESS_CHANGES_PAYMENT_INFO: {
        defaultMessage:
            'Changing the receiving address changes payment information. Please review the information on the next page carefully.',
        id: 'TR_SAVINGS_SETUP_RECEIVING_ADDRESS_CHANGES_PAYMENT_INFO',
    },
    TR_SAVINGS_SETUP_SUMMARY_LABEL: {
        defaultMessage: "In one year you'll save up",
        id: 'TR_SAVINGS_SETUP_SUMMARY_LABEL',
    },
    TR_SAVINGS_SETUP_CONFIRM_BUTTON: {
        defaultMessage: 'Confirm setup',
        id: 'TR_SAVINGS_SETUP_CONFIRM_BUTTON',
    },
    TR_SAVINGS_SETUP_KYC_IN_PROGRESS_HEADER: {
        defaultMessage: 'KYC verification in progress',
        id: 'TR_SAVINGS_SETUP_KYC_IN_PROGRESS_HEADER',
    },
    TR_SAVINGS_SETUP_KYC_IN_PROGRESS_DESCRIPTION: {
        defaultMessage: 'We will notify you about KYC verification progress.',
        id: 'TR_SAVINGS_SETUP_KYC_IN_PROGRESS_DESCRIPTION',
    },
    TR_SAVINGS_SETUP_KYC_FAILED_HEADER: {
        defaultMessage: 'KYC failed',
        id: 'TR_SAVINGS_SETUP_KYC_FAILED_HEADER',
    },
    TR_SAVINGS_SETUP_KYC_FAILED_DESCRIPTION: {
        defaultMessage: 'KYC verification failed. Please contact {providerName} support.',
        id: 'TR_SAVINGS_SETUP_KYC_FAILED_DESCRIPTION',
    },
    TR_SAVINGS_SETUP_KYC_ERROR_HEADER: {
        defaultMessage: 'KYC error',
        id: 'TR_SAVINGS_SETUP_KYC_ERROR_HEADER',
    },
    TR_SAVINGS_SETUP_KYC_ERROR_DESCRIPTION: {
        defaultMessage: 'Something went wrong during the KYC check. Please contact Trezor support.',
        id: 'TR_SAVINGS_SETUP_KYC_ERROR_DESCRIPTION',
    },
    TR_SAVINGS_PAYMENT_INFO_HEADER: {
        defaultMessage: 'Standing order',
        id: 'TR_SAVINGS_PAYMENT_INFO_HEADER',
    },
    TR_SAVINGS_PAYMENT_INFO_DESCRIPTION: {
        defaultMessage:
            'Set up a standing order in your bank to make sure your payments and savings are automatic.',
        id: 'TR_SAVINGS_PAYMENT_INFO_DESCRIPTION',
    },
    TR_SAVINGS_PAYMENT_INFO_NAME_LABEL: {
        defaultMessage: 'Name',
        id: 'TR_SAVINGS_PAYMENT_INFO_NAME_LABEL',
    },
    TR_SAVINGS_PAYMENT_INFO_IBAN_LABEL: {
        defaultMessage: 'IBAN',
        id: 'TR_SAVINGS_PAYMENT_INFO_IBAN_LABEL',
    },
    TR_SAVINGS_PAYMENT_INFO_BIC_LABEL: {
        defaultMessage: 'BIC',
        id: 'TR_SAVINGS_PAYMENT_INFO_BIC_LABEL',
    },
    TR_SAVINGS_PAYMENT_INFO_DESCRIPTION_LABEL: {
        defaultMessage: 'Description',
        id: 'TR_SAVINGS_PAYMENT_INFO_DESCRIPTION_LABEL',
    },
    TR_SAVINGS_UNSUPPORTED_COUNTRY_SELECT_LABEL: {
        defaultMessage: 'Select your country',
        id: 'TR_SAVINGS_UNSUPPORTED_COUNTRY_SELECT_LABEL',
    },
    TR_SAVINGS_OVERVIEW_PERIOD_WEEKLY: {
        defaultMessage: 'weekly',
        id: 'TR_SAVINGS_OVERVIEW_PERIOD_WEEKLY',
        dynamic: true,
    },
    TR_SAVINGS_OVERVIEW_PERIOD_BIWEEKLY: {
        defaultMessage: 'bi-weekly',
        id: 'TR_SAVINGS_OVERVIEW_PERIOD_BIWEEKLY',
        dynamic: true,
    },
    TR_SAVINGS_OVERVIEW_PERIOD_MONTHLY: {
        defaultMessage: 'monthly',
        id: 'TR_SAVINGS_OVERVIEW_PERIOD_MONTHLY',
        dynamic: true,
    },
    TR_SAVINGS_OVERVIEW_PERIOD_QUARTERLY: {
        defaultMessage: 'quarterly',
        id: 'TR_SAVINGS_OVERVIEW_PERIOD_QUARTERLY',
        dynamic: true,
    },
    TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_CURRENT_PAYMENT: {
        defaultMessage: 'Current payment',
        id: 'TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_CURRENT_PAYMENT',
    },
    TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_CURRENT_PAYMENT_STATUS: {
        defaultMessage: 'Next up',
        id: 'TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_CURRENT_PAYMENT_STATUS',
    },
    TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_NEXT_PAYMENT: {
        defaultMessage: 'Next payment',
        id: 'TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_NEXT_PAYMENT',
    },
    TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_NEXT_PAYMENT_STATUS: {
        defaultMessage: 'following',
        id: 'TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_NEXT_PAYMENT_STATUS',
    },
    TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_VIEW_PAYMENT_DETAILS_BUTTON_LABEL: {
        defaultMessage: 'View payment details',
        id: 'TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_VIEW_PAYMENT_DETAILS_BUTTON_LABEL',
    },
    TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_HIDE_PAYMENT_DETAILS_BUTTON_LABEL: {
        defaultMessage: 'Hide payment details',
        id: 'TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_HIDE_PAYMENT_DETAILS_BUTTON_LABEL',
    },
    TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_PAYMENT_HEADER: {
        defaultMessage: 'Waiting for your first payment.',
        id: 'TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_PAYMENT_HEADER',
    },
    TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_PAYMENT_DESCRIPTION: {
        defaultMessage:
            'Select View payment details to find the information you need to make the payment.',
        id: 'TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_PAYMENT_DESCRIPTION',
    },
    TR_SAVINGS_STATUS_PENDING: {
        defaultMessage: 'Pending',
        id: 'TR_SAVINGS_STATUS_PENDING',
    },
    TR_SAVINGS_STATUS_ERROR: {
        defaultMessage: 'Error',
        id: 'TR_SAVINGS_STATUS_ERROR',
    },
    TR_SAVINGS_STATUS_SUCCESS: {
        defaultMessage: 'Success',
        id: 'TR_SAVINGS_STATUS_SUCCESS',
    },
    TR_SAVINGS_TRANS_ID: {
        defaultMessage: 'Transaction ID:',
        id: 'TR_SAVINGS_TRANS_ID',
    },
    TR_SAVINGS_FOR_YOUR_SAFETY: {
        defaultMessage: 'Keep your security in mind',
        id: 'TR_SAVINGS_FOR_YOUR_SAFETY',
    },
    TR_SAVINGS_TERMS_1: {
        defaultMessage:
            "You're here to buy cryptocurrency. If you were directed to this site for any other reason, please contact {provider} support before proceeding.",
        id: 'TR_SAVINGS_TERMS_1',
    },
    TR_SAVINGS_TERMS_2: {
        defaultMessage:
            "You're using this feature to purchase funds that will be sent to an account under your direct personal control.",
        id: 'TR_SAVINGS_TERMS_2',
    },
    TR_SAVINGS_TERMS_3: {
        defaultMessage:
            "You're not using this feature for gambling or any other violation of the provider's terms of service.",
        id: 'TR_SAVINGS_TERMS_3',
    },
    TR_SAVINGS_TERMS_4: {
        defaultMessage:
            'You understand that cryptocurrencies are an emerging financial tool and that regulations may be limited in some areas. This may put you at a higher risk of fraud, theft, or market instability.',
        id: 'TR_SAVINGS_TERMS_4',
    },
    TR_SAVINGS_TERMS_5: {
        defaultMessage:
            "You understand that cryptocurrency transactions are irreversible and you won't be able to receive a refund for your purchase.",
        id: 'TR_SAVINGS_TERMS_5',
    },
    TR_SAVINGS_I_UNDERSTAND: {
        defaultMessage: 'I understand and agree to all of the above',
        id: 'TR_SAVINGS_I_UNDERSTAND',
    },
    TR_SAVINGS_CONFIRM: {
        defaultMessage: 'Confirm',
        id: 'TR_SAVINGS_CONFIRM',
    },
    TR_SAVINGS_SETUP_WAITING_MESSAGE: {
        defaultMessage: 'Please complete the setup on the Invity.io website.',
        id: 'TR_SAVINGS_SETUP_WAITING_MESSAGE',
    },
    TR_SAVINGS_SETUP_WAITING_BUTTON_LABEL: {
        defaultMessage: 'Go to Invity',
        id: 'TR_SAVINGS_SETUP_WAITING_BUTTON_LABEL',
    },
    TR_BUY_FOOTER_TEXT_1: {
        defaultMessage:
            'Invity is a comparison tool that connects you to the best exchange providers. They only use location in order to show the most relevant offers.',
        id: 'TR_BUY_FOOTER_TEXT_1',
    },
    TR_BUY_FOOTER_TEXT_2: {
        defaultMessage:
            'Invity does not see any of your payment or KYC information; you share this only with the exchange provider if you choose to finish the transaction.',
        id: 'TR_BUY_FOOTER_TEXT_2',
    },
    TR_BUY_FOR_YOUR_SAFETY: {
        defaultMessage: 'Keep your security in mind',
        id: 'TR_BUY_FOR_YOUR_SAFETY',
    },
    TR_BUY_I_UNDERSTAND: {
        defaultMessage: 'I understand and agree to all of the above',
        id: 'TR_BUY_I_UNDERSTAND',
    },
    TR_BUY_CONFIRM: {
        defaultMessage: 'Confirm',
        id: 'TR_BUY_CONFIRM',
    },
    TR_BUY_TERMS_1: {
        defaultMessage:
            "You're here to buy cryptocurrency. If you were directed to this site for any other reason, please contact {provider} support before proceeding.",
        id: 'TR_BUY_TERMS_1',
    },
    TR_BUY_TERMS_2: {
        defaultMessage:
            "You're using this feature to purchase funds that will be sent to an account under your direct personal control.",
        id: 'TR_BUY_TERMS_2',
    },
    TR_BUY_TERMS_3: {
        defaultMessage:
            "You're not using this feature for gambling or any other violation of the provider's terms of service.",
        id: 'TR_BUY_TERMS_3',
    },
    TR_BUY_TERMS_4: {
        defaultMessage:
            'You understand that cryptocurrencies are an emerging financial tool and that regulations may be limited in some areas. This may put you at a higher risk of fraud, theft, or market instability.',
        id: 'TR_BUY_TERMS_4',
    },
    TR_BUY_TERMS_5: {
        defaultMessage:
            'You understand that cryptocurrency transactions are irreversible and you won’t be able to receive a refund for your purchase.',
        id: 'TR_BUY_TERMS_5',
    },
    TR_BUY_OTHER_OFFERS_IN: {
        defaultMessage: 'More offers available if you pay in',
        id: 'TR_BUY_OTHER_OFFERS_IN',
    },
    TR_BUY_NO_OFFERS: {
        defaultMessage: 'Sorry, none of our partners can provide an offer at this time.',
        id: 'TR_BUY_NO_OFFERS',
    },
    TR_BUY_OFFERS_REFRESH: {
        defaultMessage: 'Offers refresh in',
        id: 'TR_BUY_OFFERS_REFRESH',
    },
    TR_BUY_VALIDATION_ERROR_EMPTY: {
        defaultMessage: 'Required',
        id: 'TR_BUY_VALIDATION_ERROR_EMPTY',
    },
    TR_BUY_VALIDATION_ERROR_MINIMUM_CRYPTO: {
        defaultMessage: 'Minimum is {minimum} {currency}',
        id: 'TR_BUY_VALIDATION_ERROR_MINIMUM_CRYPTO',
    },
    TR_BUY_VALIDATION_ERROR_MAXIMUM_CRYPTO: {
        defaultMessage: 'Maximum is {maximum} {currency}',
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
    TR_BUY_NO_PROVIDERS: {
        defaultMessage: 'No providers',
        id: 'TR_BUY_NO_PROVIDERS',
    },
    TR_BUY_GET_THIS_OFFER: {
        id: 'TR_BUY_GET_THIS_OFFER',
        defaultMessage: 'Get this deal',
    },
    TR_OFFER_ERROR_MINIMUM_CRYPTO: {
        defaultMessage:
            'The chosen amount of {currency} {amount} is lower than the accepted minimum of {currency} {min}.',
        id: 'TR_OFFER_ERROR_MINIMUM_CRYPTO',
    },
    TR_OFFER_ERROR_MAXIMUM_CRYPTO: {
        defaultMessage:
            'The chosen amount of {currency} {amount} is higher than the accepted maximum of {currency} {max}.',
        id: 'TR_OFFER_ERROR_MAXIMUM_CRYPTO',
    },
    TR_OFFER_ERROR_MINIMUM_FIAT: {
        defaultMessage:
            'The chosen amount of {currency} {amount} is lower than the accepted minimum of {currency} {min}.',
        id: 'TR_OFFER_ERROR_MINIMUM_FIAT',
    },
    TR_OFFER_ERROR_MAXIMUM_FIAT: {
        defaultMessage:
            'The chosen amount of {currency} {amount} is higher than the accepted maximum of {currency} {max}.',
        id: 'TR_OFFER_ERROR_MAXIMUM_FIAT',
    },
    TR_TERMS_OF_USE_INVITY: {
        defaultMessage: 'Terms of Use',
        id: 'TR_TERMS_OF_USE_INVITY',
    },
    TR_BUY_SPEND: {
        defaultMessage: 'Spend',
        id: 'TR_BUY_SPEND',
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
    TR_BUY_FEES: {
        defaultMessage: 'Fees',
        id: 'TR_BUY_FEES',
    },
    TR_BUY_PAID_BY: {
        defaultMessage: 'Payment method',
        id: 'TR_BUY_PAID_BY',
    },
    TR_BUY_ALL_FEES_INCLUDED: {
        defaultMessage: 'Includes all fees',
        id: 'TR_BUY_ALL_FEES_INCLUDED',
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
        defaultMessage: 'Receiving address',
        id: 'TR_BUY_RECEIVING_ADDRESS',
    },
    TR_BUY_CONFIRMED_ON_TREZOR: {
        defaultMessage: 'Confirmed on Trezor',
        id: 'TR_BUY_CONFIRMED_ON_TREZOR',
    },
    TR_BUY_OFFERS_FOR: {
        defaultMessage: 'Offers for',
        id: 'TR_BUY_OFFERS_FOR',
    },
    TR_BUY_NOT_TRANSACTIONS: {
        defaultMessage: 'No transactions yet.',
        id: 'TR_BUY_NOT_TRANSACTIONS',
    },
    TR_BUY_SHOW_OFFERS: {
        defaultMessage: 'Compare offers',
        id: 'TR_BUY_SHOW_OFFERS',
    },
    TR_BUY_CONFIRM_ON_TREZOR: {
        defaultMessage: 'Confirm on Trezor',
        id: 'TR_BUY_CONFIRM_ON_TREZOR',
    },
    TR_BUY_GO_TO_PAYMENT: {
        defaultMessage: 'Finish transaction',
        id: 'TR_BUY_GO_TO_PAYMENT',
    },
    TR_BUY_RECEIVING_ACCOUNT: {
        defaultMessage: 'Receiving account',
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
            "Click the button below to finish entering your details at the provider's site.",
        id: 'TR_BUY_DETAIL_SUBMITTED_TEXT',
    },
    TR_BUY_DETAIL_SUBMITTED_GATE: {
        defaultMessage: 'Go to payment gateway',
        id: 'TR_BUY_DETAIL_SUBMITTED_GATE',
    },
    TR_BUY_DETAIL_SUBMITTED_CANCEL: {
        defaultMessage: 'Cancel transaction',
        id: 'TR_BUY_DETAIL_SUBMITTED_CANCEL',
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
    TR_COINMARKET_NO_OFFERS_AUTORELOADING_IN: {
        defaultMessage: 'Autoreloading in',
        id: 'TR_COINMARKET_NO_OFFERS_AUTORELOADING_IN',
    },
    TR_COINMARKET_NO_OFFERS_HEADER: {
        defaultMessage: 'No offers',
        id: 'TR_COINMARKET_NO_OFFERS_HEADER',
    },
    TR_COINMARKET_NO_OFFERS_MESSAGE: {
        defaultMessage:
            "Sorry, we don't have any offers at the moment. Try to reload the page or change your query.",
        id: 'TR_COINMARKET_NO_OFFERS_MESSAGE',
    },
    TR_COINMARKET_NO_OFFERS_LOADING_FAILED_MESSAGE: {
        defaultMessage:
            "Sorry, we don't have any offers at the moment due to a server connectivity issue.",
        id: 'TR_COINMARKET_NO_OFFERS_LOADING_FAILED_MESSAGE',
    },
    TR_COINMARKET_NO_OFFERS_BACK_BUTTON: {
        defaultMessage: 'Back to Trade',
        id: 'TR_COINMARKET_NO_OFFERS_BACK_BUTTON',
    },
    TR_COINMARKET_NO_OFFERS_RELOAD_PAGE_BUTTON: {
        defaultMessage: 'Reload page',
        id: 'TR_COINMARKET_NO_OFFERS_RELOAD_PAGE_BUTTON',
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
        defaultMessage: '{networkName} receiving address',
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
        defaultMessage: 'Spell out each word of your recovery seed using your Trezor device.',
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
        defaultMessage: 'Usage data',
        id: 'TR_ALLOW_ANALYTICS',
    },
    TR_ALLOW_ANALYTICS_DESCRIPTION: {
        defaultMessage:
            'All data is kept strictly anonymous; we only use it to improve the Trezor ecosystem.',
        id: 'TR_ALLOW_ANALYTICS_DESCRIPTION',
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
    TR_AUTH_CONFIRM_FAILED_DESC: {
        defaultMessage: 'Invalid passphrase confirmation.',
        id: 'TR_AUTH_CONFIRM_FAILED_DESC',
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
    TR_DISCONNECT: {
        defaultMessage: 'Disconnect',
        id: 'TR_DISCONNECT',
    },
    TR_DISABLED: {
        defaultMessage: 'Disabled',
        id: 'TR_DISABLED',
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
    TR_BACKGROUND_GALLERY: {
        defaultMessage: 'Homescreen background gallery',
        id: 'TR_BACKGROUND_GALLERY',
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
            'If you have copied down your backup, your Trezor is almost ready.\nDo not lose your backup, or your funds could be inaccessible. There is no way to recover a lost backup.',
        description: 'Text that appears after backup is finished',
        id: 'TR_BACKUP_FINISHED_TEXT',
    },
    TR_BACKUP_RECOVERY_SEED: {
        defaultMessage: 'Backup',
        id: 'TR_BACKUP_RECOVERY_SEED',
    },
    TR_BACKUP_SUBHEADING_1: {
        defaultMessage:
            'Your Trezor will generate a list of words which you need to write down. This information is the most important part of securing your Trezor: it is the only offline backup of your Trezor and all wallets associated with it.',
        description: 'Explanation what recovery seed is',
        id: 'TR_BACKUP_SUBHEADING_1',
    },
    TR_BASIC_RECOVERY: {
        defaultMessage: 'Standard recovery',
        id: 'TR_BASIC_RECOVERY',
    },
    TR_BASIC_RECOVERY_OPTION: {
        defaultMessage: 'Enter your recovery seed word by word on your computer.',
        description: 'Enter words on your computer, recovery takes about 2 minutes.',
        id: 'TR_BASIC_RECOVERY_OPTION',
    },
    TR_BCH_ADDRESS_INFO: {
        defaultMessage:
            'Bitcoin Cash changed the format of addresses to cashaddr. Find more info about how to convert your address on our blog. {TR_LEARN_MORE}',
        id: 'TR_BCH_ADDRESS_INFO',
    },
    TR_BUY: {
        defaultMessage: ' Buy',
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
    TR_CHECK_PGP_SIGNATURE: {
        defaultMessage: 'Check PGP signature',
        id: 'TR_CHECK_PGP_SIGNATURE',
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
        defaultMessage: 'Check your Trezor screen',
        description: 'Placeholder in seed input asking user to pay attention to his device',
        id: 'TR_CHECK_YOUR_DEVICE',
    },
    TR_CLEAR: {
        defaultMessage: 'Clear',
        description: 'Clear form button',
        id: 'TR_CLEAR',
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
    TR_COIN_DISCOVERY_IN_PROGRESS: {
        defaultMessage: 'Checking balances',
        id: 'TR_COIN_DISCOVERY_IN_PROGRESS',
    },
    TR_COINS: {
        defaultMessage: 'Crypto',
        id: 'TR_COINS',
    },
    TR_CHANGE: {
        defaultMessage: 'Change',
        id: 'TR_CHANGE',
    },
    TR_CONFIRM: {
        defaultMessage: 'Confirm',
        id: 'TR_CONFIRM',
    },
    TR_CONFIRM_ACTION_ON_YOUR: {
        defaultMessage: 'Follow the instructions on your Trezor screen',
        id: 'TR_CONFIRM_ACTION_ON_YOUR',
    },
    TR_CONFIRM_EMPTY_HIDDEN_WALLET: {
        defaultMessage: 'Confirm empty hidden wallet',
        id: 'TR_CONFIRM_EMPTY_HIDDEN_WALLET',
    },
    TR_CONFIRM_EMPTY_HIDDEN_WALLET_ON: {
        defaultMessage: 'Confirm empty Hidden wallet on "{deviceLabel}" device.',
        id: 'TR_CONFIRM_EMPTY_HIDDEN_WALLET_ON',
    },
    TR_CONFIRM_PASSPHRASE: {
        defaultMessage: 'Confirm passphrase',
        id: 'TR_CONFIRM_PASSPHRASE',
    },
    TR_CONFIRM_PASSPHRASE_SOURCE: {
        defaultMessage: 'Confirm empty Hidden wallet passphrase source on "{deviceLabel}" device.',
        id: 'TR_CONFIRM_PASSPHRASE_SOURCE',
    },
    TR_CONFIRMED_TX: {
        defaultMessage: 'Confirmed',
        id: 'TR_CONFIRMED_TX',
    },
    TR_CONNECT_YOUR_DEVICE: {
        defaultMessage: 'Connect your Trezor',
        description: 'Prompt to user to connect his device.',
        id: 'TR_CONNECT_YOUR_DEVICE',
    },
    TR_RECONNECT_YOUR_DEVICE: {
        defaultMessage: 'Reconnect your Trezor',
        description: 'Prompt to user to reconnect his device.',
        id: 'TR_RECONNECT_YOUR_DEVICE',
    },
    TR_CONNECT_YOUR_TREZOR_TO_CHECK: {
        defaultMessage: 'Connect your Trezor to verify this address',
        id: 'TR_CONNECT_YOUR_TREZOR_TO_CHECK',
    },
    TR_WARNING: {
        defaultMessage: 'Warning',
        description: 'Device status',
        id: 'TR_WARNING',
    },
    TR_CONNECTED: {
        defaultMessage: 'Connected',
        description: 'Device status',
        id: 'TR_CONNECTED',
    },
    TR_CONTACT_OUR_SUPPORT_LINK: {
        defaultMessage: 'contact Trezor support',
        description: 'Part of sentence TR_DID_YOU_PURCHASE. Link to support',
        id: 'TR_CONTACT_OUR_SUPPORT_LINK',
    },
    TR_CONTACT_SUPPORT: {
        defaultMessage: 'Contact support',
        description: 'Button to click to contact support',
        id: 'TR_CONTACT_SUPPORT',
    },
    TR_SECURITY_CHECK_CONTACT_SUPPORT: {
        defaultMessage: 'Something seems off. Contact support.',
        description: 'Button to click to contact support',
        id: 'TR_SECURITY_CHECK_CONTACT_SUPPORT',
    },
    TR_CONTINUE: {
        defaultMessage: 'Continue',
        description: 'Generic continue button',
        id: 'TR_CONTINUE',
    },
    TR_ONBOARDING_START_CTA: {
        defaultMessage: 'Setup Trezor',
        id: 'TR_ONBOARDING_START_CTA',
    },
    TR_COPY_TO_CLIPBOARD: {
        defaultMessage: 'Copy',
        id: 'TR_COPY_TO_CLIPBOARD',
    },
    TR_CREATE_BACKUP: {
        defaultMessage: 'Create backup',
        id: 'TR_CREATE_BACKUP',
    },
    TR_DETAIL: {
        defaultMessage: 'Detail',
        description: 'Button in modal',
        id: 'TR_DETAIL',
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
            'Your Trezor was disconnected during the backup process. We strongly recommend that you use the factory reset option in the Suite settings to wipe your device and start the wallet backup process again.',
        description: 'Error message. Instruction what to do.',
        id: 'TR_DEVICE_DISCONNECTED_DURING_ACTION_DESCRIPTION',
    },
    TR_DEVICE_LABEL: {
        defaultMessage: 'Device tag: {label}',
        description: 'Display label of device',
        id: 'TR_DEVICE_LABEL',
    },
    TR_DEVICE_LABEL_IS_NOT_BACKED_UP: {
        defaultMessage: 'Device {deviceLabel} is not backed up',
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
        defaultMessage: 'Device {deviceLabel} is not connected',
        id: 'TR_DEVICE_LABEL_IS_NOT_CONNECTED',
    },
    TR_DEVICE_LABEL_IS_UNAVAILABLE: {
        defaultMessage: 'Device "{deviceLabel}" is unavailable',
        id: 'TR_DEVICE_LABEL_IS_UNAVAILABLE',
    },
    TR_EDIT: {
        defaultMessage: 'Edit',
        id: 'TR_EDIT',
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
        defaultMessage: 'Trezor does not have recovery seed.',
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
        defaultMessage: 'Firmware update required. ',
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
    TR_DEVICE_SETTINGS: {
        defaultMessage: 'Device settings',
        id: 'TR_DEVICE_SETTINGS',
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
            'It is possible to install custom firmware for your Trezor device if needed. Installing custom firmware will erase its memory and may make it unusable. Never use this process unless you really know what you are doing.',
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
    TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_T1: {
        defaultMessage:
            'Supports PNG or JPG, 128 x 64 pixels, and using only black and white (not grayscale).',
        id: 'TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_T1',
    },
    TR_DEVICE_SETTINGS_HOMESCREEN_EDITOR: {
        defaultMessage: 'Homescreen editor',
        id: 'TR_DEVICE_SETTINGS_HOMESCREEN_EDITOR',
    },
    TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_TT: {
        defaultMessage: 'Supports PNG or JPG, 144 x 144 pixels',
        id: 'TR_DEVICE_SETTINGS_HOMESCREEN_IMAGE_SETTINGS_TT',
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
            'Passphrases add a custom phrase (e.g. a word, sentence, or string of characters) to your recovery seed. This creates a hidden wallet; each hidden wallet can use its own passphrase. Your standard wallet will still be accessible without a passphrase. Do not forget your passphrase. Unlike everyday passwords, hidden wallet passphrases cannot be retrieved and your funds will be permanently lost.',
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
        defaultMessage: 'Do not change this unless you know what you are doing!',
        id: 'TR_SAFETY_CHECKS_PROMPT_LEVEL_WARNING',
    },
    TR_SAFETY_CHECKS_PROMPT_LEVEL_DESC: {
        defaultMessage:
            'Allow potentially unsafe actions, such as mismatching coin keys or extreme fees by manually approving them on your Trezor.',
        id: 'TR_SAFETY_CHECKS_PROMPT_LEVEL_DESC',
    },
    TR_SAFETY_CHECKS_DISABLED_WARNING: {
        defaultMessage: 'Safety Checks are disabled.',
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
            'Setting a strong PIN is one of the main ways to secure your device against unauthorized physical access and protect your funds.',
        id: 'TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC',
    },
    TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE: {
        defaultMessage: 'PIN',
        id: 'TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE',
    },
    TR_DEVICE_SETTINGS_CHANGE_PIN_DESC: {
        defaultMessage:
            'If your PIN has been exposed or you simply want to change it, you can reset it here. You can change your PIN as often as you like.',
        id: 'TR_DEVICE_SETTINGS_CHANGE_PIN_DESC',
    },
    TR_DEVICE_SETTINGS_CHANGE_PIN_TITLE: {
        defaultMessage: 'Change PIN',
        id: 'TR_DEVICE_SETTINGS_CHANGE_PIN_TITLE',
    },
    TR_DEVICE_SETTINGS_AUTO_LOCK: {
        defaultMessage: 'Auto-lock time',
        id: 'TR_DEVICE_SETTINGS_AUTO_LOCK',
    },
    TR_DEVICE_SETTINGS_AUTO_LOCK_SUBHEADING: {
        defaultMessage: 'The amount of time that elapses before the device automatically locks.',
        id: 'TR_DEVICE_SETTINGS_AUTO_LOCK_SUBHEADING',
    },
    TR_DEVICE_SETTINGS_AFTER_DELAY: {
        defaultMessage: 'After delay',
        id: 'TR_DEVICE_SETTINGS_AFTER_DELAY',
    },
    TR_DID_YOU_PURCHASE: {
        defaultMessage:
            'Please note, that device packaging including holograms have changed over time. You can check packaging details {TR_PACKAGING_LINK}. Also be sure you made your purchase from {TR_RESELLERS_LINK}. Otherwise, the device you are holding in your hands might be a counterfeit. Please {TR_CONTACT_OUR_SUPPORT_LINK}',
        description: 'Text to display when user is unhappy with his hologram.',
        id: 'TR_DID_YOU_PURCHASE',
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
        defaultMessage: 'Enter passphrase on {deviceLabel}',
        id: 'TR_ENTER_PASSPHRASE_ON_DEVICE_LABEL',
    },
    TR_ENTER_PIN: {
        defaultMessage: 'Enter PIN',
        description: 'Button. Submit PIN',
        id: 'TR_ENTER_PIN',
    },
    TR_ENTER_SEED_WORDS_INSTRUCTION: {
        defaultMessage:
            'Enter the words from your seed here in the order displayed on your device. ',
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
    TR_FAILED_BACKUP: {
        defaultMessage: 'Backup failed. Please wipe your Trezor and start the setup process again.',
        id: 'TR_FAILED_BACKUP',
    },
    TR_BACKUP_SUCCESSFUL: {
        defaultMessage: 'Backup successful',
        id: 'TR_BACKUP_SUCCESSFUL',
    },
    TR_FIAT_RATES_NOT_AVAILABLE: {
        defaultMessage: 'No data available',
        id: 'TR_FIAT_RATES_NOT_AVAILABLE',
    },
    TR_FIAT_RATES_NOT_AVAILABLE_TOOLTIP: {
        defaultMessage: 'Fiat rates are not currently available.',
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
    TR_FIND_OUT_MORE_INFO: {
        defaultMessage: 'Learn more',
        id: 'TR_FIND_OUT_MORE_INFO',
    },
    TR_FIRMWARE: {
        defaultMessage: 'Firmware',
        id: 'TR_FIRMWARE',
    },
    TR_FIRMWARE_UPDATE: {
        defaultMessage: 'Firmware update',
        description: 'Heading on firmware page',
        id: 'TR_FIRMWARE_UPDATE',
    },
    TR_FIRMWARE_INSTALLED: {
        defaultMessage: 'Ready to go! The latest firmware has been installed.',
        description: 'Message to display in case firmware is installed',
        id: 'TR_FIRMWARE_INSTALLED',
    },
    TR_FIRMWARE_INSTALLED_TEXT: {
        defaultMessage: 'This device has firmware {version} installed.',
        description: 'Text to display in case device has firmware installed but it is outdated',
        id: 'TR_FIRMWARE_INSTALLED_TEXT',
    },
    TR_INSTALL_FIRMWARE: {
        defaultMessage: 'Install firmware',
        description: 'sub heading in onboarding when user is about to install a new firmware',
        id: 'TR_INSTALL_FIRMWARE',
    },
    TR_FIRMWARE_SUBHEADING: {
        defaultMessage:
            'Your Trezor is shipped without any firmware, so you can install the latest version directly by clicking the button below. When your device starts up, it will confirm that the firmware is authentic or display a warning.',
        description: 'Main text on firmware page for devices without firmware.',
        id: 'TR_FIRMWARE_SUBHEADING',
    },
    TR_FIRMWARE_VERSION: {
        defaultMessage: 'Firmware version',
        id: 'TR_FIRMWARE_VERSION',
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
    TR_FIRMWARE_VALIDATION_ONE_V2: {
        defaultMessage: 'You need to upgrade to bootloader 1.8.0 first',
        id: 'TR_FIRMWARE_VALIDATION_ONE_V2',
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
    TR_GO_TO_SECURITY: {
        defaultMessage: 'Create backup',
        description: 'Button in security page (start security setup)',
        id: 'TR_GO_TO_SECURITY',
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
    TR_SKIP_BACKUP: {
        defaultMessage: 'Skip Backup',
        id: 'TR_SKIP_BACKUP',
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
            'All data is anonymous and is used only for product development purposes. Read more in our <analytics>technical documentation</analytics> and <tos>Terms & Conditions</tos>.',
    },
    TR_EJECT_WALLET: {
        defaultMessage: 'Eject wallet',
        id: 'TR_EJECT_WALLET',
    },
    TR_EJECT_WALLET_EXPLANATION: {
        defaultMessage: 'Instantly removes all wallet data from Suite. ',
        id: 'TR_EJECT_WALLET_EXPLANATION',
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
    TR_HOW_PIN_WORKS: {
        defaultMessage: 'More about your PIN',
        id: 'TR_HOW_PIN_WORKS',
    },
    TR_I_UNDERSTAND_PASSPHRASE: {
        defaultMessage: 'I understand, passphrases cannot be retrieved unlike everyday passwords',
        id: 'TR_I_UNDERSTAND_PASSPHRASE',
    },
    TR_IF_YOUR_DEVICE_IS_EVER_LOST: {
        defaultMessage: 'If your Trezor is lost or damaged, your funds will be irreversibly lost.',
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
    TR_DO_NOT_DISCONNECT: {
        defaultMessage: 'Do not disconnect your Trezor.',
        description: 'Message that is visible when installing process is in progress.',
        id: 'TR_DO_NOT_DISCONNECT',
    },
    TR_LABELING: {
        defaultMessage: 'Labeling',
        id: 'TR_LABELING',
    },
    TR_LANGUAGE: {
        defaultMessage: 'Language',
        id: 'TR_LANGUAGE',
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
            'In case of communication with our support team, there is a log containing all necessary technical info.',
    },
    TR_LTC_ADDRESS_INFO: {
        defaultMessage:
            'Litecoin changed the format of addresses. Find more info about how to convert your address on our blog. {TR_LEARN_MORE}',
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
        defaultMessage: 'Account',
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
    TR_NETWORK_ETHEREUM_LABEL: {
        defaultMessage: 'Incl. ERC-20 tokens',
        id: 'TR_NETWORK_ETHEREUM_LABEL',
    },
    TR_NETWORK_ETHEREUM_TOOLTIP: {
        defaultMessage: 'Supported tokens',
        id: 'TR_NETWORK_ETHEREUM_TOOLTIP',
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
        defaultMessage: 'New Trezor firmware is available! Please update your device.',
        id: 'TR_NEW_TREZOR_FIRMWARE_IS_AVAILABLE_DOT',
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
        defaultMessage: 'Get started by receiving transactions or buying {network}.',
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
    TR_OPEN_IN_BLOCK_EXPLORER: {
        defaultMessage: 'Open in Block Explorer',
        id: 'TR_OPEN_IN_BLOCK_EXPLORER',
    },
    TR_OUTGOING: {
        defaultMessage: 'Outgoing',
        id: 'TR_OUTGOING',
    },
    TR_SPEND_STAY: {
        defaultMessage: 'Stay in Spend',
        id: 'TR_SPEND_STAY',
    },
    TR_SPEND_LEAVE: {
        defaultMessage: 'Leave anyway',
        id: 'TR_SPEND_LEAVE',
    },
    TR_SPEND_LEAVE_MODAL_INFO: {
        defaultMessage: 'Suite is communicating with Bitrefill; do not leave this tab.',
        id: 'TR_SPEND_LEAVE_MODAL_INFO',
    },
    TR_SPEND_OPEN_WINDOW: {
        defaultMessage: 'Go to partner site',
        id: 'TR_SPEND_OPEN_WINDOW',
    },
    TR_SPEND_TRANS_ID: {
        defaultMessage: 'Trans. ID:',
        id: 'TR_SPEND_TRANS_ID',
    },
    TR_PACKAGING_LINK: {
        defaultMessage: 'here',
        description: 'Part of sentence TR_DID_YOU_PURCHASE. Link to support',
        id: 'TR_PACKAGING_LINK',
    },
    TR_PASSPHRASE_CASE_SENSITIVE: {
        defaultMessage: 'Note: Passphrase is case-sensitive.',
        id: 'TR_PASSPHRASE_CASE_SENSITIVE',
    },
    TR_PASSPHRASE_HIDDEN_WALLET: {
        defaultMessage: 'Hidden wallet',
        id: 'TR_PASSPHRASE_HIDDEN_WALLET',
    },
    TR_PASSPHRASE_TOO_LONG: {
        defaultMessage: 'Passphrase length has exceed the allowed limit.',
        id: 'TR_PASSPHRASE_TOO_LONG',
    },
    TR_PASSPHRASE_WALLET: {
        defaultMessage: 'Hidden wallet #{id}',
        id: 'TR_PASSPHRASE_WALLET',
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
            'Write your PIN down and keep it safe, separate from your recovery seed. Use it to unlock your Trezor when you need to access your funds.',
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
        defaultMessage: 'Please allow your camera to be able to scan a QR code.',
        id: 'TR_PLEASE_ALLOW_YOUR_CAMERA',
    },
    TR_PLEASE_CONNECT_YOUR_DEVICE: {
        defaultMessage: 'Please connect your device to continue with the verification process.',
        id: 'TR_PLEASE_CONNECT_YOUR_DEVICE',
    },
    TR_PLEASE_ENABLE_PASSPHRASE: {
        defaultMessage:
            'Please enable passphrase settings to continue with the verification process.',
        id: 'TR_PLEASE_ENABLE_PASSPHRASE',
    },
    TR_PRIMARY_FIAT: {
        defaultMessage: 'Fiat currency',
        id: 'TR_PRIMARY_FIAT',
    },
    TR_RANDOM_SEED_WORDS_DISCLAIMER: {
        defaultMessage:
            ' You may be asked to type some words that are not part of your recovery seed.',
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
    TR_BECH32_BANNER_TITLE: {
        defaultMessage: 'New to Trezor Suite: Bech32 accounts!',
        id: 'TR_BECH32_BANNER_TITLE',
    },
    TR_BECH32_BANNER_POINT_1: {
        defaultMessage:
            'Lowercase letters only = <strong>lower chance of any reviewing errors</strong>',
        id: 'TR_BECH32_BANNER_POINT_1',
    },
    TR_BECH32_BANNER_POINT_2: {
        defaultMessage:
            'Efficient technology = <strong>pay up to 25% lower transactions fees</strong>',
        id: 'TR_BECH32_BANNER_POINT_2',
    },
    TR_TAPROOT_BANNER_TITLE: {
        defaultMessage: 'New to Trezor Suite: Taproot accounts!',
        id: 'TR_TAPROOT_BANNER_TITLE',
    },
    TR_TAPROOT_BANNER_POINT_1: {
        defaultMessage:
            'Lowercase letters only = <strong>lower chance of any reviewing errors</strong>',
        id: 'TR_TAPROOT_BANNER_POINT_1',
    },
    TR_TAPROOT_BANNER_POINT_2: {
        defaultMessage: 'Improved privacy for all Bitcoin transactions',
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
    TR_RECOVER_SUBHEADING: {
        defaultMessage:
            'If you want to recover an existing wallet, you can do so with your recovery seed. Select the number of words in your recovery seed.',
        description: 'Subheading in recover page. Basic info about recovery',
        id: 'TR_RECOVER_SUBHEADING',
    },
    TR_RECOVER_SUBHEADING_MODEL_T: {
        defaultMessage:
            "Using a Trezor Model T, the entire recovery process is done on the device's touchscreen.",
        description: 'Subheading in recover page. Basic info about recovery',
        id: 'TR_RECOVER_SUBHEADING_MODEL_T',
    },
    TR_RECOVERY_ERROR: {
        defaultMessage: 'Device recovery failed: {error}',
        description: 'Error during recovery. For example wrong word retyped or device disconnected',
        id: 'TR_RECOVERY_ERROR',
    },
    TR_RECOVERY_SEED_IS: {
        defaultMessage:
            'The process of creating a list of words in a specific order which store all the information needed to recover a wallet.',
        id: 'TR_RECOVERY_SEED_IS',
    },
    TR_CHECK_RECOVERY_SEED_DESCRIPTION: {
        defaultMessage: 'Perform a simulated recovery to check your backup.',
        id: 'TR_CHECK_RECOVERY_SEED_DESCRIPTION',
    },
    TR_RECOVERY_TYPES_DESCRIPTION: {
        defaultMessage:
            'Both methods are secure; advanced recovery allows you to input your recovery seed using your Trezor screen and takes slightly longer.',
        description: 'There are two methods of recovery for T1. This is a short explanation text.',
        id: 'TR_RECOVERY_TYPES_DESCRIPTION',
    },
    TR_REMEMBER_ALLOWS_YOU_TO: {
        defaultMessage:
            'Stores wallet for a watch-only mode: You will see your wallet even if device is disconnected.',
        id: 'TR_REMEMBER_ALLOWS_YOU_TO',
    },
    TR_RESELLERS_LINK: {
        defaultMessage: 'our trusted resellers',
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
    TR_PASTE_URI: {
        defaultMessage: 'Paste URI',
        id: 'TR_PASTE_URI',
    },
    TR_SECURITY_HEADING: {
        defaultMessage: 'Your wallet is almost ready',
        description: 'Heading in security page',
        id: 'TR_SECURITY_HEADING',
    },
    TR_SECURITY_SUBHEADING: {
        defaultMessage:
            "You've successfully set up your Trezor and created your wallet. You should never use your Trezor without backing it up; it is the only way to recover a lost wallet.",
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
        defaultMessage: 'Select where to enter passphrase on "{deviceLabel}" .',
        id: 'TR_SELECT_PASSPHRASE_SOURCE',
    },
    TR_SELECT_WALLET_TO_ACCESS: {
        defaultMessage: 'Select wallet type',
        id: 'TR_SELECT_WALLET_TO_ACCESS',
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
        defaultMessage: "You can't change device settings in this state",
        id: 'TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_UNAVAILABLE',
    },
    TR_SETTINGS_COINS_BANNER_DESCRIPTION_REMEMBERED_DISCONNECTED: {
        defaultMessage: 'Connect device to change Crypto Settings',
        id: 'TR_SETTINGS_COINS_BANNER_DESCRIPTION_REMEMBERED_DISCONNECTED',
    },
    TR_SETTINGS_DEVICE_BANNER_TITLE_BOOTLOADER: {
        defaultMessage: 'Other settings unavailable in bootloader mode',
        id: 'TR_SETTINGS_DEVICE_BANNER_TITLE_BOOTLOADER',
    },
    TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED: {
        defaultMessage: 'Connect device to change Device Settings',
        id: 'TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED',
    },
    TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_BOOTLOADER_MODEL_1: {
        defaultMessage:
            'Reconnect the device without holding any buttons while connecting the cable to access all other Settings.',
        id: 'TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_BOOTLOADER_MODEL_1',
    },
    TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_BOOTLOADER_MODEL_2: {
        defaultMessage:
            'Reconnect the device without touching the screen to access all other Settings.',
        id: 'TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_BOOTLOADER_MODEL_2',
    },
    TR_SHOW_ADDRESS_ANYWAY: {
        defaultMessage: 'Show address anyway',
        id: 'TR_SHOW_ADDRESS_ANYWAY',
    },
    TR_SHOW_DETAILS: {
        defaultMessage: 'Update now',
        id: 'TR_SHOW_DETAILS',
    },
    TR_SHOW_DETAILS_IN_BLOCK_EXPLORER: {
        defaultMessage: 'Show details in Block Explorer',
        id: 'TR_SHOW_DETAILS_IN_BLOCK_EXPLORER',
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
        defaultMessage: 'Begin backup',
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
    TR_SUITE_VERSION: {
        defaultMessage: 'Suite version',
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
    TR_THE_PIN_LAYOUT_IS_DISPLAYED: {
        defaultMessage: 'Check your Trezor screen for the keypad layout.',
        id: 'TR_THE_PIN_LAYOUT_IS_DISPLAYED',
    },
    TR_THIS_HIDDEN_WALLET_IS_EMPTY: {
        defaultMessage:
            'This hidden wallet is empty. To make sure you are in the correct hidden wallet, please type the passphrase again.',
        id: 'TR_THIS_HIDDEN_WALLET_IS_EMPTY',
    },
    TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE: {
        defaultMessage:
            'This hidden wallet is empty. To make sure you are in the correct hidden wallet, please type again the passphrase on Trezor.',
        id: 'TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE',
    },
    TR_TO_FIND_YOUR_ACCOUNTS_AND: {
        defaultMessage: 'Trezor is running a coin discovery check to find your accounts and funds.',
        id: 'TR_TO_FIND_YOUR_ACCOUNTS_AND',
    },
    TR_TO_PREVENT_PHISHING_ATTACKS_COMMA: {
        defaultMessage:
            'To prevent phishing attacks, you should verify the address on your Trezor. {claim}',
        id: 'TR_TO_PREVENT_PHISHING_ATTACKS_COMMA',
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
    TR_TOTAL_INPUT: {
        defaultMessage: 'Total input',
        id: 'TR_TOTAL_INPUT',
    },
    TR_TOTAL_OUTPUT: {
        defaultMessage: 'Total output',
        id: 'TR_TOTAL_OUTPUT',
    },
    TR_TRANSACTION_DETAILS: {
        defaultMessage: 'Details',
        id: 'TR_TRANSACTION_DETAILS',
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
    TR_FAILED_TRANSACTION: {
        defaultMessage: 'Failed transaction',
        id: 'TR_FAILED_TRANSACTION',
    },
    TR_UNKNOWN_ERROR_SEE_CONSOLE: {
        defaultMessage: 'Unknown error. See console logs for details.',
        id: 'TR_UNKNOWN_ERROR_SEE_CONSOLE',
    },
    TR_UNLOCK: {
        defaultMessage: 'Please confirm passphrase to continue.',
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
    TR_WALLET_DUPLICATE_DESC: {
        defaultMessage: 'The Hidden wallet you are trying to add has been already discovered.',
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
    TR_WELCOME_TO_TREZOR: {
        defaultMessage: 'Starting up or coming back?',
        id: 'TR_WELCOME_TO_TREZOR',
    },
    TR_WELCOME_TO_TREZOR_TEXT: {
        defaultMessage: 'Choose to set up your device or continue to Suite',
        id: 'TR_WELCOME_TO_TREZOR_TEXT',
    },
    TR_WELCOME_TO_TREZOR_TEXT_WALLET_CREATION: {
        defaultMessage: 'Create a new wallet or restore one from a backup.',
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
            'Factory Reset wipes the device memory, erasing all information including the Recovery Seed and PIN. Only perform a Factory Reset if you have your Recovery Seed to hand, or there are no funds stored on the device.',
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
            'Ripple addresses require a minimum balance of {minBalance} XRP to activate and maintain the account.',
        id: 'TR_XRP_RESERVE_INFO',
    },
    TR_YOU_WERE_DISCONNECTED_DOT: {
        defaultMessage: 'You were disconnected.',
        id: 'TR_YOU_WERE_DISCONNECTED_DOT',
    },
    TR_YOUR_CURRENT_FIRMWARE: {
        defaultMessage: 'Your current firmware version is {version}',
        id: 'TR_YOUR_CURRENT_FIRMWARE',
    },
    TR_YOUR_CURRENT_FIRMWARE_UNKNOWN: {
        defaultMessage:
            "It's not possible to detect the current firmware version when using the device in bootloader mode",
        id: 'TR_YOUR_CURRENT_FIRMWARE_UNKNOWN',
    },
    TR_YOUR_CURRENT_VERSION: {
        defaultMessage: 'You are currently running version {version}',
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
    TR_TO: {
        id: 'TR_TO',
        defaultMessage: 'To',
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
    TR_PIN_MISMATCH_TEXT: {
        id: 'TR_PIN_MISMATCH_TEXT',
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
    TR_ACCOUNT_TYPE_BIP84_DESC: {
        id: 'TR_ACCOUNT_TYPE_BIP84_DESC',
        defaultMessage:
            'Bech32 uses a modern address format that allows for smaller transaction fees. Be aware that it may not be compatible with old services.',
    },
    TR_ACCOUNT_TYPE_BIP86_DESC: {
        id: 'TR_ACCOUNT_TYPE_BIP86_DESC',
        defaultMessage:
            'Taproot is a new account type that can enhance privacy and network efficiency. Some services may not yet support Taproot format addresses.',
    },
    TR_ACCOUNT_TYPE_BIP49_DESC: {
        id: 'TR_ACCOUNT_TYPE_BIP49_DESC',
        defaultMessage:
            'Pay to script hash (P2SH) is an advanced type of transaction used in Bitcoin and other similar crypto currencies. Unlike P2PKH, it allows the sender to commit funds to a hash of an arbitrary valid script.',
    },
    TR_ACCOUNT_TYPE_BIP44_DESC: {
        id: 'TR_ACCOUNT_TYPE_BIP44_DESC',
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
            'Handle your account public key (xPUB) carefully. When exposed, a third party will be able to see your entire transaction history.',
    },
    TR_ACCOUNT_DETAILS_XPUB_BUTTON: {
        id: 'TR_ACCOUNT_DETAILS_XPUB_BUTTON',
        defaultMessage: 'Show public key',
    },
    TR_ACCOUNT_TYPE_BIP86_NOT_SUPPORTED: {
        id: 'TR_ACCOUNT_TYPE_BIP86_NOT_SUPPORTED',
        defaultMessage:
            'Current firmware does not support Taproot. Please update your Trezor firmware to enable this feature.',
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
    TOAST_QR_INCORRECT_ADDRESS: {
        id: 'TOAST_QR_INCORRECT_ADDRESS',
        defaultMessage: 'QR code contains invalid address for this account',
    },
    TOAST_QR_INCORRECT_COIN_SCHEME_PROTOCOL: {
        id: 'TOAST_QR_INCORRECT_COIN_SCHEME_PROTOCOL',
        defaultMessage: 'QR code is defined for {coin} account',
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
        defaultMessage: 'Get to an account to send',
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
    TOAST_DEVICE_WIPED: {
        id: 'TOAST_DEVICE_WIPED',
        defaultMessage: 'Device wiped successfully ',
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
        defaultMessage: 'New version ({version}) installed successfully.',
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
        defaultMessage: 'No notifications yet',
    },
    NOTIFICATIONS_EMPTY_DESC: {
        id: 'NOTIFICATIONS_EMPTY_DESC',
        defaultMessage: 'You will see all important notifications here, once they happen.',
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
    LABELING_ACCOUNT_WITH_TYPE: {
        id: 'LABELING_ACCOUNT_WITH_TYPE',
        defaultMessage: 'Account #{index} ({type})',
    },
    TR_LAST_UPDATE: {
        id: 'TR_LAST_UPDATE',
        defaultMessage: 'Price: Updated {value}',
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
    TR_TOR_TITLE: {
        id: 'TR_TOR_TITLE',
        defaultMessage: 'Tor',
    },
    TR_TOR_ENABLE: {
        id: 'TR_TOR_ENABLE',
        defaultMessage: 'Enable Tor',
    },
    TR_TOR_DISABLE: {
        id: 'TR_TOR_DISABLE',
        defaultMessage: 'Disable Tor',
    },
    TR_TOR_DISABLE_ONIONS_ONLY: {
        id: 'TR_TOR_DISABLE_ONIONS_ONLY',
        defaultMessage: 'Missing non-onion Custom Backends',
    },
    TR_TOR_DISABLE_ONIONS_ONLY_RESOLVED: {
        id: 'TR_TOR_DISABLE_ONIONS_ONLY_RESOLVED',
        defaultMessage: 'Disable Tor',
    },
    TR_TOR_DISABLE_ONIONS_ONLY_TITLE: {
        id: 'TR_TOR_DISABLE_ONIONS_ONLY_TITLE',
        defaultMessage:
            'Disabling Tor now will reset all Onion Backends to the default Trezor servers.',
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
            "Enabling this will route all of Suite's traffic through the Tor network.{lineBreak}All requests to Trezor infrastructure will be pointed to our Tor services, increasing your privacy and security.",
    },
    TR_TOR_REMOVE_ONION_AND_DISABLE: {
        id: 'TR_TOR_REMOVE_ONION_AND_DISABLE',
        defaultMessage: 'Disable Tor and switch to Default Backends',
    },
    TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_TITLE: {
        id: 'TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_TITLE',
        defaultMessage: 'Custom Backends are no longer using onion addresses only.',
    },
    TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_DESCRIPTION: {
        id: 'TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_DESCRIPTION',
        defaultMessage: 'You can safely disable Tor now.',
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
    TR_TOR_ENABLE_TITLE: {
        id: 'TR_TOR_ENABLE_TITLE',
        defaultMessage: 'Tor enable',
    },
    TR_ONION_LINKS_DESCRIPTION: {
        id: 'TR_ONION_LINKS_DESCRIPTION',
        defaultMessage:
            'With this setting enabled, all trezor.io links will be opened as .onion links.',
    },
    TR_TOR_BRIDGE: {
        id: 'TR_TOR_BRIDGE',
        defaultMessage: 'Bridge not working in Tor Browser?',
    },
    TR_TRANSACTIONS: {
        id: 'TR_TRANSACTIONS',
        defaultMessage: 'Transactions',
    },
    TR_TRANSACTIONS_NOT_AVAILABLE: {
        id: 'TR_TRANSACTIONS_NOT_AVAILABLE',
        defaultMessage: 'Transaction history not available',
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
    TR_OUTDATED_BRIDGE_DESKTOP: {
        id: 'TR_OUTDATED_BRIDGE_DESKTOP',
        defaultMessage:
            'The Trezor Suite application comes with Trezor Bridge bundled. If you only use the Trezor Suite application, we recommend you to uninstall Trezor Bridge in order to use the bundled one. If you are using Trezor in your browser as well, updating Trezor Bridge is recommended.',
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
        defaultMessage: 'New wallet created',
    },
    TR_WIPE_DEVICE_HEADING: {
        id: 'TR_WIPE_DEVICE_HEADING',
        defaultMessage: 'Before you wipe your device...',
    },
    TR_WIPE_DEVICE_TEXT: {
        id: 'TR_WIPE_DEVICE_TEXT',
        defaultMessage:
            'Resetting the device removes all its data. Reset your device only if you have your recovery seed or there are no funds stored on the device.',
    },
    TR_WIPE_DEVICE_CHECKBOX_1_TITLE: {
        id: 'TR_WIPE_DEVICE_CHECKBOX_1_TITLE',
        defaultMessage: 'I understand this action deletes all data on the device',
    },
    TR_WIPE_DEVICE_CHECKBOX_1_DESCRIPTION: {
        id: 'TR_WIPE_DEVICE_CHECKBOX_1_DESCRIPTION',
        defaultMessage:
            'All data associated with the pre-existing accounts will be deleted. You will need a recovery seed to recover your wallet.',
    },
    TR_WIPE_DEVICE_CHECKBOX_2_TITLE: {
        id: 'TR_WIPE_DEVICE_CHECKBOX_2_TITLE',
        defaultMessage:
            'I understand I must have a backup of my Recovery Seed in order to retain access to my funds',
    },
    TR_WIPE_DEVICE_CHECKBOX_2_DESCRIPTION: {
        id: 'TR_WIPE_DEVICE_CHECKBOX_2_DESCRIPTION',
        defaultMessage:
            'Your assets are safe and accessible only if you have created a Recovery Seed and keep a private copy on a Recovery Seed Card. Please make sure you have your Recovery Seed handy or know where you keep it.',
    },
    TR_CANCEL: {
        id: 'TR_CANCEL',
        defaultMessage: 'Cancel',
    },
    TR_FOLLOW_INSTRUCTIONS_ON_DEVICE: {
        id: 'TR_FOLLOW_INSTRUCTIONS_ON_DEVICE',
        defaultMessage: 'Check your Trezor screen',
    },
    TR_ADVANCED_RECOVERY_TEXT: {
        id: 'TR_ADVANCED_RECOVERY_TEXT',
        defaultMessage:
            'Spell each word of your recovery seed using the keypad below, according to where the letters are shown on your Trezor screen.',
    },
    TR_ADVANCED_RECOVERY_NOT_SURE: {
        id: 'TR_ADVANCED_RECOVERY_NOT_SURE',
        defaultMessage: 'Not sure how advanced method works?',
    },
    TR_CHECK_RECOVERY_SEED_DESC_T1: {
        id: 'TR_CHECK_RECOVERY_SEED_DESC_T1',
        defaultMessage:
            'Enter the words from your seed here in the order displayed on your device. You may be asked to type some words that are not part of your recovery seed as an additional security measure.',
        dynamic: true,
    },
    TR_SELECT_NUMBER_OF_WORDS: {
        id: 'TR_SELECT_NUMBER_OF_WORDS',
        defaultMessage: 'Select number of words in your seed',
    },
    TR_YOU_EITHER_HAVE_T1: {
        id: 'TR_YOU_EITHER_HAVE_T1',
        defaultMessage: 'Your seed may contain 12, 18, or 24 words.',
        dynamic: true,
    },
    TR_YOU_EITHER_HAVE_T2: {
        id: 'TR_YOU_EITHER_HAVE_T2',
        defaultMessage: 'Your seed may contain 12, 18, 20, 24, or 33 words.',
        dynamic: true,
    },
    TR_ENTER_ALL_WORDS_IN_CORRECT: {
        id: 'TR_ENTER_ALL_WORDS_IN_CORRECT',
        defaultMessage: 'Enter all words in the correct order',
    },
    TR_ON_YOUR_COMPUTER_ENTER: {
        id: 'TR_ON_YOUR_COMPUTER_ENTER',
        defaultMessage: 'Enter the words from your seed in the order displayed on your device.',
    },
    TR_CHECK_RECOVERY_SEED_DESC_T2: {
        id: 'TR_CHECK_RECOVERY_SEED_DESC_T2',
        defaultMessage:
            'Your wallet backup, the recovery seed, is entered entirely on the Trezor Model T, through the device screen. We avoid passing any of your sensitive information to a potentially insecure computer or web browser.',
        dynamic: true,
    },
    TR_USING_TOUCHSCREEN: {
        id: 'TR_USING_TOUCHSCREEN',
        defaultMessage:
            'Using the touchscreen display, enter all the words in the correct order until completed.',
    },
    TR_CHOSE_RECOVERY_TYPE: {
        id: 'TR_CHOSE_RECOVERY_TYPE',
        defaultMessage: 'Chose recovery type',
    },
    TR_ALL_THE_WORDS: {
        id: 'TR_ALL_THE_WORDS',
        defaultMessage:
            'The words are entered always on the device for security reasons. Please enter all the words in the correct order.',
    },
    TR_SEED_CHECK_SUCCESS_TITLE: {
        id: 'TR_SEED_CHECK_SUCCESS_TITLE',
        defaultMessage: 'Backup seed successfully checked!',
    },
    TR_SEED_CHECK_SUCCESS_DESC: {
        id: 'TR_SEED_CHECK_SUCCESS_DESC',
        defaultMessage:
            'Your seed is valid and has just been successfully checked. Please take great care of it and/or hide it back where you are going to find it.',
    },
    TR_SEED_CHECK_FAIL_TITLE: {
        id: 'TR_SEED_CHECK_FAIL_TITLE',
        defaultMessage: 'Recovery seed check failed',
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
        defaultMessage: 'I understand this is a simulated check and it won’t affect my device',
    },
    TR_DRY_RUN_CHECK_ITEM_DESCRIPTION: {
        id: 'TR_DRY_RUN_CHECK_ITEM_DESCRIPTION',
        defaultMessage:
            'Note that this test is precisely the same as the normal recovery process. You should only trust the information and instructions displayed on your Trezor screen.',
    },
    TR_ACCOUNT_TYPE: {
        id: 'TR_ACCOUNT_TYPE',
        defaultMessage: 'Account type',
    },
    TR_SELECT_COIN: {
        id: 'TR_SELECT_COIN',
        defaultMessage: 'Select coin',
    },
    TR_ACTIVATE_COINS: {
        id: 'TR_ACTIVATE_COINS',
        defaultMessage: 'Activate more coins',
    },
    TR_COIN_SETTINGS: {
        id: 'TR_COIN_SETTINGS',
        defaultMessage: 'Coin settings',
    },
    TR_SELECT_COIN_FOR_SETTINGS: {
        id: 'TR_SELECT_COIN_FOR_SETTINGS',
        defaultMessage: 'Select active coin to change settings',
    },
    FW_CAPABILITY_NO_CAPABILITY: {
        id: 'FW_CAPABILITY_NO_CAPABILITY',
        defaultMessage: 'Not supported',
        description: 'Firmware with missing capability (eg: LTC on Bitcoin-only FW, XRP on T1...)',
    },
    FW_CAPABILITY_SUPPORTED_IN_T2: {
        id: 'FW_CAPABILITY_SUPPORTED_IN_T2',
        defaultMessage: 'Coin is supported only on Trezor Model T',
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
    FW_CAPABILITY_CONNECT_OUTDATED: {
        id: 'FW_CAPABILITY_CONNECT_OUTDATED',
        defaultMessage: 'Application update required',
        description: 'Firmware is too NEW use this coin (trezor-connect is outdated)',
    },
    MODAL_ADD_ACCOUNT_TITLE: {
        id: 'MODAL_ADD_ACCOUNT_TITLE',
        defaultMessage: 'New account',
    },
    MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY: {
        id: 'MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY',
        defaultMessage: 'Previous account is empty',
    },
    MODAL_ADD_ACCOUNT_LIMIT_EXCEEDED: {
        id: 'MODAL_ADD_ACCOUNT_LIMIT_EXCEEDED',
        defaultMessage: 'The maximum allowed number of accounts has been created. ',
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
            'Resetting the app restores it to its default settings; this is a good first step to any troubleshooting. The app will restart itself at the end of the process.',
    },
    TR_CHOOSE_WALLET: {
        id: 'TR_CHOOSE_WALLET',
        defaultMessage: 'Wallets',
    },
    TR_TO_ACCESS_OTHER_WALLETS: {
        id: 'TR_TO_ACCESS_OTHER_WALLETS',
        defaultMessage: 'Connect your device to add other wallets',
    },
    TR_TO_ADD_NEW_ACCOUNT_PLEASE_CONNECT: {
        id: 'TR_TO_ADD_NEW_ACCOUNT_PLEASE_CONNECT',
        defaultMessage: 'Connect your device to add new account.',
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
    RECEIVE_ADDRESS_LIMIT_EXCEEDED: {
        id: 'RECEIVE_ADDRESS_LIMIT_EXCEEDED',
        defaultMessage: 'Limit exceeded...',
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
    TR_RECOVERY_SEED_IS_OFFLINE: {
        id: 'TR_RECOVERY_SEED_IS_OFFLINE',
        defaultMessage: 'Recovery seed is an offline backup of your wallet',
    },
    TR_BACKUP_NOW: {
        id: 'TR_BACKUP_NOW',
        defaultMessage: 'Back up wallet',
    },
    TR_BACKUP_SEED_CREATED_SUCCESSFULLY: {
        id: 'TR_BACKUP_SEED_CREATED_SUCCESSFULLY',
        defaultMessage: 'Backup created',
    },
    TR_CHECK_SEED_IN_SETTINGS: {
        id: 'TR_CHECK_SEED_IN_SETTINGS',
        defaultMessage: 'Check seed in Settings',
    },
    TR_PIN: {
        id: 'TR_PIN',
        defaultMessage: 'PIN',
    },
    TR_ENABLE_PIN: {
        id: 'TR_ENABLE_PIN',
        defaultMessage: 'Enable PIN',
    },
    TR_SET_STRONG_PIN_NUMBER_AGAINST: {
        id: 'TR_SET_STRONG_PIN_NUMBER_AGAINST',
        defaultMessage: 'Protects your Trezor against unauthorized access',
    },
    TR_CHANGE_PIN_IN_SETTINGS: {
        id: 'TR_CHANGE_PIN_IN_SETTINGS',
        defaultMessage: 'Change PIN in Settings',
    },
    TR_CHANGE_PIN: {
        id: 'TR_CHANGE_PIN',
        defaultMessage: 'Change PIN',
        description: 'Button that initiates pin change',
    },
    TR_DEVICE_PIN_PROTECTION_ENABLED: {
        id: 'TR_DEVICE_PIN_PROTECTION_ENABLED',
        defaultMessage: 'PIN enabled',
    },
    TR_ENABLE_PASSPHRASE_DESCRIPTION: {
        id: 'TR_ENABLE_PASSPHRASE_DESCRIPTION',
        defaultMessage: 'Allows you to create hidden wallets',
    },
    TR_ENABLE_PASSPHRASE: {
        id: 'TR_ENABLE_PASSPHRASE',
        defaultMessage: 'Enable passphrase',
    },
    TR_PASSPHRASE: {
        id: 'TR_PASSPHRASE',
        defaultMessage: 'Passphrase',
    },
    TR_PASSPHRASE_PROTECTION: {
        id: 'TR_PASSPHRASE_PROTECTION',
        defaultMessage: 'Passphrase',
    },
    TR_PASSPHRASE_PROTECTION_ENABLED: {
        id: 'TR_PASSPHRASE_PROTECTION_ENABLED',
        defaultMessage: 'Passphrase enabled',
    },
    TR_CREATE_HIDDEN_WALLET: {
        id: 'TR_CREATE_HIDDEN_WALLET',
        defaultMessage: 'Add Hidden wallet',
    },
    TR_DISCREET_MODE: {
        id: 'TR_DISCREET_MODE',
        defaultMessage: 'Discreet mode',
    },
    TR_HIDE_BUTTON: {
        id: 'TR_HIDE_BUTTON',
        defaultMessage: 'Hide',
    },
    TR_BUY_RECEIVE_ACCOUNT_QUESTION_TOOLTIP: {
        id: 'TR_BUY_RECEIVE_ACCOUNT_QUESTION_TOOLTIP',
        defaultMessage:
            "This is the account within your wallet where you'll find your coins once the transaction is finished.",
    },
    TR_BUY_RECEIVE_ADDRESS_QUESTION_TOOLTIP: {
        id: 'TR_BUY_RECEIVE_ADDRESS_QUESTION_TOOLTIP',
        defaultMessage:
            'This is the specific alphanumeric address that will receive your coins. Verify this address on your Trezor.',
    },
    TR_TRADE_SELECT_COIN: {
        id: 'TR_TRADE_SELECT_COIN',
        defaultMessage: 'Select a coin...',
    },
    TR_TRADE_BUYS: {
        id: 'TR_TRADE_BUYS',
        defaultMessage: 'buys',
    },
    TR_TRADE_SELLS: {
        id: 'TR_TRADE_SELLS',
        defaultMessage: 'sells',
    },
    TR_TRADE_EXCHANGES: {
        id: 'TR_TRADE_EXCHANGES',
        defaultMessage: 'exchanges',
    },
    TR_TRADE_SPENDS: {
        id: 'TR_TRADE_SPENDS',
        defaultMessage: 'spends',
    },
    TR_TRADE_SAVINGS: {
        id: 'TR_TRADE_SAVINGS',
        defaultMessage: 'savings',
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
    TR_PAYMENT_METHOD_BANCONTACT: {
        id: 'TR_PAYMENT_METHOD_BANCONTACT',
        defaultMessage: 'Bancontact',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_SOFORT: {
        id: 'TR_PAYMENT_METHOD_SOFORT',
        defaultMessage: 'Sofort',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_IDEAL: {
        id: 'TR_PAYMENT_METHOD_IDEAL',
        defaultMessage: 'iDEAL',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_SEPA: {
        id: 'TR_PAYMENT_METHOD_SEPA',
        defaultMessage: 'SEPA',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_GIROPAY: {
        id: 'TR_PAYMENT_METHOD_GIROPAY',
        defaultMessage: 'Giropay',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_EPS: {
        id: 'TR_PAYMENT_METHOD_EPS',
        defaultMessage: 'EPS',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_APPLEPAY: {
        id: 'TR_PAYMENT_METHOD_APPLEPAY',
        defaultMessage: 'Apple Pay',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_UNKOWN: {
        id: 'TR_PAYMENT_METHOD_UNKOWN',
        defaultMessage: 'Unknown',
    },
    TR_PAYMENT_METHOD_POLI: {
        id: 'TR_PAYMENT_METHOD_POLI',
        defaultMessage: 'POLi',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_AUSPOST: {
        id: 'TR_PAYMENT_METHOD_AUSPOST',
        defaultMessage: 'Australia Post',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_WORLDPAYCREDIT: {
        id: 'TR_PAYMENT_METHOD_WORLDPAYCREDIT',
        defaultMessage: 'Worldpay Credit',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_BPAY: {
        id: 'TR_PAYMENT_METHOD_BPAY',
        defaultMessage: 'BPAY',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_DCINTERAC: {
        id: 'TR_PAYMENT_METHOD_DCINTERAC',
        defaultMessage: 'DC Interac',
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
    TR_PAYMENT_METHOD_PAYNOW: {
        id: 'TR_PAYMENT_METHOD_PAYNOW',
        defaultMessage: 'PayNow',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_FPS: {
        id: 'TR_PAYMENT_METHOD_FPS',
        defaultMessage: 'FPS',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_PROMPTPAY: {
        id: 'TR_PAYMENT_METHOD_PROMPTPAY',
        defaultMessage: 'Prompt Pay',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_INSTAPAY: {
        id: 'TR_PAYMENT_METHOD_INSTAPAY',
        defaultMessage: 'InstaPay',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_UPI: {
        id: 'TR_PAYMENT_METHOD_UPI',
        defaultMessage: 'UPI',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_GOJEKID: {
        id: 'TR_PAYMENT_METHOD_GOJEKID',
        defaultMessage: 'GoJek',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_VIETTELPAY: {
        id: 'TR_PAYMENT_METHOD_VIETTELPAY',
        defaultMessage: 'Viettel Pay',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_DUITNOW: {
        id: 'TR_PAYMENT_METHOD_DUITNOW',
        defaultMessage: 'DuitNow',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_PAYID: {
        id: 'TR_PAYMENT_METHOD_PAYID',
        defaultMessage: 'PayID',
        dynamic: true,
    },
    TR_PAYMENT_METHOD_NZBANKTRANSFER: {
        id: 'TR_PAYMENT_METHOD_NZBANKTRANSFER',
        defaultMessage: 'NZ Bank Transfer',
        dynamic: true,
    },
    TR_OFFER_FEE_INFO: {
        id: 'TR_OFFER_FEE_INFO',
        defaultMessage:
            "The amount shown is the final amount you'll receive, with provider exchange fees included. However, your bank may charge additional currency exchange fees if your bank account is not denominated in the chosen currency.",
    },
    TR_SHOW_BUTTON: {
        id: 'TR_SHOW_BUTTON',
        defaultMessage: 'Show',
    },
    TR_TRY_TO_TEMPORARILY_HIDE: {
        id: 'TR_TRY_TO_TEMPORARILY_HIDE',
        defaultMessage: 'Temporarily hide your balances',
    },
    TR_TRY_DISCREET_MODE: {
        id: 'TR_TRY_DISCREET_MODE',
        defaultMessage: 'Try discreet mode',
    },
    TR_DISCREET_MODE_TRIED_OUT: {
        id: 'TR_DISCREET_MODE_TRIED_OUT',
        defaultMessage: 'Discreet mode explored',
    },
    TR_ENABLE_DISCREET_MODE: {
        id: 'TR_ENABLE_DISCREET_MODE',
        defaultMessage: 'Enable discreet mode',
    },
    TR_DISABLE_DISCREET_MODE: {
        id: 'TR_DISABLE_DISCREET_MODE',
        defaultMessage: 'Disable discreet mode',
    },
    TR_BACKUP_YOUR_DEVICE: {
        id: 'TR_BACKUP_YOUR_DEVICE',
        defaultMessage: 'Backup your wallet',
    },
    TR_SECURITY_FEATURES_COMPLETED_N: {
        id: 'TR_SECURITY_FEATURES_COMPLETED_N',
        defaultMessage: 'Security ({n} of {m})',
    },
    TR_TODAY: {
        id: 'TR_TODAY',
        defaultMessage: 'Today',
    },
    TR_DASHBOARD: {
        id: 'TR_DASHBOARD',
        defaultMessage: 'Dashboard',
    },
    TR_WALLET: {
        id: 'TR_WALLET',
        defaultMessage: 'Accounts',
    },
    TR_EXCHANGE: {
        id: 'TR_EXCHANGE',
        defaultMessage: 'Exchange',
    },
    TR_PASSWORDS: {
        id: 'TR_PASSWORDS',
        defaultMessage: 'Passwords',
    },
    TR_PORTFOLIO: {
        id: 'TR_PORTFOLIO',
        defaultMessage: 'Portfolio',
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
        defaultMessage: 'Reboot your Trezor into bootloader mode',
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
    TR_RECONNECT_IN_NORMAL_SUCCESS: {
        id: 'TR_RECONNECT_IN_NORMAL_SUCCESS',
        defaultMessage: 'Device is now ready',
    },
    TR_SWIPE_YOUR_FINGERS: {
        id: 'TR_SWIPE_YOUR_FINGERS',
        defaultMessage: 'Swipe your finger across the touchscreen while connecting cable.',
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
        defaultMessage: 'Security checkpoint: Do you have your seed?',
    },
    TR_BEFORE_ANY_FURTHER_ACTIONS: {
        id: 'TR_BEFORE_ANY_FURTHER_ACTIONS',
        defaultMessage:
            'Before you perform the update, please make sure you have your recovery seed.',
    },
    TR_FIRMWARE_PARTIALLY_UPDATED: {
        id: 'TR_FIRMWARE_PARTIALLY_UPDATED',
        defaultMessage: 'Firmware partially updated',
    },
    TR_DISCREET: {
        id: 'TR_DISCREET',
        defaultMessage: 'Discreet',
    },
    TR_TOR: {
        id: 'TR_TOR',
        defaultMessage: 'Tor',
    },
    TR_STANDARD_WALLET: {
        id: 'TR_STANDARD_WALLET',
        defaultMessage: 'Standard wallet',
    },
    TR_HIDDEN_WALLET: {
        id: 'TR_HIDDEN_WALLET',
        defaultMessage: 'Hidden wallet #{id}',
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
        defaultMessage:
            'Your device is in seedless mode and is not allowed to be used with this wallet.',
    },
    TR_YOUR_DEVICE_IS_CONNECTED_BUT_UNREADABLE: {
        id: 'TR_YOUR_DEVICE_IS_CONNECTED_BUT_UNREADABLE',
        defaultMessage:
            'Your device is connected properly, but your internet browser can not communicate with it at the moment. You will need to install Trezor Bridge.',
    },
    TR_DEVICE_NOT_INITIALIZED: {
        id: 'TR_DEVICE_NOT_INITIALIZED',
        defaultMessage: 'Trezor is not set up',
        description:
            'Device not initialized means that it has no cryptographic secret lives in it and it must be either recovered from seed or newly generated.',
    },
    TR_DEVICE_NOT_INITIALIZED_TEXT: {
        id: 'TR_DEVICE_NOT_INITIALIZED_TEXT',
        defaultMessage: "We'll help you through the process and get you started right away.",
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
    TR_UNREADABLE_EXPLAINED: {
        id: 'TR_UNREADABLE_EXPLAINED',
        defaultMessage:
            'We cant see details about your device. It might be Trezor with old firmware or possibly any USB device. To make communication possible, you will need to install Trezor Bridge.',
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
    TR_MAX_LABEL_LENGTH_IS: {
        id: 'TR_MAX_LABEL_LENGTH_IS',
        defaultMessage: 'Names can be up to {length} characters.',
        description: 'How many characters may be in device label.',
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
            'Make sure no one can peek over your shoulder and no cameras can see your screen. No one should ever see your backup except you.',
    },
    TR_I_UNDERSTAND_SEED_IS_IMPORTANT: {
        id: 'TR_I_UNDERSTAND_SEED_IS_IMPORTANT',
        defaultMessage: 'You are responsible for keeping your backup safe',
    },
    TR_BACKUP_SEED_IS_ULTIMATE: {
        id: 'TR_BACKUP_SEED_IS_ULTIMATE',
        defaultMessage:
            "Your recovery seed is the key to your wallet and funds. If you lose it, it's gone forever: there is no other way to restore a lost wallet.",
    },
    TR_FIRMWARE_IS_POTENTIALLY_RISKY: {
        id: 'TR_FIRMWARE_IS_POTENTIALLY_RISKY',
        defaultMessage:
            'Updating firmware is potentially risky operation. If anything goes wrong (broken cable etc.) device might end up in wiped state which effectively means losing all your coins.',
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
    TR_ONBOARDING_GENERATE_SEED: {
        id: 'TR_ONBOARDING_GENERATE_SEED',
        defaultMessage: 'Wallet backup',
        description:
            'Used for button triggering seed creation (reset device call), user chooses between single seed and shamir',
    },
    TR_ONBOARDING_GENERATE_SEED_DESCRIPTION: {
        id: 'TR_ONBOARDING_GENERATE_SEED_DESCRIPTION',
        defaultMessage:
            'Choose how to back up your Trezor. This process will also create a standard wallet for you.',
        description:
            'Used for button triggering seed creation (reset device call), user chooses between single seed and shamir',
    },
    TR_CREATE_WALLET: {
        id: 'TR_CREATE_WALLET',
        defaultMessage: 'Create new wallet',
        description:
            'Used for button triggering seed creation (reset device call) if shamir/non-shamir selection is not available.',
    },
    SINGLE_SEED: {
        id: 'SINGLE_SEED',
        defaultMessage: 'Standard seed backup',
        description: 'Basic, non-shamir backup. Seed has only one part.',
    },
    SINGLE_SEED_DESCRIPTION: {
        id: 'SINGLE_SEED_DESCRIPTION',
        defaultMessage: 'Recover your wallet using a single list of English words.',
    },
    SHAMIR_SEED: {
        id: 'SHAMIR_SEED',
        defaultMessage: 'Shamir share backup',
        description: 'Advanced, shamir backup. Seed has multiple parts.',
    },
    SHAMIR_SEED_DESCRIPTION: {
        id: 'SHAMIR_SEED_DESCRIPTION',
        defaultMessage:
            'Recover the wallet by combining lists of words together. These can be secured in different places for added security.',
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
            'A new firmware version is available. You can also update your Trezor directly from Suite once you have finished setting up your device.',
    },
    TR_FIRMWARE_NEW_FW_DESCRIPTION: {
        id: 'TR_FIRMWARE_NEW_FW_DESCRIPTION',
        defaultMessage:
            'A new firmware version is available. You might either update your device now or continue and update it later.',
    },
    TR_FIRMWARE_REINSTALL_FW_DESCRIPTION: {
        id: 'TR_FIRMWARE_REINSTALL_FW_DESCRIPTION',
        defaultMessage:
            'Your device is already updated to latest firmware. You may reinstall the firmware if needed.',
    },
    TR_EXPERIMENTAL_FEATURES: {
        id: 'TR_EXPERIMENTAL_FEATURES',
        defaultMessage: 'Experimental features',
        description: 'Section title for Early Access program so far',
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
            'Join to test the latest product features before we release them to all Trezor users.',
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
        defaultMessage: 'Join the Program',
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
        defaultMessage: 'Early Access Program enabled!',
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
        defaultMessage: 'Click "Leave" to stop looking for beta releases',
    },
    TR_EXPORT_TO_FILE: {
        id: 'TR_EXPORT_TO_FILE',
        defaultMessage: 'Export to file',
    },
    LOG_INCLUDE_BALANCE_TITLE: {
        id: 'LOG_INCLUDE_BALANCE_TITLE',
        defaultMessage: 'Include balance related',
    },
    LOG_INCLUDE_BALANCE_DESCRIPTION: {
        id: 'LOG_INCLUDE_BALANCE_DESCRIPTION',
        defaultMessage:
            "In case your issue does not relate to your balance or transactions, you may turn this off. Your account descriptors (XPubs) won't be included in the copied log.",
    },
    LOG_DESCRIPTION: {
        id: 'LOG_DESCRIPTION',
        defaultMessage:
            'In case of communication with our support team, there is a log containing all necessary technical info',
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
    TR_HOLD_BOTH_BUTTONS: {
        id: 'TR_HOLD_BOTH_BUTTONS',
        defaultMessage: 'Hold both buttons while connecting device',
    },
    TR_HOLD_LEFT_BUTTON: {
        id: 'TR_HOLD_LEFT_BUTTON',
        defaultMessage: 'Hold one or both buttons while you reconnect the USB cable.',
    },
    BACKUP_BACKUP_ALREADY_FINISHED_HEADING: {
        id: 'BACKUP_BACKUP_ALREADY_FINISHED_HEADING',
        defaultMessage: 'Backup already finished',
    },
    BACKUP_BACKUP_ALREADY_FINISHED_DESCRIPTION: {
        id: 'BACKUP_BACKUP_ALREADY_FINISHED_DESCRIPTION',
        defaultMessage:
            'Connected device has already been backed up. You should have a recovery seed written down and hidden in a safe place.',
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
    IMAGE_VALIDATION_ERROR_INVALID_FORMAT: {
        id: 'IMAGE_VALIDATION_ERROR_INVALID_FORMAT',
        defaultMessage: 'Invalid file selected. Must be .jpg or .png',
    },
    IMAGE_VALIDATION_ERROR_INVALID_HEIGHT: {
        id: 'IMAGE_VALIDATION_ERROR_INVALID_HEIGHT',
        defaultMessage: 'Invalid height.',
    },
    IMAGE_VALIDATION_ERROR_INVALID_WIDTH: {
        id: 'IMAGE_VALIDATION_ERROR_INVALID_WIDTH',
        defaultMessage: 'Invalid width.',
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
    TR_NAV_EXCHANGE: {
        id: 'TR_NAV_EXCHANGE',
        defaultMessage: 'Exchange',
    },
    TR_NAV_SPEND: {
        id: 'TR_NAV_SPEND',
        defaultMessage: 'Spend',
    },
    TR_NAV_SELL: {
        id: 'TR_NAV_SELL',
        defaultMessage: 'Sell',
    },
    TR_NAV_SAVINGS: {
        id: 'TR_NAV_SAVINGS',
        defaultMessage: 'Save {cryptoCurrencyName}',
    },
    TR_NAV_INVITY: {
        id: 'TR_NAV_INVITY',
        defaultMessage: 'Invity',
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
    TR_TOKENS: {
        id: 'TR_TOKENS',
        defaultMessage: 'Tokens',
    },
    TR_TOKENS_COUNT: {
        id: 'TR_TOKENS_COUNT',
        defaultMessage: '{count} {count, plural, one {token} other {tokens}}',
    },
    TR_TOKENS_ADD: {
        id: 'TR_TOKENS_ADD',
        defaultMessage: 'Add token',
    },
    TR_TOKENS_EMPTY: {
        id: 'TR_TOKENS_EMPTY',
        defaultMessage: 'No tokens... yet.',
    },
    TR_ADD_TOKEN_TITLE: {
        id: 'TR_ADD_TOKEN_TITLE',
        defaultMessage: 'Add ERC20 token',
    },
    TR_ADD_TOKEN_LABEL: {
        id: 'TR_ADD_TOKEN_LABEL',
        defaultMessage: 'ERC20 token address',
    },
    TR_ADD_TOKEN_SUBMIT: {
        id: 'TR_ADD_TOKEN_SUBMIT',
        defaultMessage: 'Add token',
    },
    TR_ADD_TOKEN_PLACEHOLDER: {
        id: 'TR_ADD_TOKEN_PLACEHOLDER',
        defaultMessage: 'Paste token address',
    },
    TR_ADD_TOKEN_TOOLTIP: {
        id: 'TR_ADD_TOKEN_TOOLTIP',
        defaultMessage: 'Enter an ERC20 token contract address',
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
    RECIPIENT_FORMAT_DEPRECATED: {
        defaultMessage: 'Unsupported address format. {TR_LEARN_MORE}',
        id: 'RECIPIENT_FORMAT_DEPRECATED',
    },
    RECIPIENT_FORMAT_UPPERCASE: {
        defaultMessage: 'Unsupported address format. <a>Convert to lowercase</a>',
        id: 'RECIPIENT_FORMAT_UPPERCASE',
    },
    RECIPIENT_FORMAT_CHECKSUM: {
        defaultMessage: 'Address is not valid. <a>Convert to checksum address</a>',
        id: 'RECIPIENT_FORMAT_CHECKSUM',
    },
    RECIPIENT_CANNOT_SEND_TO_MYSELF: {
        defaultMessage: 'Cannot send to myself',
        id: 'RECIPIENT_CANNOT_SEND_TO_MYSELF',
    },
    AMOUNT: {
        defaultMessage: 'Amount',
        id: 'AMOUNT',
    },
    AMOUNT_SEND_MAX: {
        id: 'AMOUNT_SEND_MAX',
        defaultMessage: 'Send Max',
    },
    AMOUNT_IS_NOT_ENOUGH: {
        defaultMessage: 'Not enough funds',
        id: 'AMOUNT_IS_NOT_ENOUGH',
    },
    AMOUNT_IS_NOT_IN_RANGE_DECIMALS: {
        defaultMessage: 'Maximum {decimals} decimals allowed',
        id: 'AMOUNT_IS_NOT_IN_RANGE_DECIMALS',
    },
    AMOUNT_IS_NOT_INTEGER: {
        defaultMessage: 'Amount is not an integer',
        id: 'AMOUNT_IS_NOT_INTEGER',
    },
    AMOUNT_IS_NOT_NUMBER: {
        defaultMessage: 'Enter a number (e.g. 1.5)',
        id: 'AMOUNT_IS_NOT_NUMBER',
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
        defaultMessage: 'Amount is below the dust limit ({dust})',
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
    RBF_TOOLTIP: {
        id: 'RBF_TOOLTIP',
        defaultMessage:
            'Node policy that allows an unconfirmed transaction in a mempool to be replaced with a different transaction that spends at least all of the same inputs and which pays a higher transaction fee.',
    },
    RBF_ON: {
        id: 'RBF_ON',
        defaultMessage: 'RBF = ON',
    },
    RBF_OFF: {
        id: 'RBF_OFF',
        defaultMessage: 'RBF = OFF',
    },
    RBF_DESCRIPTION: {
        id: 'RBF_DESCRIPTION',
        defaultMessage:
            'RBF lets you bump a fee later, in case you want the transaction to be mined faster.',
    },
    LOCKTIME: {
        id: 'LOCKTIME',
        defaultMessage: 'Locktime',
    },
    LOCKTIME_ADD: {
        id: 'LOCKTIME_ADD',
        defaultMessage: 'Add Locktime',
    },
    LOCKTIME_ADD_TOOLTIP: {
        id: 'LOCKTIME_ADD_TOOLTIP',
        defaultMessage: 'Locktime sets the earliest time a transaction can be mined in to a block.',
    },
    LOCKTIME_SCHEDULE_SEND: {
        id: 'LOCKTIME_SCHEDULE_SEND',
        defaultMessage: 'Locktime',
    },
    LOCKTIME_IS_NOT_SET: {
        id: 'LOCKTIME_IS_NOT_SET',
        defaultMessage: 'Locktime not set',
    },
    LOCKTIME_IS_NOT_NUMBER: {
        id: 'LOCKTIME_IS_NOT_NUMBER',
        defaultMessage: 'Locktime is not a number',
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
            'Destination tag is a unique identification code to identify the receiver of a transaction.',
    },
    DESTINATION_TAG_EXPLAINED: {
        defaultMessage:
            'Destination tag is an arbitrary number which serves as a unique identifier of your transaction. Some services may require this to process your transaction.',
        id: 'DESTINATION_TAG_EXPLAINED',
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
    DATA_ETH_TOOLTIP: {
        id: 'DATA_ETH_TOOLTIP',
        defaultMessage: 'Data is usually used when you send transactions to contracts.',
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
        defaultMessage: 'Review & Send',
    },
    SEND_RAW: {
        id: 'SEND_RAW',
        description: 'item in dropdown menu',
        defaultMessage: 'Send RAW',
    },
    SEND_RAW_TRANSACTION: {
        id: 'SEND_RAW_TRANSACTION',
        description: 'Send raw form header',
        defaultMessage: 'Send raw transaction',
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
    FEE_LEVEL_ECONOMY: {
        defaultMessage: 'Economy',
        id: 'FEE_LEVEL_ECONOMY',
    },
    FEE_LEVEL_LOW: {
        defaultMessage: 'Low',
        id: 'FEE_LEVEL_LOW',
    },
    CUSTOM_FEE_IS_NOT_SET: {
        defaultMessage: 'Enter your desired fee',
        id: 'CUSTOM_FEE_IS_NOT_SET',
    },
    CUSTOM_FEE_IS_NOT_NUMBER: {
        defaultMessage: 'Enter a number',
        id: 'CUSTOM_FEE_IS_NOT_NUMBER',
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
        defaultMessage: 'Gas limit too low {button}',
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
    IMPORT_CSV: {
        id: 'IMPORT_CSV',
        description: 'item in dropdown menu',
        defaultMessage: 'Import',
    },
    TR_CONNECTED_TO_PROVIDER: {
        defaultMessage: 'Connected to {provider} as {user}',
        id: 'TR_CONNECTED_TO_PROVIDER',
    },
    TR_CONNECTED_TO_PROVIDER_LOCALLY: {
        defaultMessage: 'Saving labels locally',
        id: 'TR_CONNECTED_TO_PROVIDER_LOCALLY',
    },
    TR_YOUR_LABELING_IS_SYNCED: {
        defaultMessage:
            'Your labeling is synced with cloud storage provider. Your data are safe, only your Trezor can decrypt them.',
        id: 'TR_YOUR_LABELING_IS_SYNCED',
    },
    TR_YOUR_LABELING_IS_SYNCED_LOCALLY: {
        defaultMessage: 'Labels are saved locally on your machine.',
        id: 'TR_YOUR_LABELING_IS_SYNCED_LOCALLY',
    },
    TR_LABELING_NOT_SYNCED: {
        defaultMessage: 'Labeling not synced.',
        id: 'TR_LABELING_NOT_SYNCED',
    },
    TR_TO_MAKE_YOUR_LABELS_PERSISTENT: {
        defaultMessage:
            'To make your labels persistent and available on different devices connect to cloud storage provider.',
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
    METADATA_MODAL_HEADING: {
        defaultMessage: 'Save labels',
        id: 'METADATA_MODAL_HEADING',
    },
    METADATA_MODAL_DESCRIPTION: {
        defaultMessage:
            'Please select a cloud provider to save your labels to. Your data is encrypted by Trezor.',
        id: 'METADATA_MODAL_DESCRIPTION',
    },
    TR_DISABLED_SWITCH_TOOLTIP: {
        id: 'TR_DISABLED_SWITCH_TOOLTIP',
        defaultMessage: 'Connect & Unlock device to edit',
    },
    TR_LABELING_FEATURE_ALLOWS: {
        id: 'TR_LABELING_FEATURE_ALLOWS',
        defaultMessage:
            'Labeling allows you to rename your wallets, accounts, and addresses. Labels are applied by syncing with Dropbox or Google Drive.',
    },
    TR_LABELING_ENABLED: {
        id: 'TR_LABELING_ENABLED',
        defaultMessage: 'Labeling',
    },
    SETTINGS_ADV_COIN_BLOCKBOOK_DESCRIPTION: {
        id: 'SETTINGS_ADV_COIN_BLOCKBOOK_DESCRIPTION',
        defaultMessage:
            'Trezor Suite uses Blockbook for the wallet backend. You can also use your own custom blockbook.',
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
    TR_CUSTOM_FIRMWARE_BUTTON_DOWNLOAD: {
        id: 'TR_CUSTOM_FIRMWARE_BUTTON_DOWNLOAD',
        defaultMessage: 'Download on github.com',
    },
    TR_CUSTOM_FIRMWARE_BUTTON_INSTALL: {
        id: 'TR_CUSTOM_FIRMWARE_BUTTON_INSTALL',
        defaultMessage: 'Install firmware',
    },
    TR_CUSTOM_FIRMWARE_TITLE_DOWNLOAD: {
        id: 'TR_CUSTOM_FIRMWARE_TITLE_DOWNLOAD',
        defaultMessage: 'Select compatible firmware',
    },
    TR_CUSTOM_FIRMWARE_TITLE_INSTALL: {
        id: 'TR_CUSTOM_FIRMWARE_TITLE_INSTALL',
        defaultMessage: 'Install firmware',
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
            'XRP and ERC20 token transactions are included in the balance, but not currently supported in the graph view',
    },
    METADATA_PROVIDER_NOT_FOUND_ERROR: {
        id: 'METADATA_PROVIDER_NOT_FOUND_ERROR',
        defaultMessage: 'Failed to find metadata in cloud provider.',
    },
    METADATA_PROVIDER_AUTH_ERROR: {
        id: 'METADATA_PROVIDER_AUTH_ERROR',
        defaultMessage:
            'Failed to sync labeling data with cloud provider {provider}. User was logged out.',
    },
    METADATA_PROVIDER_UNEXPECTED_ERROR: {
        id: 'METADATA_PROVIDER_UNEXPECTED_ERROR',
        defaultMessage:
            'Failed to sync labeling data with cloud provider {provider}. User was logged out.',
    },
    TR_TRY_VERIFYING_ON_DEVICE_AGAIN: {
        id: 'TR_TRY_VERIFYING_ON_DEVICE_AGAIN',
        defaultMessage: 'Try again',
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
            'The backup process has failed. It is highly recommended to back up your wallet. Please follow the link to learn how to successfully create recovery seed to back up your wallet.',
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
        defaultMessage: 'Suite version',
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
    FIRMWARE_CONNECT_IN_NORMAL_MODEL_1: {
        id: 'FIRMWARE_CONNECT_IN_NORMAL_MODEL_1',
        defaultMessage: 'Do not hold any buttons while connecting the cable.',
    },
    FIRMWARE_CONNECT_IN_NORMAL_MODEL_2: {
        id: 'FIRMWARE_CONNECT_IN_NORMAL_MODEL_2',
        defaultMessage:
            "Please make sure you're not touching the display while connecting the device.",
    },
    TR_TAKES_N_MINUTES: {
        id: 'TR_TAKES_N_MINUTES',
        defaultMessage: 'Takes ~{n} mins',
    },
    TR_INPUTS_OUTPUTS: {
        id: 'TR_INPUTS_OUTPUTS',
        defaultMessage: 'Inputs, Outputs',
    },
    TR_CHAINED_TXS: {
        id: 'TR_CHAINED_TXS',
        defaultMessage: 'Chained transactions',
    },
    TR_AFFECTED_TXS: {
        id: 'TR_AFFECTED_TXS',
        defaultMessage: 'This operation will remove the following transactions from the mempool',
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
    TR_SHOW_FIAT: {
        id: 'TR_SHOW_FIAT',
        defaultMessage: 'Show FIAT',
    },
    TR_TODAY_DATE: {
        id: 'TR_TODAY_DATE',
        defaultMessage: 'Today, {date}',
    },
    TR_SHOW: {
        id: 'TR_SHOW',
        defaultMessage: 'Show',
    },
    TR_UPDATE_MODAL_AVAILABLE_HEADING: {
        id: 'TR_UPDATE_MODAL_AVAILABLE_HEADING',
        defaultMessage: 'Update available',
    },
    TR_UPDATE_MODAL_NOT_NOW: {
        id: 'TR_UPDATE_MODAL_NOT_NOW',
        defaultMessage: 'Not now',
    },
    TR_UPDATE_MODAL_START_DOWNLOAD: {
        id: 'TR_UPDATE_MODAL_START_DOWNLOAD',
        defaultMessage: 'Start update',
    },
    TR_UPDATE_MODAL_INSTALL_NOW_OR_LATER: {
        id: 'TR_UPDATE_MODAL_INSTALL_NOW_OR_LATER',
        defaultMessage: 'Would you like to install the update now?',
    },
    TR_UPDATE_MODAL_INSTALL_AND_RESTART: {
        id: 'TR_UPDATE_MODAL_INSTALL_AND_RESTART',
        defaultMessage: 'Restart & Update',
    },
    TR_UPDATE_MODAL_INSTALL_LATER: {
        id: 'TR_UPDATE_MODAL_INSTALL_LATER',
        defaultMessage: 'Update on next launch',
    },
    TR_MANAGE: {
        id: 'TR_MANAGE',
        defaultMessage: 'manage',
    },
    TR_VERSION_HAS_BEEN_RELEASED: {
        id: 'TR_VERSION_HAS_BEEN_RELEASED',
        defaultMessage: 'Version {version} has been released!',
    },
    TR_CHANGELOG_ON_GITHUB: {
        id: 'TR_CHANGELOG_ON_GITHUB',
        defaultMessage: 'Changelog on GitHub',
    },
    TR_UPDATE_MODAL_DOWNLOADING_UPDATE: {
        id: 'TR_UPDATE_MODAL_DOWNLOADING_UPDATE',
        defaultMessage: 'Downloading update',
    },
    TR_UPDATE_MODAL_UPDATE_DOWNLOADED: {
        id: 'TR_UPDATE_MODAL_UPDATE_DOWNLOADED',
        defaultMessage: 'Update downloaded',
    },
    TR_UPDATE_MODAL_RESTART_NEEDED: {
        id: 'TR_UPDATE_MODAL_RESTART_NEEDED',
        defaultMessage: 'This requires restarting Suite.',
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
        defaultMessage: 'Check your backup in Device Settings before sending money to the wallet.',
    },
    TR_BACKUP_CHECKBOX_1_DESCRIPTION: {
        id: 'TR_BACKUP_CHECKBOX_1_DESCRIPTION',
        defaultMessage:
            "Make sure you recorded each word in the exact order it was given to you. Make sure your seed won't get wet or smudged.",
    },
    TR_BACKUP_CHECKBOX_2_TITLE: {
        id: 'TR_BACKUP_CHECKBOX_2_TITLE',
        defaultMessage: 'Never take a photo or make a digital copy of the backup.',
    },
    TR_BACKUP_CHECKBOX_2_DESCRIPTION: {
        id: 'TR_BACKUP_CHECKBOX_2_DESCRIPTION',
        defaultMessage:
            "Don't save your seed in your phone or on any device that could be hacked, including a cloud service.",
    },
    TR_BACKUP_CHECKBOX_3_TITLE: {
        id: 'TR_BACKUP_CHECKBOX_3_TITLE',
        defaultMessage: 'Keep your backup secured and never share it with anyone.',
    },
    TR_BACKUP_CHECKBOX_3_DESCRIPTION: {
        id: 'TR_BACKUP_CHECKBOX_3_DESCRIPTION',
        defaultMessage:
            'Hide it well and use proper safeguards to ensure that you are the only person who ever sees your seed.',
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
        defaultMessage: 'Recovery completed',
    },
    TR_RECOVERY_FAILED: {
        id: 'TR_RECOVERY_FAILED',
        defaultMessage: 'Recovery failed',
    },
    TR_ONBOARDING: {
        id: 'TR_ONBOARDING',
        defaultMessage: 'Trezor setup',
    },
    TR_ACCOUNT_SEARCH_NO_RESULTS: {
        id: 'TR_ACCOUNT_SEARCH_NO_RESULTS',
        defaultMessage: 'No results',
    },
    TR_SUITE_WEB_LANDING_HEADLINE: {
        id: 'TR_SUITE_WEB_LANDING_HEADLINE',
        defaultMessage: 'Managing crypto just got{lineBreak}<em>safer and easier</em>',
    },
    TR_SUITE_WEB_LANDING_HEADLINE_FROM_MYTREZOR: {
        id: 'TR_SUITE_WEB_LANDING_HEADLINE_FROM_MYTREZOR',
        defaultMessage: 'Start using <em>Trezor Suite</em>',
    },
    TR_SUITE_WEB_LANDING_BANNER_HEADLINE_FROM_MYTREZOR: {
        id: 'TR_SUITE_WEB_LANDING_BANNER_HEADLINE_FROM_MYTREZOR',
        defaultMessage: 'Looking for Trezor Wallet?',
    },
    TR_SUITE_WEB_LANDING_BANNER_DESC_FROM_MYTREZOR: {
        id: 'TR_SUITE_WEB_LANDING_BANNER_DESC_FROM_MYTREZOR',
        defaultMessage:
            'Trezor Suite is a new interface that makes using your Trezor more private and secure.',
    },
    TR_SUITE_WEB_LANDING_BANNER_CTA_FROM_MYTREZOR: {
        id: 'TR_SUITE_WEB_LANDING_BANNER_CTA_FROM_MYTREZOR',
        defaultMessage: 'Read more',
    },
    TR_SUITE_WEB_LANDING_BANNER_CTA_FROM_MYTREZOR_WRAPUP: {
        id: 'TR_SUITE_WEB_LANDING_BANNER_CTA_FROM_MYTREZOR_WRAPUP',
        defaultMessage: 'Wrap up',
    },
    TR_SUITE_WEB_LANDING_SUB_HEADLINE: {
        id: 'TR_SUITE_WEB_LANDING_SUB_HEADLINE',
        defaultMessage: 'Take control of your Trezor with our desktop & browser app.',
    },
    TR_SUITE_WEB_LANDING_SUB_HEADLINE_FROM_MYTREZOR: {
        id: 'TR_SUITE_WEB_LANDING_SUB_HEADLINE_FROM_MYTREZOR',
        defaultMessage: 'A safer, more private experience for desktop & browser.',
    },
    TR_SUITE_WEB_LANDING_SUB_SOON: {
        id: 'TR_SUITE_WEB_LANDING_SUB_SOON',
        defaultMessage: 'Soon',
    },
    TR_SUITE_WEB_LANDING_BOTTOM_HEADLINE: {
        id: 'TR_SUITE_WEB_LANDING_BOTTOM_HEADLINE',
        defaultMessage: 'Dozens of features to discover.{lineBreak}Try Suite now.',
    },
    TR_SUITE_WEB_LANDING_FEATURES_1_HEADLINE: {
        id: 'TR_SUITE_WEB_LANDING_FEATURES_1_HEADLINE',
        defaultMessage: 'Desktop app',
    },
    TR_SUITE_WEB_LANDING_FEATURES_1_TEXT: {
        id: 'TR_SUITE_WEB_LANDING_FEATURES_1_TEXT',
        defaultMessage:
            'Enhanced security and privacy, new design and improved performance, all in one software suite.',
    },
    TR_SUITE_WEB_LANDING_FEATURES_2_HEADLINE: {
        id: 'TR_SUITE_WEB_LANDING_FEATURES_2_HEADLINE',
        defaultMessage: 'Buy, exchange, spend',
    },
    TR_SUITE_WEB_LANDING_FEATURES_2_TEXT: {
        id: 'TR_SUITE_WEB_LANDING_FEATURES_2_TEXT',
        defaultMessage:
            "Compare competitive rates, buy, exchange and spend coins in Trezor's secure environment. Powered by Invity.",
    },
    TR_SUITE_WEB_LANDING_FEATURES_3_HEADLINE: {
        id: 'TR_SUITE_WEB_LANDING_FEATURES_3_HEADLINE',
        defaultMessage: 'Native altcoin support',
    },
    TR_SUITE_WEB_LANDING_FEATURES_3_TEXT: {
        id: 'TR_SUITE_WEB_LANDING_FEATURES_3_TEXT',
        defaultMessage: 'ETH, XRP, ETC and more now supported \ndirectly through the app.',
    },
    TR_SUITE_WEB_LANDING_SUITE_ON_WEB: {
        id: 'TR_SUITE_WEB_LANDING_SUITE_ON_WEB',
        defaultMessage: 'Trezor Suite for web',
    },
    TR_SUITE_WEB_LANDING_FOOTER_BLOG: {
        id: 'TR_SUITE_WEB_LANDING_FOOTER_BLOG',
        defaultMessage: 'Trezor Blog',
    },
    TR_SUITE_WEB_LANDING_FOOTER_HEADLINE_2: {
        id: 'TR_SUITE_WEB_LANDING_FOOTER_HEADLINE_2',
        defaultMessage: 'Follow',
    },
    TR_SUITE_WEB_LANDING_FOOTER_HEADLINE_PARAGRAPH: {
        id: 'TR_SUITE_WEB_LANDING_FOOTER_HEADLINE_PARAGRAPH',
        defaultMessage: 'Companion to the <a>Trezor hardware wallet</a>',
    },
    TR_SUITE_WEB_LANDING_FOOTER_ROADMAP: {
        id: 'TR_SUITE_WEB_LANDING_FOOTER_ROADMAP',
        defaultMessage: 'Roadmap',
    },
    TR_SUITE_WEB_LANDING_DOWNLOAD_DESKTOP: {
        id: 'TR_SUITE_WEB_LANDING_DOWNLOAD_DESKTOP',
        defaultMessage: 'Get desktop app',
    },
    TR_SUITE_WEB_LANDING_VERSION: {
        id: 'TR_SUITE_WEB_LANDING_VERSION',
        defaultMessage: 'Version: {version}',
    },
    TR_SUITE_WEB_LANDING_LINUX_LABEL: {
        id: 'TR_SUITE_WEB_LANDING_LINUX_LABEL',
        defaultMessage: 'Linux (x86_64)',
    },
    TR_SUITE_WEB_LANDING_LINUX_ARM64_LABEL: {
        id: 'TR_SUITE_WEB_LANDING_LINUX_ARM64_LABEL',
        defaultMessage: 'Linux (arm64)',
    },
    TR_SUITE_WEB_LANDING_WINDOWS_LABEL: {
        id: 'TR_SUITE_WEB_LANDING_WINDOWS_LABEL',
        defaultMessage: 'Windows 10',
    },
    TR_SUITE_WEB_LANDING_MACOS_ARM64_LABEL: {
        id: 'TR_SUITE_WEB_LANDING_MACOS_ARM64_LABEL',
        defaultMessage: 'macOS (Apple Silicon)',
    },
    TR_SUITE_WEB_LANDING_MACOS_LABEL: {
        id: 'TR_SUITE_WEB_LANDING_MACOS_LABEL',
        defaultMessage: 'macOS (Intel)',
    },
    TR_SUITE_WEB_LANDING_SIGNING_KEY: {
        id: 'TR_SUITE_WEB_LANDING_SIGNING_KEY',
        defaultMessage: 'Signing key',
    },
    TR_SUITE_WEB_LANDING_SIGNATURE: {
        id: 'TR_SUITE_WEB_LANDING_SIGNATURE',
        defaultMessage: 'Signature',
    },
    TR_SUITE_WEB_LANDING_HOW_TO_VERIFY: {
        id: 'TR_SUITE_WEB_LANDING_HOW_TO_VERIFY',
        defaultMessage: 'How to verify and run on Linux',
    },
    TR_SUITE_WEB_LANDING_START_FEATURES_1_HEADLINE: {
        id: 'TR_SUITE_WEB_LANDING_START_FEATURES_1_HEADLINE',
        defaultMessage: 'Desktop app',
    },
    TR_SUITE_WEB_LANDING_START_FEATURES_1_TEXT: {
        id: 'TR_SUITE_WEB_LANDING_START_FEATURES_1_TEXT',
        defaultMessage:
            'Enhanced security and privacy, new design and improved performance, all in one software suite.',
    },
    TR_SUITE_WEB_LANDING_START_FEATURES_2_HEADLINE: {
        id: 'TR_SUITE_WEB_LANDING_START_FEATURES_2_HEADLINE',
        defaultMessage: 'Buy, exchange, spend',
    },
    TR_SUITE_WEB_LANDING_START_FEATURES_2_TEXT: {
        id: 'TR_SUITE_WEB_LANDING_START_FEATURES_2_TEXT',
        defaultMessage:
            "Compare competitive rates, buy, exchange and spend coins in Trezor's secure environment. Powered by Invity.",
    },
    TR_SUITE_WEB_LANDING_START_FEATURES_3_HEADLINE: {
        id: 'TR_SUITE_WEB_LANDING_START_FEATURES_3_HEADLINE',
        defaultMessage: 'Native altcoin support',
    },
    TR_SUITE_WEB_LANDING_START_FEATURES_3_TEXT: {
        id: 'TR_SUITE_WEB_LANDING_START_FEATURES_3_TEXT',
        defaultMessage: 'ETH, XRP, ETC and more now supported \ndirectly through the app.',
    },
    TR_SUITE_WEB_LANDING_START_HEADLINE: {
        id: 'TR_SUITE_WEB_LANDING_START_HEADLINE',
        defaultMessage: 'Congratulations on getting{lineBreak}<em>your new Trezor</em>',
    },
    TR_SUITE_WEB_LANDING_START_SUB_HEADLINE: {
        id: 'TR_SUITE_WEB_LANDING_START_SUB_HEADLINE',
        defaultMessage: 'Setup & take control of your Trezor with our desktop and browser app. ',
    },
    TR_SUITE_WEB_LANDING_START_SUB_SOON: {
        id: 'TR_SUITE_WEB_LANDING_START_SUB_SOON',
        defaultMessage: 'Soon',
    },
    TR_SUITE_WEB_LANDING_START_BOTTOM_HEADLINE: {
        id: 'TR_SUITE_WEB_LANDING_START_BOTTOM_HEADLINE',
        defaultMessage: 'Dozens of features to discover.{lineBreak}Try Suite now.',
    },
    TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_HEADLINE_0: {
        id: 'TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_HEADLINE_0',
        defaultMessage: 'Trezor Wallet is no longer supported',
    },
    TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_0: {
        id: 'TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_0',
        defaultMessage:
            '<strong>Start using Trezor Suite today to enjoy new features, more privacy, and regular updates.</strong>',
    },
    TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_1: {
        id: 'TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_1',
        defaultMessage:
            "Trezor Suite is a brand new interface for desktop and web that lets you do more with your hardware wallet. <strong>The old Trezor Wallet web interface will not be supported from January 31st 2022</strong>, so now's the time to get familiar with Trezor Suite.",
    },
    TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_2: {
        id: 'TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_2',
        defaultMessage:
            'For all the new features, download the desktop app. Trezor Suite can be accessed in your <strong>web browser</strong> by clicking the link at the top-right of this page.',
    },
    TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_3: {
        id: 'TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_3',
        defaultMessage:
            "This change won't affect your coins or keys. You will find all the same features (and more!), so you can just install the desktop app and continue from where you left off.",
    },
    TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_HEADLINE_1: {
        id: 'TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_HEADLINE_1',
        defaultMessage: "What's new in Trezor Suite?",
    },
    TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_4: {
        id: 'TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_4',
        defaultMessage:
            "<ul><li>Privacy at the flick of a switch with Tor.</li> <li>A new, more intuitive interface</li> <li>Cheaper transactions with RBF</li> <li>Enough power for exciting upcoming features!</li></ul> Trezor Suite also has all the features you're used to from the old Trezor Wallet so you can hit the ground running!",
    },
    TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_HEADLINE_2: {
        id: 'TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_HEADLINE_2',
        defaultMessage: 'How to get started',
    },
    TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_5: {
        id: 'TR_SUITE_WEB_LANDING_DEPRECATION_BANNER_PARAGRAPH_5',
        defaultMessage:
            '<StyledCollapsibleBoxLink>Download and run Trezor Suite for desktop</StyledCollapsibleBoxLink>, plug in your hardware wallet and get set up in seconds!{lineBreak}Alternatively, use the web app to access standard functions (just like in Trezor Wallet). Advanced features are only available using the desktop app.',
    },
    TR_COLOR_SCHEME: {
        id: 'TR_COLOR_SCHEME',
        defaultMessage: 'Color scheme',
    },
    TR_COLOR_SCHEME_DESCRIPTION: {
        id: 'TR_COLOR_SCHEME_DESCRIPTION',
        defaultMessage:
            'You can choose whether the application uses dark-colored elements on a light background or light-colored elements on a dark background.',
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
    TR_FINALIZE_TX: {
        id: 'TR_FINALIZE_TX',
        defaultMessage: 'Finalize transaction',
    },
    TR_CURRENT_FEE: {
        id: 'TR_CURRENT_FEE',
        defaultMessage: 'Current',
    },
    TR_SENT_SUCCESSFULLY: {
        id: 'TR_SENT_SUCCESSFULLY',
        defaultMessage: 'Sent successfully',
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
            'Tip: You can search for transaction IDs, addresses, labels, amounts and dates.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_2: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_2',
        defaultMessage:
            'Tip: You can use the greater than (>) and lesser than (<) symbols on amount searches. For example <strong>> 1</strong> will show all transactions that have an amount of 1 or higher.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_3: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_3',
        defaultMessage:
            'Tip: You can search for exact amounts using the equal (=) symbol. For example <strong>= 0.01</strong> will show only transactions that have an amount of exactly 0.01.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_4: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_4',
        defaultMessage:
            'Tip: You can exclude an amount by using the exclamation mark and equal symbols together (!=). For example <strong>= -0.01</strong> will show all transactions except the ones with an amount of -0.01.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_5: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_5',
        defaultMessage:
            'Tip: Dates can be searched using the <strong>YYYY-MM-DD</strong> format. For example <strong>2020-12-14</strong> will show all transactions on December 14th, 2020.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_6: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_6',
        defaultMessage:
            'Tip: You can use greater than (>) and lesser than (<) symbols on date searches. For example <strong>> 2020-12-01<strong> will show all transactions on and after December 1st, 2020.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_7: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_7',
        defaultMessage:
            'Tip: You can exclude a date by using the exlamation mark and equal symbols together (!=). For example <strong>!= 2020-12-14</strong> will show all transactions except the ones on December 14th, 2020.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_8: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_8',
        defaultMessage:
            'Tip: You can display results matching at least one of multiple searches by grouping them with the OR operator (|). For example <strong>2020-12-31 | 2021-01-01</strong> will show all transactions that have happened on the 31st of December 2020 or 1st of January 2021.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_9: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_9',
        defaultMessage:
            'Tip: You can display results matching multiple searches by grouping them with the AND operator (&). For example <strong>> 2020-12-01 & < 2020-12-31 & > 0</strong> will show all incoming (amount higher than 0) transactions in December 2020.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_10: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_10',
        defaultMessage:
            'Tip: You can combine AND (&) and OR (|) operators for more complex searches. For example <strong>> 2020-01-01 & < 2020-01-31 | > 2020-12-01 & < 2020-12-31</strong> will show all all transactions in January 2020 or December 2020.',
    },
    TR_PAGINATION_NEWER: {
        id: 'TR_PAGINATION_NEWER',
        defaultMessage: 'Newer',
    },
    TR_PAGINATION_OLDER: {
        id: 'TR_PAGINATION_OLDER',
        defaultMessage: 'Older',
    },
    TR_RBF_STATUS: {
        id: 'TR_RBF_STATUS',
        defaultMessage: 'Status',
    },
    TR_RBF_STATUS_FINAL: {
        id: 'TR_RBF_STATUS_FINAL',
        defaultMessage: 'Final',
    },
    TR_RBF_STATUS_NOT_FINAL: {
        id: 'TR_RBF_STATUS_NOT_FINAL',
        defaultMessage: 'Not Final',
    },
    TR_TXID: {
        id: 'TR_TXID',
        defaultMessage: 'TX ID',
    },
    TR_FINALIZE_TS_RBF_OFF_WARN: {
        id: 'TR_FINALIZE_TS_RBF_OFF_WARN',
        defaultMessage: 'Finalizing transaction will turn RBF <strong>OFF</strong>',
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
        defaultMessage: 'Hide Graph',
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
            'New desktop & browser app for Trezor hardware wallets. Trezor Suite brings big improvements across our three key pillars of usability, security and privacy.',
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
    TR_WAIT_FOR_REBOOT_WEBUSB_DESCRIPTION: {
        id: 'TR_WAIT_FOR_REBOOT_WEBUSB_DESCRIPTION',
        defaultMessage: 'Please wait for Trezor to reboot and pair the device again.',
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
        defaultMessage: 'Something is off?',
    },
    TR_GUIDE_SUGGESTION_LABEL: {
        id: 'TR_GUIDE_SUGGESTION_LABEL',
        defaultMessage: 'How are we doing?',
    },
    TR_GUIDE_SUPPORT: {
        id: 'TR_GUIDE_SUPPORT',
        defaultMessage: 'Contact support',
    },
    TR_GUIDE_FORUM: {
        id: 'TR_GUIDE_FORUM',
        defaultMessage: 'Trezor Forum',
    },
    TR_GUIDE_FORUM_LABEL: {
        id: 'TR_GUIDE_FORUM_LABEL',
        defaultMessage: 'Connect with Trezor community',
    },
    TR_GUIDE_SUPPORT_AND_FEEDBACK: {
        id: 'TR_GUIDE_SUPPORT_AND_FEEDBACK',
        defaultMessage: 'Support & Feedback',
    },
    TR_GUIDE_CATEGORIES: {
        id: 'TR_GUIDE_CATEGORIES',
        defaultMessage: 'Categories',
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
    TR_ONBOARDING_STEP_FIRMWARE: {
        id: 'TR_ONBOARDING_STEP_FIRMWARE',
        defaultMessage: 'Firmware',
    },
    TR_ONBOARDING_STEP_WALLET: {
        id: 'TR_ONBOARDING_STEP_WALLET',
        defaultMessage: 'Wallet',
    },
    TR_ONBOARDING_STEP_PIN: {
        id: 'TR_ONBOARDING_STEP_PIN',
        defaultMessage: 'PIN',
    },
    TR_ONBOARDING_STEP_COINS: {
        id: 'TR_ONBOARDING_STEP_COINS',
        defaultMessage: 'Coins',
    },
    TR_ONBOARDING_CURRENT_VERSION: {
        id: 'TR_ONBOARDING_CURRENT_VERSION',
        defaultMessage: 'Current Version',
    },
    TR_ONBOARDING_NEW_VERSION: {
        id: 'TR_ONBOARDING_NEW_VERSION',
        defaultMessage: 'New Version',
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
    TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_MODEL_1: {
        id: 'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_MODEL_1',
        defaultMessage: 'Reconnect the device without touching any buttons.',
    },
    TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_MODEL_2: {
        id: 'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_MODEL_2',
        defaultMessage: 'Reconnect the device without touching the screen.',
    },
    TR_WIPE_OR_UPDATE: {
        id: 'TR_WIPE_OR_UPDATE',
        defaultMessage: 'Reset device or update firmware',
    },
    TR_WIPE_OR_UPDATE_DESCRIPTION: {
        id: 'TR_WIPE_OR_UPDATE_DESCRIPTION',
        defaultMessage: 'Go to Device Settings',
    },
    TR_ONBOARDING_DEVICE_CHECK: {
        id: 'TR_ONBOARDING_DEVICE_CHECK',
        defaultMessage: 'Security check',
        description:
            'Heading for an onboarding step where we ask the user to verify authenticity of his device',
    },
    TR_ONBOARDING_DEVICE_CHECK_1: {
        id: 'TR_ONBOARDING_DEVICE_CHECK_1',
        defaultMessage: 'My <strong>hologram</strong> was intact and untampered with.',
    },
    TR_ONBOARDING_DEVICE_CHECK_2: {
        id: 'TR_ONBOARDING_DEVICE_CHECK_2',
        defaultMessage: 'I bought from the official shop or a trusted reseller.',
    },
    TR_ONBOARDING_DEVICE_CHECK_3: {
        id: 'TR_ONBOARDING_DEVICE_CHECK_3',
        defaultMessage: 'Package wasn’t tampered with.',
    },
    TR_ONBOARDING_DEVICE_CHECK_4: {
        id: 'TR_ONBOARDING_DEVICE_CHECK_4',
        description: 'Shown only if device has firmware already installed',
        defaultMessage:
            'Firmware is already installed on the connected Trezor. Only continue with setup if you have used this Trezor before.',
    },
    TR_ONBOARDING_COINS_STEP: {
        id: 'TR_ONBOARDING_COINS_STEP',
        defaultMessage: 'Activate Coins',
    },
    TR_ONBOARDING_COINS_STEP_DESCRIPTION: {
        id: 'TR_ONBOARDING_COINS_STEP_DESCRIPTION',
        defaultMessage:
            'Select cryptocurrencies to show in Trezor Suite. You can change this setting at any time. Some coins are ERC20 tokens and can be used by enabling Ethereum below.',
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
        defaultMessage: 'Download Desktop App',
    },
    TR_ONBOARDING_WELCOME_HEADING: {
        id: 'TR_ONBOARDING_WELCOME_HEADING',
        defaultMessage: 'Welcome!',
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
    TR_TROUBLESHOOTING_BRIDGE_IS_NOT_RUNNING: {
        defaultMessage: 'Steps to make sure Trezor Bridge is running',
        id: 'TR_TROUBLESHOOTING_BRIDGE_IS_NOT_RUNNING',
    },
    TR_TROUBLESHOOTING_TIP_BRIDGE_STATUS_TITLE: {
        defaultMessage: 'Ensure the Trezor Bridge process is running',
        id: 'TR_TROUBLESHOOTING_TIP_BRIDGE_STATUS_TITLE',
    },
    TR_TROUBLESHOOTING_TIP_BRIDGE_STATUS_DESCRIPTION: {
        defaultMessage: 'Visit <a>Trezor Bridge status page</a>',
        id: 'TR_TROUBLESHOOTING_TIP_BRIDGE_STATUS_DESCRIPTION',
    },
    TR_TROUBLESHOOTING_TIP_BRIDGE_INSTALL_TITLE: {
        id: 'TR_TROUBLESHOOTING_TIP_BRIDGE_INSTALL_TITLE',
        defaultMessage: 'If you can’t see Trezor Bridge running, download and install it',
    },
    TR_TROUBLESHOOTING_TIP_BRIDGE_INSTALL_DESCRIPTION: {
        id: 'TR_TROUBLESHOOTING_TIP_BRIDGE_INSTALL_DESCRIPTION',
        defaultMessage: '<a>Download Trezor Bridge</a>',
    },
    TR_TROUBLESHOOTING_TIP_BRIDGE_USE_TITLE: {
        id: 'TR_TROUBLESHOOTING_TIP_BRIDGE_USE_TITLE',
        defaultMessage:
            'If the above tips didn’t work, you can try using Trezor Bridge instead of WebUSB',
    },
    TR_TROUBLESHOOTING_TIP_BRIDGE_USE_DESCRIPTION: {
        id: 'TR_TROUBLESHOOTING_TIP_BRIDGE_USE_DESCRIPTION',
        defaultMessage: '<a>Download Trezor Bridge</a> and click the button below.',
    },
    TR_TROUBLESHOOTING_TIP_UDEV_INSTALL_DESCRIPTION: {
        id: 'TR_TROUBLESHOOTING_TIP_UDEV_INSTALL_DESCRIPTION',
        defaultMessage:
            'Try installing <a>udev rules</a>. Make sure to first save them to desktop before opening.',
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
            'After closing other browser tabs and windows, try quitting and reopening the Trezor Suite app.',
        id: 'TR_TROUBLESHOOTING_CLOSE_TABS_DESCRIPTION_DESKTOP',
    },
    TR_TROUBLESHOOTING_TIP_CABLE_TITLE: {
        id: 'TR_TROUBLESHOOTING_TIP_CABLE_TITLE',
        defaultMessage: 'Try a different cable',
    },
    TR_TROUBLESHOOTING_TIP_CABLE_DESCRIPTION: {
        id: 'TR_TROUBLESHOOTING_TIP_CABLE_DESCRIPTION',
        defaultMessage:
            'The cable must be fully inserted. If you have a Model T, the cable should "click" into place.',
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
        defaultMessage: 'Try restarting your computer',
    },
    TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_DESCRIPTION: {
        id: 'TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_DESCRIPTION',
        defaultMessage: 'Just in case',
    },
    TR_TROUBLESHOOTING_UNREADABLE_WEBUSB: {
        id: 'TR_TROUBLESHOOTING_UNREADABLE_WEBUSB',
        defaultMessage:
            'Your device is connected properly, but your internet browser can not communicate with it at the moment. You will need to install Trezor Bridge.',
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
        defaultMessage: 'Seedless setup is not supported by Trezor Suite',
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
            'Devices which are set up in the seedless mode cannot access the Trezor Suite. This is to avoid catastrophic coin loss, in case an inappropriately setup device is used for a wrong purpose.',
    },
    TR_DO_YOU_REALLY_WANT_TO_SKIP: {
        id: 'TR_DO_YOU_REALLY_WANT_TO_SKIP',
        defaultMessage: 'Do you really want to skip this step?',
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
        defaultMessage: 'Cannot reach Trezor stake pool to delegate on.',
    },
    TR_STAKING_TX_PENDING: {
        id: 'TR_STAKING_TX_PENDING',
        defaultMessage:
            'Your transaction {txid} was successfully sent to the blockchain and is waiting for confirmation.',
    },
    TR_STAKING_ON_3RD_PARTY_TITLE: {
        id: 'TR_STAKING_ON_3RD_PARTY_TITLE',
        defaultMessage: 'You are delegating on a 3rd party stake pool',
    },
    TR_STAKING_ON_3RD_PARTY_DESCRIPTION: {
        id: 'TR_STAKING_ON_3RD_PARTY_DESCRIPTION',
        defaultMessage:
            'By staking on Trezor stake pool you are directly supporting Trezor and the Cardano ecosystem within Trezor Suite.',
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
            'Sent {multiple, select, true {multiple tokens} false {{symbol}} other {{smbol}}}',
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
        defaultMessage: 'Trezor Amount',
    },
    TR_CARDANO_FINGERPRINT_HEADLINE: {
        id: 'TR_CARDANO_FINGERPRINT_HEADLINE',
        defaultMessage: 'Fingerprint',
    },
    TR_EXCEEDS_MAX: {
        id: 'TR_EXCEEDS_MAX',
        defaultMessage: 'Exceeds max length',
    },
    TR_ADDRESS_FORMAT: {
        id: 'TR_ADDRESS_FORMAT',
        defaultMessage: 'Correct address format',
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
});
