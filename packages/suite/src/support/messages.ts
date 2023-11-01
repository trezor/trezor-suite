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
            'Passphrases add a custom phrase (e.g. a word, sentence, or string of characters) to your recovery seed. This creates a hidden wallet; each hidden wallet uses its own passphrase. Your standard wallet will still be accessible without a passphrase.',
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
        defaultMessage: 'All coins are currently disabled. Please enable some coins in Settings.',
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
            "If closing tabs and reopening Trezor Suite doesn't help, please try reconnecting your Trezor.",
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
    TR_CONTRACT: {
        defaultMessage: 'Contract',
        id: 'TR_CONTRACT',
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
            'The fees to perform this swap are estimated at {approvalFee} ({approvalFeeFiat}) for approval (if required) and {swapFee} ({swapFeeFiat}) for the swap.',
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
    TR_EXCHANGE_FEES_INCLUDED_INFO: {
        id: 'TR_EXCHANGE_FEES_INCLUDED_INFO',
        defaultMessage:
            "What you see is close to what you'll get—the amount shown is the best estimate of the final amount you'll receive, with all exchange fees included. For float-rate offers, there may be slight changes between accepting the offer and completing the transaction.",
    },
    TR_EXCHANGE_SHOW_OFFERS: {
        defaultMessage: 'Compare offers',
        id: 'TR_EXCHANGE_SHOW_OFFERS',
    },
    TR_EXCHANGE_OFFERS_REFRESH: {
        defaultMessage: 'Offers refresh in',
        id: 'TR_EXCHANGE_OFFERS_REFRESH',
    },
    TR_EXCHANGE_MODAL_FOR_YOUR_SAFETY: {
        defaultMessage: 'Exchange {fromCrypto} to {toCrypto} with {provider}',
        id: 'TR_EXCHANGE_MODAL_FOR_YOUR_SAFETY',
        dynamic: true,
    },
    TR_EXCHANGE_MODAL_CONFIRM: {
        defaultMessage: 'I’m ready to exchange',
        id: 'TR_EXCHANGE_MODAL_CONFIRM',
        dynamic: true,
    },
    TR_EXCHANGE_MODAL_SECURITY_HEADER: {
        defaultMessage: 'Security first with your Trezor',
        id: 'TR_EXCHANGE_MODAL_SECURITY_HEADER',
        dynamic: true,
    },
    TR_EXCHANGE_MODAL_TERMS_1: {
        defaultMessage:
            "You're here to exchange cryptocurrency. If you were directed to this site for any other reason, please contact support before proceeding.",
        id: 'TR_EXCHANGE_MODAL_TERMS_1',
        dynamic: true,
    },
    TR_EXCHANGE_MODAL_TERMS_2: {
        defaultMessage:
            "You're exchanging cryptocurrency for your own account. You acknowledge that the provider's policies may require identity verification.",
        id: 'TR_EXCHANGE_MODAL_TERMS_2',
        dynamic: true,
    },
    TR_EXCHANGE_MODAL_TERMS_3: {
        defaultMessage:
            'You understand that cryptocurrency transactions are irreversible and may not be refunded. Thus, fraudulent or accidental losses may be unrecoverable.',
        id: 'TR_EXCHANGE_MODAL_TERMS_3',
        dynamic: true,
    },
    TR_EXCHANGE_MODAL_VERIFIED_PARTNERS_HEADER: {
        defaultMessage: 'Verified partners by Invity',
        id: 'TR_EXCHANGE_MODAL_VERIFIED_PARTNERS_HEADER',
        dynamic: true,
    },
    TR_EXCHANGE_MODAL_TERMS_4: {
        defaultMessage:
            'You understand that Invity does not provide this service. {provider}’s terms govern the service.',
        id: 'TR_EXCHANGE_MODAL_TERMS_4',
        dynamic: true,
    },
    TR_EXCHANGE_MODAL_LEGAL_HEADER: {
        defaultMessage: 'Legal notice',
        id: 'TR_EXCHANGE_MODAL_LEGAL_HEADER',
        dynamic: true,
    },
    TR_EXCHANGE_MODAL_TERMS_5: {
        defaultMessage:
            "You're not using this feature for gambling, fraud or any other violation of either Invity’s or the provider's Terms of service, or of any applicable regulations.",
        id: 'TR_EXCHANGE_MODAL_TERMS_5',
        dynamic: true,
    },
    TR_EXCHANGE_MODAL_TERMS_6: {
        defaultMessage:
            'You understand that cryptocurrencies are an emerging financial tool and that regulations may vary in different jurisdictions. This may put you at a higher risk of fraud, theft, or market instability.',
        id: 'TR_EXCHANGE_MODAL_TERMS_6',
        dynamic: true,
    },
    TR_EXCHANGE_DEX_MODAL_FOR_YOUR_SAFETY: {
        defaultMessage: 'Exchange {fromCrypto} to {toCrypto} with {provider}',
        id: 'TR_EXCHANGE_DEX_MODAL_FOR_YOUR_SAFETY',
        dynamic: true,
    },
    TR_EXCHANGE_DEX_MODAL_CONFIRM: {
        defaultMessage: 'I’m ready to exchange',
        id: 'TR_EXCHANGE_DEX_MODAL_CONFIRM',
        dynamic: true,
    },
    TR_EXCHANGE_DEX_MODAL_SECURITY_HEADER: {
        defaultMessage: 'Security first with your Trezor',
        id: 'TR_EXCHANGE_DEX_MODAL_SECURITY_HEADER',
        dynamic: true,
    },
    TR_EXCHANGE_DEX_MODAL_TERMS_1: {
        defaultMessage:
            "You're here to exchange cryptocurrency using DEX (Decentralized Exchange) by using {provider}'s contract.",
        id: 'TR_EXCHANGE_DEX_MODAL_TERMS_1',
        dynamic: true,
    },
    TR_EXCHANGE_DEX_MODAL_TERMS_2: {
        defaultMessage:
            "You're exchanging cryptocurrency for your own account. You acknowledge that the provider's policies may require identity verification.",
        id: 'TR_EXCHANGE_DEX_MODAL_TERMS_2',
        dynamic: true,
    },
    TR_EXCHANGE_DEX_MODAL_TERMS_3: {
        defaultMessage:
            'You understand that cryptocurrency transactions are irreversible and may not be refunded. Thus, fraudulent or accidental losses may be unrecoverable.',
        id: 'TR_EXCHANGE_DEX_MODAL_TERMS_3',
        dynamic: true,
    },
    TR_EXCHANGE_DEX_MODAL_VERIFIED_PARTNERS_HEADER: {
        defaultMessage: 'Verified partners by Invity',
        id: 'TR_EXCHANGE_DEX_MODAL_VERIFIED_PARTNERS_HEADER',
        dynamic: true,
    },
    TR_EXCHANGE_DEX_MODAL_TERMS_4: {
        defaultMessage:
            'You understand that Invity does not provide this service. {provider}’s terms govern the service.',
        id: 'TR_EXCHANGE_DEX_MODAL_TERMS_4',
        dynamic: true,
    },
    TR_EXCHANGE_DEX_MODAL_LEGAL_HEADER: {
        defaultMessage: 'Legal notice',
        id: 'TR_EXCHANGE_DEX_MODAL_LEGAL_HEADER',
        dynamic: true,
    },
    TR_EXCHANGE_DEX_MODAL_TERMS_5: {
        defaultMessage:
            "You're not using this feature for gambling, fraud or any other violation of either Invity’s or the provider's Terms of service, or of any applicable regulations.",
        id: 'TR_EXCHANGE_DEX_MODAL_TERMS_5',
        dynamic: true,
    },
    TR_EXCHANGE_DEX_MODAL_TERMS_6: {
        defaultMessage:
            'You understand that cryptocurrencies are an emerging financial tool and that regulations may vary in different jurisdictions. This may put you at a higher risk of fraud, theft, or market instability.',
        id: 'TR_EXCHANGE_DEX_MODAL_TERMS_6',
        dynamic: true,
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
    TR_EXCHANGE_RECEIVING_ACCOUNT: {
        defaultMessage: 'Receive account',
        id: 'TR_EXCHANGE_RECEIVING_ACCOUNT',
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
        defaultMessage: 'Slippage must be in the range 0.01% - 50%',
        id: 'TR_EXCHANGE_SWAP_SLIPPAGE_NOT_IN_RANGE',
    },
    TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND: {
        defaultMessage: 'Confirm on Trezor & send',
        id: 'TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND',
    },
    TR_EXCHANGE_RECEIVE_ACCOUNT_QUESTION_TOOLTIP: {
        id: 'TR_EXCHANGE_RECEIVE_ACCOUNT_QUESTION_TOOLTIP',
        defaultMessage:
            "This is the account where you'll find your coins once the transaction is finished.",
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
        defaultMessage: "Use an account ({symbol}) that isn't in Suite",
        id: 'TR_EXCHANGE_USE_NON_SUITE_ACCOUNT',
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
    TR_SELL_VALIDATION_ERROR_MINIMUM_FIAT: {
        defaultMessage: 'Minimum is {minimum} {currency}',
        id: 'TR_SELL_VALIDATION_ERROR_MINIMUM_FIAT',
    },
    TR_SELL_VALIDATION_ERROR_MAXIMUM_FIAT: {
        defaultMessage: 'Maximum is {maximum} {currency}',
        id: 'TR_SELL_VALIDATION_ERROR_MAXIMUM_FIAT',
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
            "You're here to sell cryptocurrency. If you were directed to this site for any other reason, please contact support before proceeding.",
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
            "You're not using this feature for gambling, fraud or any other violation of either Invity’s or the provider's Terms of service, or of any applicable regulations.",
        id: 'TR_SELL_MODAL_TERMS_5',
        dynamic: true,
    },
    TR_SELL_MODAL_TERMS_6: {
        defaultMessage:
            'You understand that cryptocurrencies are an emerging financial tool and that regulations may vary in different jurisdictions. This may put you at a higher risk of fraud, theft, or market instability.',
        id: 'TR_SELL_MODAL_TERMS_6',
        dynamic: true,
    },
    TR_SELL_OTHER_OFFERS_IN: {
        defaultMessage: 'Other offers in',
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
        defaultMessage: 'Get this offer',
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
    TR_P2P_WORTH_OF: {
        defaultMessage: 'worth of',
        id: 'TR_P2P_WORTH_OF',
    },
    TR_P2P_INFO: {
        defaultMessage:
            'With {peerToPeer} (P2P) technology, there is no KYC verification involved neither on the side of the buyer nor the seller. All parties are protected against fraud by secure {multisigEscrow}.',
        id: 'TR_P2P_INFO',
    },
    TR_P2P_INFO_PEER_TO_PEER: {
        defaultMessage: 'Peer-to-Peer',
        id: 'TR_P2P_INFO_PEER_TO_PEER',
    },
    TR_P2P_INFO_PEER_TO_PEER_TOOLTIP: {
        defaultMessage:
            'You conduct business directly with a specific person instead of a centralized institution. The P2P platform helps you find sellers and provides security.',
        id: 'TR_P2P_INFO_PEER_TO_PEER_TOOLTIP',
    },
    TR_P2P_INFO_MULTISIG_ESCROW: {
        defaultMessage: 'multisig escrow',
        id: 'TR_P2P_INFO_MULTISIG_ESCROW',
    },
    TR_P2P_INFO_MULTISIG_ESCROW_TOOLTIP: {
        defaultMessage:
            'This is a unique generated address where the bitcoins are kept safe during the trade. To release it, a “signature” is needed from at least two out of three parties (buyer, seller, platform provider) to validate a successful transaction.',
        id: 'TR_P2P_INFO_MULTISIG_ESCROW_TOOLTIP',
    },
    TR_P2P_OFFERS_FOR: {
        defaultMessage: 'Offers for',
        id: 'TR_P2P_OFFERS_FOR',
    },
    TR_P2P_SHOW_OFFERS: {
        defaultMessage: 'Show offers',
        id: 'TR_P2P_SHOW_OFFERS',
    },
    TR_P2P_OFFERS_REFRESH: {
        defaultMessage: 'Offers refresh in',
        id: 'TR_P2P_OFFERS_REFRESH',
    },
    TR_P2P_NO_OFFERS: {
        defaultMessage:
            'Sorry, there are no offers for your selection. You can choose from other deals below.',
        id: 'TR_P2P_NO_OFFERS',
    },
    TR_P2P_MORE_OFFERS_AVAILABLE: {
        defaultMessage: 'Check out more offers in different currencies.',
        id: 'TR_P2P_MORE_OFFERS_AVAILABLE',
    },
    TR_P2P_ALTERNATIVE_OFFERS: {
        defaultMessage: 'Alternative offers',
        id: 'TR_P2P_ALTERNATIVE_OFFERS',
    },
    TR_P2P_PRICE: {
        defaultMessage: 'Price for 1 {symbol}',
        id: 'TR_P2P_PRICE',
    },
    TR_P2P_PRICE_TOOLTIP: {
        defaultMessage: '{symbol} price offered by this user.',
        id: 'TR_P2P_PRICE_TOOLTIP',
    },
    TR_P2P_AMOUNT: {
        defaultMessage: 'Amount',
        id: 'TR_P2P_AMOUNT',
    },
    TR_P2P_AMOUNT_RANGE: {
        defaultMessage: 'Amount range',
        id: 'TR_P2P_AMOUNT_RANGE',
    },
    TR_P2P_AMOUNT_RANGE_TOOLTIP: {
        defaultMessage:
            'The minimum and maximum amount for which this user is willing to sell {symbol}.',
        id: 'TR_P2P_AMOUNT_RANGE_TOOLTIP',
    },
    TR_P2P_GET_THIS_OFFER: {
        defaultMessage: 'Get this deal',
        id: 'TR_P2P_GET_THIS_OFFER',
    },
    TR_P2P_PROVIDER: {
        defaultMessage: 'Provider',
        id: 'TR_P2P_PROVIDER',
    },
    TR_P2P_USER: {
        defaultMessage: 'User',
        id: 'TR_P2P_USER',
    },
    TR_P2P_USER_TOOLTIP: {
        defaultMessage:
            'The user offering this deal. Note their rating and number of performed trades.',
        id: 'TR_P2P_USER_TOOLTIP',
    },
    TR_P2P_USER_REPUTATION: {
        defaultMessage: '({rating}, {numberOfTrades})',
        id: 'TR_P2P_USER_REPUTATION',
    },
    TR_P2P_UNKNOWN_RATING: {
        defaultMessage: '?',
        id: 'TR_P2P_UNKNOWN_RATING',
    },
    TR_P2P_TITLE: {
        defaultMessage: 'Title',
        id: 'TR_P2P_TITLE',
    },
    TR_P2P_TITLE_NOT_AVAILABLE: {
        defaultMessage: 'Hey there, I’m using {providerName}!',
        id: 'TR_P2P_TITLE_NOT_AVAILABLE',
    },
    TR_P2P_LOCATION: {
        defaultMessage: 'Location',
        id: 'TR_P2P_LOCATION',
    },
    TR_P2P_PAYMENT_METHODS: {
        defaultMessage: 'Payment methods',
        id: 'TR_P2P_PAYMENT_METHODS',
    },
    TR_P2P_PAYMENT_METHODS_TOOLTIP: {
        defaultMessage: 'All payment methods accepted by this user.',
        id: 'TR_P2P_PAYMENT_METHODS_TOOLTIP',
    },
    TR_P2P_PAYMENT_WINDOW: {
        defaultMessage: 'Payment window',
        id: 'TR_P2P_PAYMENT_WINDOW',
    },
    TR_P2P_PAYMENT_WINDOW_TOOLTIP: {
        defaultMessage:
            'The transaction needs to be completed within this time limit, counting from creating a contract on the {providerName} site.',
        id: 'TR_P2P_PAYMENT_WINDOW_TOOLTIP',
    },
    TR_P2P_PAYMENT_WINDOW_MINUTES: {
        defaultMessage: 'min',
        id: 'TR_P2P_PAYMENT_WINDOW_MINUTES',
    },
    TR_P2P_CONFIRMATIONS: {
        defaultMessage: 'Confirmations',
        id: 'TR_P2P_CONFIRMATIONS',
    },
    TR_P2P_WARNING_AMOUNT_RANGE_MINIMUM: {
        defaultMessage:
            'The chosen amount of {amount} is lower than the accepted minimum of {minimum}.',
        id: 'TR_P2P_WARNING_AMOUNT_RANGE_MINIMUM',
    },
    TR_P2P_WARNING_AMOUNT_RANGE_MAXIMUM: {
        defaultMessage:
            'The chosen amount of {amount} is higher than the accepted maximum of {maximum}.',
        id: 'TR_P2P_WARNING_AMOUNT_RANGE_MAXIMUM',
    },
    TR_P2P_MODAL_FOR_YOUR_SAFETY: {
        defaultMessage: 'Peer-to-Peer Buy {cryptocurrency} with {provider}',
        id: 'TR_P2P_MODAL_FOR_YOUR_SAFETY',
        dynamic: true,
    },
    TR_P2P_MODAL_SECURITY_HEADER: {
        defaultMessage: 'Security first with your Trezor',
        id: 'TR_P2P_MODAL_SECURITY_HEADER',
        dynamic: true,
    },
    TR_P2P_MODAL_TERMS_1: {
        defaultMessage:
            'You’re here to buy cryptocurrency from another person you choose using Peer-to-Peer (P2P) technology without ID verification. If you were directed to this site for any other reason, please contact support before proceeding.',
        id: 'TR_P2P_MODAL_TERMS_1',
        dynamic: true,
    },
    TR_P2P_MODAL_TERMS_2: {
        defaultMessage:
            'You understand that cryptocurrency transactions are irreversible and may not be refunded. Thus, fraudulent or accidental losses may be unrecoverable.',
        id: 'TR_P2P_MODAL_TERMS_2',
        dynamic: true,
    },
    TR_P2P_MODAL_VERIFIED_PARTNERS_HEADER: {
        defaultMessage: 'Verified partners by Invity',
        id: 'TR_P2P_MODAL_VERIFIED_PARTNERS_HEADER',
        dynamic: true,
    },
    TR_P2P_MODAL_TERMS_4: {
        defaultMessage:
            'You understand that Invity does not provide this service. {provider}’s terms govern the service.',
        id: 'TR_P2P_MODAL_TERMS_4',
        dynamic: true,
    },
    TR_P2P_MODAL_LEGAL_HEADER: {
        defaultMessage: 'Legal notice',
        id: 'TR_P2P_MODAL_LEGAL_HEADER',
        dynamic: true,
    },
    TR_P2P_MODAL_TERMS_5: {
        defaultMessage:
            "You're not using this feature for gambling, fraud or any other violation of either Invity’s or the provider's Terms of service, or of any applicable regulations.",
        id: 'TR_P2P_MODAL_TERMS_5',
        dynamic: true,
    },
    TR_P2P_MODAL_TERMS_6: {
        defaultMessage:
            'You understand that cryptocurrencies are an emerging financial tool and that regulations may vary in different jurisdictions. This may put you at a higher risk of fraud, theft, or market instability.',
        id: 'TR_P2P_MODAL_TERMS_6',
        dynamic: true,
    },
    TR_P2P_MODAL_CONFIRM: {
        defaultMessage: 'I’m ready to buy',
        id: 'TR_P2P_MODAL_CONFIRM',
        dynamic: true,
    },
    TR_P2P_GET_STARTED_STEP: {
        defaultMessage: 'Get started',
        id: 'TR_P2P_GET_STARTED_STEP',
    },
    TR_P2P_RECEIVING_ADDRESS_STEP: {
        defaultMessage: 'Receive address',
        id: 'TR_P2P_RECEIVING_ADDRESS_STEP',
    },
    TR_P2P_GET_STARTED_INTRO: {
        defaultMessage:
            'You need to initiate the transaction on {providerName} – make sure to follow the steps below carefully.',
        id: 'TR_P2P_GET_STARTED_INTRO',
    },
    TR_P2P_GET_STARTED_ITEM_1: {
        defaultMessage: 'Select “Go to {providerName}” to be redirected to our partner’s website.',
        id: 'TR_P2P_GET_STARTED_ITEM_1',
    },
    TR_P2P_GET_STARTED_ITEM_2: {
        defaultMessage: 'Sign in or create an account on the platform and follow its instructions.',
        id: 'TR_P2P_GET_STARTED_ITEM_2',
    },
    TR_P2P_GET_STARTED_ITEM_3: {
        defaultMessage:
            'Once {providerName} asks you for a release address, return here and continue.',
        id: 'TR_P2P_GET_STARTED_ITEM_3',
    },
    TR_P2P_GET_STARTED_ATTENTION: {
        defaultMessage:
            'Attention: Do NOT close Trezor Suite at any time during the process or you will have to start over.',
        id: 'TR_P2P_GET_STARTED_ATTENTION',
    },
    TR_P2P_GO_TO_PROVIDER: {
        defaultMessage: 'Go to {providerName}',
        id: 'TR_P2P_GO_TO_PROVIDER',
    },
    TR_P2P_GO_TO_RECEIVING_ADDRESS: {
        defaultMessage: 'Go to receive address',
        id: 'TR_P2P_GO_TO_RECEIVING_ADDRESS',
    },
    TR_P2P_RECEIVING_ADDRESS: {
        defaultMessage: 'Receive address',
        id: 'TR_P2P_RECEIVING_ADDRESS',
    },
    TR_P2P_RECEIVING_ADDRESS_ALMOST_THERE: {
        defaultMessage:
            'Almost there! Reveal and copy your address, paste it into the “Release address” field back on {providerName}, and finalize the transaction.',
        id: 'TR_P2P_GET_STARTED_ITEM_4',
    },
    TR_P2P_REVEAL_ADDRESS: {
        defaultMessage: 'Reveal address',
        id: 'TR_P2P_REVEAL_ADDRESS',
    },
    TR_P2P_BACK_TO_ACCOUNT: {
        defaultMessage: 'Done! Back to my account',
        id: 'TR_P2P_BACK_TO_ACCOUNT',
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
    TR_SAVINGS_PROVIDED_BY: {
        defaultMessage: 'Provided by {providerName}',
        id: 'TR_SAVINGS_PROVIDED_BY',
    },
    TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_REQUIRED: {
        defaultMessage: 'Amount is required.',
        id: 'TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_REQUIRED',
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
        defaultMessage: 'Your savings plan setup',
        id: 'TR_SAVINGS_SETUP_HEADER',
    },
    TR_SAVINGS_SETUP_COUNTRY_LOCATION_DESCRIPTION: {
        defaultMessage:
            '{cryptoCurrencyName} savings plan is a location specific feature. We are only able to provide offers to users from the supported countries listed below.',
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
    TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_DAILY: {
        defaultMessage: 'Daily',
        id: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_DAILY',
    },
    TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_WEEKLY: {
        defaultMessage: 'Weekly',
        id: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_WEEKLY',
    },
    TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_BIWEEKLY: {
        defaultMessage: 'Biweekly',
        id: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_BIWEEKLY',
    },
    TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_MONTHLY: {
        defaultMessage: 'Monthly',
        id: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_MONTHLY',
    },
    TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_QUARTERLY: {
        defaultMessage: 'Quarterly',
        id: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_QUARTERLY',
    },
    TR_SAVINGS_SETUP_FIAT_AMOUNT_LABEL: {
        defaultMessage: 'Amount',
        id: 'TR_SAVINGS_SETUP_FIAT_AMOUNT_LABEL',
    },
    TR_SAVINGS_SETUP_FIAT_AMOUNT_CUSTOM: {
        defaultMessage: 'Custom',
        id: 'TR_SAVINGS_SETUP_FIAT_AMOUNT_CUSTOM',
    },
    TR_SAVINGS_SETUP_RECEIVING_ADDRESS: {
        defaultMessage: 'Receive address',
        id: 'TR_SAVINGS_SETUP_RECEIVING_ADDRESS',
    },
    TR_SAVINGS_SETUP_RECEIVING_ADDRESS_CHANGES_PAYMENT_INFO: {
        defaultMessage:
            'Changing the receive address changes the payment information. Please review the information on the next page carefully.',
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
        defaultMessage: 'Something went wrong during the KYC check. Please contact Trezor Support.',
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
    TR_SAVINGS_OVERVIEW_PERIOD_DAILY: {
        defaultMessage: 'daily',
        id: 'TR_SAVINGS_OVERVIEW_PERIOD_DAILY',
        dynamic: true,
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
    TR_SAVINGS_OVERVIEW_COIN_TRANSFER_DELAYED: {
        defaultMessage:
            'Coins are in {providerName} custody and will be transferred to your Trezor automatically.',
        id: 'TR_SAVINGS_OVERVIEW_COIN_TRANSFER_DELAYED',
    },
    TR_SAVINGS_AUTHORIZATION_ERROR: {
        defaultMessage:
            'Your authorization expired. To continue using Save Bitcoin, please select Reauthorize account.',
        id: 'TR_SAVINGS_AUTHORIZATION_ERROR',
    },
    TR_SAVINGS_AUTHORIZATION_ERROR_BUTTON_LABEL: {
        defaultMessage: 'Reauthorize account',
        id: 'TR_SAVINGS_AUTHORIZATION_ERROR_BUTTON_LABEL',
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
    TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_BANKTRANSFER_PAYMENT_HEADER: {
        defaultMessage: 'Waiting for your first payment.',
        id: 'TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_BANKTRANSFER_PAYMENT_HEADER',
        dynamic: true,
    },
    TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_BANKTRANSFER_PAYMENT_DESCRIPTION: {
        defaultMessage:
            "Select 'View payment details' to find the information you need to make the payment.",
        id: 'TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_BANKTRANSFER_PAYMENT_DESCRIPTION',
        dynamic: true,
    },
    TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_ACH_PAYMENT_HEADER: {
        defaultMessage: 'Now you wait.',
        id: 'TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_ACH_PAYMENT_HEADER',
        dynamic: true,
    },
    TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_ACH_PAYMENT_DESCRIPTION: {
        defaultMessage:
            '{providerName} will charge your bank account automatically. It usually takes until the next working day.',
        id: 'TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_ACH_PAYMENT_DESCRIPTION',
        dynamic: true,
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
    TR_SAVINGS_MODAL_FOR_YOUR_SAFETY: {
        defaultMessage: 'Buy Bitcoin regularly with {provider}',
        id: 'TR_SAVINGS_MODAL_FOR_YOUR_SAFETY',
        dynamic: true,
    },
    TR_SAVINGS_MODAL_SECURITY_HEADER: {
        defaultMessage: 'Security first with your Trezor',
        id: 'TR_SAVINGS_MODAL_SECURITY_HEADER',
        dynamic: true,
    },
    TR_SAVINGS_MODAL_TERMS_1: {
        defaultMessage:
            "You're here to buy cryptocurrency. If you were directed to this site for any other reason, please contact support before proceeding.",
        id: 'TR_SAVINGS_MODAL_TERMS_1',
        dynamic: true,
    },
    TR_SAVINGS_MODAL_TERMS_2: {
        defaultMessage:
            "You're buying cryptocurrency for your own account. You acknowledge that the provider's policies may require identity verification.",
        id: 'TR_SAVINGS_MODAL_TERMS_2',
        dynamic: true,
    },
    TR_SAVINGS_MODAL_TERMS_3: {
        defaultMessage:
            'You understand that cryptocurrency transactions are irreversible and may not be refunded. Thus, fraudulent or accidental losses may be unrecoverable.',
        id: 'TR_SAVINGS_MODAL_TERMS_3',
        dynamic: true,
    },
    TR_SAVINGS_MODAL_VERIFIED_PARTNERS_HEADER: {
        defaultMessage: 'Verified partners by Invity',
        id: 'TR_SAVINGS_MODAL_VERIFIED_PARTNERS_HEADER',
        dynamic: true,
    },
    TR_SAVINGS_MODAL_TERMS_4: {
        defaultMessage:
            'You understand that Invity does not provide this service. {provider}’s terms govern the service.',
        id: 'TR_SAVINGS_MODAL_TERMS_4',
        dynamic: true,
    },
    TR_SAVINGS_MODAL_LEGAL_HEADER: {
        defaultMessage: 'Legal notice',
        id: 'TR_SAVINGS_MODAL_LEGAL_HEADER',
        dynamic: true,
    },
    TR_SAVINGS_MODAL_TERMS_5: {
        defaultMessage:
            "You're not using this feature for gambling, fraud or any other violation of either Invity’s or the provider's Terms of service, or of any applicable regulations.",
        id: 'TR_SAVINGS_MODAL_TERMS_5',
        dynamic: true,
    },
    TR_SAVINGS_MODAL_TERMS_6: {
        defaultMessage:
            'You understand that cryptocurrencies are an emerging financial tool and that regulations may vary in different jurisdictions. This may put you at a higher risk of fraud, theft, or market instability.',
        id: 'TR_SAVINGS_MODAL_TERMS_6',
        dynamic: true,
    },
    TR_SAVINGS_MODAL_CONFIRM: {
        defaultMessage: 'I’m ready to buy',
        id: 'TR_SAVINGS_MODAL_CONFIRM',
        dynamic: true,
    },
    TR_SAVINGS_SETUP_WAITING_MESSAGE: {
        defaultMessage: 'Please complete the setup on the Invity.io website.',
        id: 'TR_SAVINGS_SETUP_WAITING_MESSAGE',
    },
    TR_SAVINGS_SETUP_WAITING_BUTTON_LABEL: {
        defaultMessage: 'Go to Invity',
        id: 'TR_SAVINGS_SETUP_WAITING_BUTTON_LABEL',
    },
    TR_SAVINGS_SETUP_ALL_FEES_INCLUDED: {
        defaultMessage: 'All fees included',
        id: 'TR_SAVINGS_SETUP_ALL_FEES_INCLUDED',
    },
    TR_SAVINGS_FEES_TOOLTIP: {
        defaultMessage:
            "What you see is what you'll get—the amount shown is the final amount you'll be charged. Here is the detailed {feesOverviewLink}.",
        id: 'TR_SAVINGS_FEES_TOOLTIP',
    },
    TR_SAVINGS_FEES_TOOLTIP_FEES_LINK: {
        defaultMessage: 'schedule of fees',
        id: 'TR_SAVINGS_FEES_TOOLTIP_FEES_LINK',
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
            "You're here to buy cryptocurrency. If you were directed to this site for any other reason, please contact {provider} support before proceeding.",
        id: 'TR_BUY_MODAL_TERMS_1',
        dynamic: true,
    },
    TR_BUY_MODAL_TERMS_2: {
        defaultMessage:
            "You're using this feature to purchase funds that will be sent to an account under your direct personal control.",
        id: 'TR_BUY_MODAL_TERMS_2',
        dynamic: true,
    },
    TR_BUY_MODAL_TERMS_3: {
        defaultMessage:
            'You understand that cryptocurrency transactions are irreversible and may not be refunded. Thus, fraudulent or accidental losses may be unrecoverable.',
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
            'You understand that Invity does not provide this service. {provider}’s terms govern the service.',
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
            "You're not using this feature for gambling, fraud or any other violation of either Invity’s or the provider's Terms of service, or of any applicable regulations.",
        id: 'TR_BUY_MODAL_TERMS_5',
        dynamic: true,
    },
    TR_BUY_MODAL_TERMS_6: {
        defaultMessage:
            'You understand that cryptocurrencies are an emerging financial tool and that regulations may vary in different jurisdictions. This may put you at a higher risk of fraud, theft, or market instability.',
        id: 'TR_BUY_MODAL_TERMS_6',
        dynamic: true,
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
    TR_BUY_NO_PROVIDERS: {
        defaultMessage: 'No providers',
        id: 'TR_BUY_NO_PROVIDERS',
    },
    TR_BUY_GET_THIS_OFFER: {
        id: 'TR_BUY_GET_THIS_OFFER',
        defaultMessage: 'Get this deal',
    },
    TR_LOGIN_PROCEED: {
        id: 'TR_LOGIN_PROCEED',
        defaultMessage: 'Proceed',
    },
    TR_OFFER_ERROR_MINIMUM_CRYPTO: {
        defaultMessage:
            'The chosen amount of {amount} is lower than the accepted minimum of {min}.',
        id: 'TR_OFFER_ERROR_MINIMUM_CRYPTO',
    },
    TR_OFFER_ERROR_MAXIMUM_CRYPTO: {
        defaultMessage:
            'The chosen amount of {amount} is higher than the accepted maximum of {max}.',
        id: 'TR_OFFER_ERROR_MAXIMUM_CRYPTO',
    },
    TR_OFFER_ERROR_MINIMUM_FIAT: {
        defaultMessage:
            'The chosen amount of {amount} is lower than the accepted minimum of {min}.',
        id: 'TR_OFFER_ERROR_MINIMUM_FIAT',
    },
    TR_OFFER_ERROR_MAXIMUM_FIAT: {
        defaultMessage:
            'The chosen amount of {amount} is higher than the accepted maximum of {max}.',
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
        defaultMessage: 'Receive address',
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
            'If you have written down your recovery seed, your Trezor is almost ready. Do not lose your recovery seed, otherwise your funds could be inaccessible.',
        description: 'Text that appears after backup is finished',
        id: 'TR_BACKUP_FINISHED_TEXT',
    },
    TR_BACKUP_RECOVERY_SEED: {
        defaultMessage: 'Backup',
        id: 'TR_BACKUP_RECOVERY_SEED',
    },
    TR_BACKUP_SUBHEADING_1: {
        defaultMessage:
            'A recovery seed backup is a series of randomly generated words created by your Trezor. It’s important that you write down your recovery seed and keep it safe, as it is the only way to recover and access your funds.',
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
        defaultMessage: 'Coins',
        id: 'TR_COINS',
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
        defaultMessage: 'Confirm empty hidden wallet passphrase source on "{deviceLabel}" device.',
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
        defaultMessage: 'Trezor does not have a recovery seed.',
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
            'Passphrases add a custom phrase (e.g. a word, sentence, or string of characters) to your recovery seed. This creates a hidden wallet; each hidden wallet uses its own passphrase. Your standard wallet will still be accessible without a passphrase. Do not forget your passphrase. Unlike everyday passwords, hidden wallet passphrases cannot be retrieved and your funds will be permanently lost.',
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
        defaultMessage: "Do not change this unless you know what you're doing!",
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
            'Please note that device packaging including holograms have changed over time. You can check packaging details {TR_PACKAGING_LINK}. Also be sure you made your purchase from {TR_RESELLERS_LINK}. Otherwise, the device you are holding in your hands might be a counterfeit. Please {TR_CONTACT_OUR_SUPPORT_LINK}.',
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
        defaultMessage: 'Enter passphrase on "{deviceLabel}"',
        id: 'TR_ENTER_PASSPHRASE_ON_DEVICE_LABEL',
    },
    TR_ENTER_PIN: {
        defaultMessage: 'Enter PIN',
        description: 'Text for Header and Button when submitting PIN',
        id: 'TR_ENTER_PIN',
    },
    TR_ENTER_SEED_WORDS_INSTRUCTION: {
        defaultMessage:
            'Enter the words from your recovery seed here in the order displayed on your Trezor.',
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
    TR_24H_CHANGE: {
        id: 'TR_24H_CHANGE',
        defaultMessage: '24h change',
    },
    TR_LAST_DAYS: {
        id: 'TR_LAST_DAYS',
        defaultMessage: 'Last {days} days',
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
        defaultMessage: 'Firmware installation',
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
            'All data collected is anonymous and is used to improve product performance and development. More in <analytics>technical documentation</analytics> and <tos>Terms & Conditions</tos>.',
    },
    TR_EJECT_WALLET_EXPLANATION: {
        defaultMessage: 'Instantly removes all wallet data from Suite.',
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
        defaultMessage: 'I understand passphrases cannot be retrieved.',
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
            'In case of communication with our support team, the log contains all necessary technical information.',
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
    TR_NETWORK_ETHEREUM_SEPOLIA: {
        defaultMessage: 'Ethereum Sepolia',
        id: 'TR_NETWORK_ETHEREUM_SEPOLIA',
    },
    TR_NETWORK_ETHEREUM_GOERLI: {
        defaultMessage: 'Ethereum Goerli',
        id: 'TR_NETWORK_ETHEREUM_GOERLI',
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
        defaultMessage: 'Passphrase length exceeds the allowed limit.',
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
            'You may be asked to type some words that are not part of your recovery seed.',
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
            'If you want to recover an existing wallet, you can do so with your recovery seed. Select the number of words in your recovery seed.',
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
        defaultMessage: 'Perform a simulated recovery to verify your recovery seed.',
        id: 'TR_CHECK_RECOVERY_SEED_DESCRIPTION',
    },
    TR_RECOVERY_TYPES_DESCRIPTION: {
        defaultMessage:
            'Both methods are secure; advanced recovery allows you to input your recovery seed using your Trezor screen and takes longer.',
        description:
            'There are two methods of recovery for T1B1. This is a short explanation text.',
        id: 'TR_RECOVERY_TYPES_DESCRIPTION',
    },
    TR_REMEMBER_ALLOWS_YOU_TO: {
        defaultMessage:
            'Stores wallet for watch-only mode. You will see your wallet even if your Trezor is disconnected.',
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
            "You've successfully set up your Trezor and created your wallet. You should never use your Trezor without backing it up: it is the only way to recover a lost wallet.",
        description: 'Text in security page',
        id: 'TR_SECURITY_SUBHEADING',
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
        defaultMessage: "You can't change Device settings in this state",
        id: 'TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_UNAVAILABLE',
    },
    TR_SETTINGS_COINS_BANNER_DESCRIPTION_REMEMBERED_DISCONNECTED: {
        defaultMessage: 'Connect device to change Crypto settings',
        id: 'TR_SETTINGS_COINS_BANNER_DESCRIPTION_REMEMBERED_DISCONNECTED',
    },
    TR_SETTINGS_DEVICE_BANNER_TITLE_BOOTLOADER: {
        defaultMessage: 'Other settings unavailable in bootloader mode',
        id: 'TR_SETTINGS_DEVICE_BANNER_TITLE_BOOTLOADER',
    },
    TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED: {
        defaultMessage: 'Connect your Trezor to change Device settings',
        id: 'TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED',
    },
    TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_BOOTLOADER_NO_BUTTONS: {
        defaultMessage:
            'Reconnect the device without holding any buttons to access all other settings.',
        id: 'TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_BOOTLOADER_NO_BUTTONS',
    },
    TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_BOOTLOADER_NO_TOUCH: {
        defaultMessage:
            'Reconnect the device without touching the screen to access all other settings.',
        id: 'TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_BOOTLOADER_NO_TOUCH',
    },
    TR_SETTINGS_COINS_REGULAR_FIRMWARE_SUGGESTION: {
        defaultMessage: 'To access more coins, install <button>{regular}</button> firmware.',
        id: 'TR_SETTINGS_COINS_REGULAR_FIRMWARE_SUGGESTION',
    },
    TR_SETTINGS_COINS_BITCOIN_ONLY_FIRMWARE_SUGGESTION: {
        defaultMessage:
            'If you only need Bitcoin wallet operations, you can install the <button>{bitcoinOnly}</button> firmware.',
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
    },
    TR_SHOW_UNVERIFIED_XPUB: {
        defaultMessage: 'Show unverified public key',
        id: 'TR_SHOW_UNVERIFIED_XPUB',
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
        defaultMessage: 'Check <b>{deviceLabel}</b> screen for the keypad layout.',
        id: 'TR_THE_PIN_LAYOUT_IS_DISPLAYED',
    },
    TR_THIS_HIDDEN_WALLET_IS_EMPTY: {
        defaultMessage:
            'This hidden wallet is empty. To make sure you are in the correct hidden wallet, please type the passphrase again.',
        id: 'TR_THIS_HIDDEN_WALLET_IS_EMPTY',
    },
    TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE: {
        defaultMessage:
            'This hidden wallet is empty. To make sure you are in the correct hidden wallet, please re-enter the passphrase on your Trezor.',
        id: 'TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE',
    },
    TR_TO_FIND_YOUR_ACCOUNTS_AND: {
        defaultMessage: 'Trezor is running a coin discovery check to find your accounts and funds.',
        id: 'TR_TO_FIND_YOUR_ACCOUNTS_AND',
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
    TR_WELCOME_TO_TREZOR_TEXT_WALLET_CREATION: {
        defaultMessage:
            'Create a new wallet or recover one from a backup using your recovery seed.',
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
            'Factory reset wipes the device memory, erasing all information including the recovery seed and PIN. Only perform a factory reset if you have a safe offline backup of your recovery seed, which allows you to restore your funds.',
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
    TR_YOUR_FIRMWARE_VERSION: {
        defaultMessage: 'Your firmware version is {version}',
        id: 'TR_YOUR_FIRMWARE_VERSION',
    },
    TR_YOUR_FIRMWARE_TYPE: {
        defaultMessage: 'Your firmware type is {version}',
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
            'Pay to script hash (P2SH) is an advanced type of transaction used in bitcoin and other similar cryptocurrencies. Unlike P2PKH, it allows the sender to commit funds to a hash of an arbitrary valid script.',
    },
    TR_ACCOUNT_TYPE_BIP44_DESC: {
        id: 'TR_ACCOUNT_TYPE_BIP44_DESC',
        defaultMessage:
            'Legacy Pay to Public Key Hash (P2PKH) is the basic type of transaction used in bitcoin and other similar cryptocurrencies.',
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
        defaultMessage: 'What is a coinjoin account?',
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
        defaultMessage: 'No notifications',
    },
    NOTIFICATIONS_EMPTY_DESC: {
        id: 'NOTIFICATIONS_EMPTY_DESC',
        defaultMessage: 'You will see all important notifications here.',
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
            "Enabling this will route all of Suite's traffic through the Tor network, increasing your privacy and security. Tor may take a while to load and initiate a connection.",
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
    TR_UNAVAILABLE_COINJOIN_AMOUNTS_TOO_SMALL: {
        id: 'TR_UNAVAILABLE_COINJOIN_AMOUNTS_TOO_SMALL',
        defaultMessage: 'Amounts are too small for coinjoin.',
    },
    TR_UNAVAILABLE_COINJOIN_NO_ANONYMITY_SET: {
        id: 'TR_UNAVAILABLE_COINJOIN_NO_ANONYMITY_SET',
        defaultMessage: 'Coinjoin cannot be initiated without setting the coin privacy levels.',
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
        defaultMessage: 'Enable Tor',
    },
    TR_TOR_SKIP: {
        id: 'TR_TOR_SKIP',
        defaultMessage: 'Skip',
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
            'Trezor Suite is bundled with Trezor Bridge. If you only use the Trezor Suite application, we recommend uninstalling Trezor Bridge in order to use the bundled one. If you are also using Trezor in your browser, updating Trezor Bridge is recommended.',
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
            'Resetting the device removes all its data. Reset your device only if you have a safe offline backup of your recovery seed, which allows you to restore your funds.',
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
            'I understand I must have a backup of my recovery seed in order to retain access to my funds',
    },
    TR_WIPE_DEVICE_CHECKBOX_2_DESCRIPTION: {
        id: 'TR_WIPE_DEVICE_CHECKBOX_2_DESCRIPTION',
        defaultMessage:
            "Your recovery seed (wallet backup) is absolutely essential for regaining access to your funds in case of device loss, theft, or damage. Without it, there's nothing anybody can do, not even Trezor Support. Write it down on paper or your recovery seed card and store it somewhere safe and secure. Just remember where you stashed it.",
    },
    TR_CANCEL: {
        id: 'TR_CANCEL',
        defaultMessage: 'Cancel',
    },
    TR_CANCELLED: {
        id: 'TR_CANCELLED',
        defaultMessage: 'Cancelled',
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
        defaultMessage: 'Not sure how the advanced method works?',
    },
    TR_CHECK_RECOVERY_SEED_DESC_T1B1: {
        id: 'TR_CHECK_RECOVERY_SEED_DESC_T1B1',
        defaultMessage:
            'Enter the words from your recovery seed here in the order displayed on your device. You may be asked to type some words that are not part of your recovery seed as an additional security measure.',
        dynamic: true,
    },
    TR_CHECK_RECOVERY_SEED_DESC_T2T1: {
        id: 'TR_CHECK_RECOVERY_SEED_DESC_T2T1',
        defaultMessage:
            'Your recovery seed (wallet backup) is entered using the touchscreen. This avoids exposing any of your sensitive information to a potentially insecure computer or web browser.',
        dynamic: true,
    },
    TR_CHECK_RECOVERY_SEED_DESC_T2B1: {
        id: 'TR_CHECK_RECOVERY_SEED_DESC_T2B1',
        defaultMessage:
            "Use the two-button pad to enter your recovery seed (wallet backup). By doing this, you're keeping all your sensitive info safe and sound, away from any shady or insecure computer or web browser.",
        dynamic: true,
    },
    TR_SELECT_NUMBER_OF_WORDS: {
        id: 'TR_SELECT_NUMBER_OF_WORDS',
        defaultMessage: 'Select the number of words in your recovery seed',
    },
    TR_SEED_BACKUP_LENGTH: {
        id: 'TR_SEED_BACKUP_LENGTH',
        defaultMessage: 'Your recovery seed may contain 12, 18, or 24 words.',
        dynamic: true,
    },
    TR_SEED_BACKUP_LENGTH_INCLUDING_SHAMIR: {
        id: 'TR_SEED_BACKUP_LENGTH_INCLUDING_SHAMIR',
        defaultMessage: 'Your recovery seed may contain 12, 18, 20, 24, or 33 words.',
        dynamic: true,
    },
    TR_ENTER_ALL_WORDS_IN_CORRECT: {
        id: 'TR_ENTER_ALL_WORDS_IN_CORRECT',
        defaultMessage: 'Enter all words in the correct order',
    },
    TR_SEED_WORDS_ENTER_COMPUTER: {
        id: 'TR_SEED_WORDS_ENTER_COMPUTER',
        defaultMessage:
            'Enter the words from your recovery seed in the order displayed on your Trezor.',
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
        defaultMessage: 'Recovery seed successfully checked!',
    },
    TR_SEED_CHECK_SUCCESS_DESC: {
        id: 'TR_SEED_CHECK_SUCCESS_DESC',
        defaultMessage:
            'Your recovery seed is valid and has just been successfully verified. Take great care of it and store it in a safe, memorable location.',
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
        defaultMessage: 'Coinjoin account only available on Trezor Suite desktop app.',
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
        defaultMessage: 'Connect your device to add new accounts.',
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
    RECEIVE_ADDRESS_COINJOIN_DISALLOW: {
        id: 'RECEIVE_ADDRESS_COINJOIN_DISALLOW',
        defaultMessage:
            'To create additional addresses for a coinjoin account, you must ensure that you have already received bitcoin at the initial address.',
    },
    RECEIVE_ADDRESS_LIMIT_REACHED: {
        id: 'RECEIVE_ADDRESS_LIMIT_REACHED',
        defaultMessage: "You've reached the maximum limit of 20 fresh, unused addresses",
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
    TR_RECOVERY_SEED_IS_OFFLINE: {
        id: 'TR_RECOVERY_SEED_IS_OFFLINE',
        defaultMessage: 'Recovery seed (wallet backup) is an offline backup of your wallet',
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
            "This is the account where you'll find your coins once the transaction is finished.",
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
        defaultMessage: 'Reboot your Trezor in bootloader mode',
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
        defaultMessage: 'Do you have your recovery seed (wallet backup)?',
    },
    TR_BEFORE_ANY_FURTHER_ACTIONS: {
        id: 'TR_BEFORE_ANY_FURTHER_ACTIONS',
        defaultMessage:
            'Although unlikely, there might be a situation where you have to access your recovery seed in case of a firmware update issue.',
    },
    TR_CONTINUE_ONLY_WITH_SEED: {
        id: 'TR_CONTINUE_ONLY_WITH_SEED',
        defaultMessage: 'Continue only if you have your recovery seed',
    },
    TR_CONTINUE_ONLY_WITH_SEED_DESCRIPTION: {
        id: 'TR_CONTINUE_ONLY_WITH_SEED_DESCRIPTION',
        defaultMessage:
            "If you don't have your recovery seed, not even Trezor Support can help you recover your funds if your device is reset. If you have multiple recovery seeds, please make sure that you have the correct one ready and easily accessible to recover this specific Trezor device.",
    },
    TR_CONTINUE_ONLY_WITH_SEED_DESCRIPTION_2: {
        id: 'TR_CONTINUE_ONLY_WITH_SEED_DESCRIPTION_2',
        defaultMessage:
            'Before you continue, <button>check your backup in Settings</button>. This is an easy way to check and verify your recovery seed.',
    },
    TR_SWITCH_FIRMWARE_NO_BACKUP: {
        id: 'TR_SWITCH_FIRMWARE_NO_BACKUP',
        defaultMessage:
            "If you don't have your recovery seed, not even Trezor Support can help you recover your funds if your device is reset. If you have multiple recovery seeds, please make sure that you have the correct one ready and easily accessible to recover this specific Trezor device.",
    },
    TR_SWITCH_FIRMWARE_NO_BACKUP_2: {
        id: 'TR_SWITCH_FIRMWARE_NO_BACKUP_2',
        defaultMessage:
            'Before you continue, <button>check your backup in Settings</button>. This is an easy way to check and verify your recovery seed.',
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
            'To regain access to your coins, you must <b>recover your wallet using your recovery seed</b>. Ensure your recovery seed is accessible and legible.',
    },
    TR_FIRMWARE_SWITCH_WARNING_3: {
        id: 'TR_FIRMWARE_SWITCH_WARNING_3',
        defaultMessage:
            "If you don't have your recovery seed, there's no way to recover your coins!",
    },
    TR_READ_AND_UNDERSTOOD: {
        id: 'TR_READ_AND_UNDERSTOOD',
        defaultMessage: "I've read and understood the above",
    },
    TR_WIPE_AND_REINSTALL: {
        id: 'TR_WIPE_AND_REINSTALL',
        defaultMessage: 'Wipe device & reinstall',
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
        defaultMessage: 'Your device is in seedless mode and cannot be used with this wallet.',
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
    TR_UNREADABLE_EXPLAINED: {
        id: 'TR_UNREADABLE_EXPLAINED',
        defaultMessage:
            'We cannot see details about your Trezor device. It may be running old firmware, or another USB device may be interfering. To make communication possible, you will need to install Trezor Bridge.',
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
            'Make sure no one can peek over your shoulder and no cameras can see your screen. No one should ever see your recovery seed except you.',
    },
    TR_I_UNDERSTAND_SEED_IS_IMPORTANT: {
        id: 'TR_I_UNDERSTAND_SEED_IS_IMPORTANT',
        defaultMessage: 'You are responsible for keeping your backup safe',
    },
    TR_BACKUP_SEED_IS_ULTIMATE: {
        id: 'TR_BACKUP_SEED_IS_ULTIMATE',
        defaultMessage:
            "If you ever need to restore your wallet to access your funds, it's necessary to have your recovery seed (wallet backup) by your side. Don’t lose or misplace it. Once it's gone, it's gone. No one can help you recover it, not even Trezor Support. So, be responsible and make sure you keep your recovery seed tucked away like your life depends on it.",
    },
    TR_FIRMWARE_IS_POTENTIALLY_RISKY: {
        id: 'TR_FIRMWARE_IS_POTENTIALLY_RISKY',
        defaultMessage:
            'Updating firmware is a potentially risky operation. If anything goes wrong (broken cable etc.) the device might end up in a wiped state, which means you will have to recover the wallet using your recovery seed backup.',
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
        defaultMessage: 'Advanced Shamir Backup',
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
            'A new firmware version is available. You can either update your device now or continue and update it later.',
    },
    TR_FIRMWARE_REINSTALL_FW_DESCRIPTION: {
        id: 'TR_FIRMWARE_REINSTALL_FW_DESCRIPTION',
        defaultMessage:
            'Your device is already updated to the latest firmware. You may reinstall the firmware if needed.',
    },
    TR_SWITCH_TO_BITCOIN_ONLY_DESCRIPTION: {
        id: 'TR_SWITCH_TO_BITCOIN_ONLY_DESCRIPTION',
        defaultMessage:
            '{bitcoinOnly} firmware only works with Bitcoin transactions. If you want to access and manage all of your coins, just switch your device firmware back to {regular} anytime by using your recovery seed.',
    },
    TR_SWITCH_TO_REGULAR_DESCRIPTION: {
        id: 'TR_SWITCH_TO_REGULAR_DESCRIPTION',
        defaultMessage:
            "{regular} firmware allows your device to access and manage all of your coins. {bitcoinOnly} firmware only works with Bitcoin transactions. You can change your device's firmware at anytime by using your recovery seed.",
    },
    TR_BITCOIN_ONLY_UNAVAILABLE: {
        id: 'TR_BITCOIN_ONLY_UNAVAILABLE',
        defaultMessage:
            'Before switching to {bitcoinOnly}, you need to upgrade your firmware to the latest version.',
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
        defaultMessage: 'Click "Leave" to stop looking for beta releases',
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
            'In case of communication with our support team, the log contains all necessary technical info',
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
            'Connected device has already been backed up. You should have the recovery seed written down and hidden in a safe place.',
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
    TR_NAV_P2P: {
        id: 'TR_NAV_P2P',
        defaultMessage: 'Buy P2P',
    },
    TR_NAV_SAVINGS: {
        id: 'TR_NAV_SAVINGS',
        defaultMessage: 'Save {cryptoCurrencyName}',
    },
    TR_NAV_SAVINGS_BADGE: {
        id: 'TR_NAV_SAVINGS_BADGE',
        defaultMessage: 'New',
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
    TR_UNSUPPORTED_ADDRESS_FORMAT: {
        defaultMessage: 'Unsupported address format.',
        id: 'TR_UNSUPPORTED_ADDRESS_FORMAT',
    },
    TR_CONVERT_TO_LOWERCASE: {
        defaultMessage: 'Convert to lowercase',
        id: 'TR_CONVERT_TO_LOWERCASE',
    },
    TR_CONVERT_TO_CHECKSUM_ADDRESS: {
        defaultMessage: 'Convert to checksum address',
        id: 'TR_CONVERT_TO_CHECKSUM_ADDRESS',
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
        defaultMessage: 'Send max',
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
    AMOUNT_IS_NOT_SET: {
        defaultMessage: 'Amount is not set',
        id: 'AMOUNT_IS_NOT_SET',
    },
    AMOUNT_IS_TOO_LOW: {
        defaultMessage: 'Amount is too low',
        id: 'AMOUNT_IS_TOO_LOW',
    },
    AMOUNT_IS_BELOW_DUST: {
        defaultMessage: 'Amount must be greater than or equal to the dust limit ({dust})',
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
            'Destination tag is a unique code to identify the receiver of a transaction.',
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
        defaultMessage: 'Send raw',
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
    MAX_FEE: {
        defaultMessage: 'Maximum fee',
        description: 'Label in Send form for Ethereum network type',
        id: 'MAX_FEE',
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
        defaultMessage:
            'How much do you want to spend on fees to make this transaction go through.',
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
            'Your labeling is synced with a cloud storage provider. Your data are safe, as only your Trezor can decrypt them.',
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
            'To make your labels persistent and available on different devices connect to a cloud storage provider.',
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
            'Please select a cloud provider for saving your labels. Your data is encrypted by Trezor.',
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
    TR_UPDATE_FIRMWARE_HOMESCREEN_LATER_TOOLTIP: {
        id: 'TR_UPDATE_FIRMWARE_HOMESCREEN_LATER_TOOLTIP',
        defaultMessage:
            'Firmware update required. You can change your homescreen in the settings page later',
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
            'The backup process has failed. It is highly recommended to back up your wallet. Please follow the link to learn how to create a recovery seed to back up your wallet.',
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
    FIRMWARE_CONNECT_IN_NORMAL_MODEL_NO_BUTTON: {
        id: 'FIRMWARE_CONNECT_IN_NORMAL_MODEL_NO_BUTTON',
        defaultMessage: 'Do not hold any buttons while connecting the cable.',
    },
    FIRMWARE_CONNECT_IN_NORMAL_MODEL_NO_TOUCH: {
        id: 'FIRMWARE_CONNECT_IN_NORMAL_MODEL_NO_TOUCH',
        defaultMessage:
            "Please make sure you're not touching the display while connecting the device.",
    },
    TR_TAKES_N_MINUTES: {
        id: 'TR_TAKES_N_MINUTES',
        defaultMessage: 'Takes <{n} mins',
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
    TR_TODAY_DATE: {
        id: 'TR_TODAY_DATE',
        defaultMessage: 'Today, {date}',
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
    TR_UPDATE_MODAL_UPDATE_ON_QUIT: {
        id: 'TR_UPDATE_MODAL_UPDATE_ON_QUIT',
        defaultMessage: 'Update on quit',
    },
    TR_BACKGROUND_DOWNLOAD: {
        id: 'TR_BACKGROUND_DOWNLOAD',
        defaultMessage: 'Download in the background',
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
        defaultMessage:
            'Your recovery seed (wallet backup) lets you recover your funds in case of Trezor loss or damage.',
    },
    TR_BACKUP_CHECKBOX_1_DESCRIPTION: {
        id: 'TR_BACKUP_CHECKBOX_1_DESCRIPTION',
        defaultMessage:
            'Make sure you recorded each word in the exact order it was given to you. Do not let your recovery seed card get wet or smudged.',
    },
    TR_BACKUP_CHECKBOX_2_TITLE: {
        id: 'TR_BACKUP_CHECKBOX_2_TITLE',
        defaultMessage: 'Never take a picture or make a digital copy of your backup.',
    },
    TR_BACKUP_CHECKBOX_2_DESCRIPTION: {
        id: 'TR_BACKUP_CHECKBOX_2_DESCRIPTION',
        defaultMessage:
            "Don't save your recovery seed on your phone or on any device that could be hacked, including a cloud service.",
    },
    TR_BACKUP_CHECKBOX_3_TITLE: {
        id: 'TR_BACKUP_CHECKBOX_3_TITLE',
        defaultMessage:
            'Store your recovery seed (wallet backup) securely and never share it with anyone.',
    },
    TR_BACKUP_CHECKBOX_3_DESCRIPTION: {
        id: 'TR_BACKUP_CHECKBOX_3_DESCRIPTION',
        defaultMessage:
            'Hide it well and use proper safeguards to ensure that you are the only person who ever sees your recovery seed.',
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
            'Tip: You can exclude an amount by using the exclamation mark and equal symbols together (!=). For example <strong>!= -0.01</strong> will show all transactions except the ones with an amount of -0.01.',
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
            'Tip: You can display results matching at least one of multiple searches by grouping them with the OR operator (|). For example <strong>2022-12-31 | 2023-01-01</strong> will show all transactions that have happened on the 31st of December 2022 or the 1st of January 2023.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_9: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_9',
        defaultMessage:
            'Tip: You can display results matching multiple searches by grouping them with the AND operator (&). For example <strong>> 2020-12-01 & < 2020-12-31 & > 0</strong> will show all incoming (amount higher than 0) transactions in December 2020.',
    },
    TR_TRANSACTIONS_SEARCH_TIP_10: {
        id: 'TR_TRANSACTIONS_SEARCH_TIP_10',
        defaultMessage:
            'Tip: You can combine AND (&) and OR (|) operators for more complex searches. For example <strong>> 2022-01-01 & < 2022-01-31 | > 2022-12-01 & < 2022-12-31</strong> will show all transactions in January 2022 or December 2022.',
    },
    TR_INTERNAL_TRANSACTIONS: {
        id: 'TR_INTERNAL_TRANSACTIONS',
        defaultMessage: 'Internal Transfers',
    },
    TR_TOKEN_TRANSFERS: {
        id: 'TR_TOKEN_TRANSFERS',
        defaultMessage: '{standard} Token Transfers',
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
        defaultMessage: 'Not final',
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
        defaultMessage: 'Is something wrong?',
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
        defaultMessage: 'Connect with the Trezor community',
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
        defaultMessage: 'Go to device settings',
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
        defaultMessage: 'My device was bought from the official Trezor Shop or a trusted reseller.',
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
    TR_DISCONNECT_DEVICE_SOFT: {
        id: 'TR_DISCONNECT_DEVICE_SOFT',
        defaultMessage: 'Disconnect your device from your laptop or computer.',
    },
    TR_AVOID_USING_DEVICE_SOFT: {
        id: 'TR_AVOID_USING_DEVICE_SOFT',
        defaultMessage: 'Avoid using this device or sending any funds to it.',
    },
    TR_USE_CHAT_SOFT: {
        id: 'TR_USE_CHAT_SOFT',
        defaultMessage: 'Click below and use the <b>Chat</b> option on the next screen.',
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
    TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_HEADING: {
        id: 'TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_HEADING',
        defaultMessage: 'Essential to understand',
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
    TR_ONBOARDING_COINS_STEP: {
        id: 'TR_ONBOARDING_COINS_STEP',
        defaultMessage: 'Activate coins',
    },
    TR_ONBOARDING_COINS_STEP_DESCRIPTION: {
        id: 'TR_ONBOARDING_COINS_STEP_DESCRIPTION',
        defaultMessage:
            'Select which coins to show in Trezor Suite. You can change this setting anytime. Some coins are ERC20 tokens and can be used by enabling Ethereum below.',
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
        defaultMessage: 'Try restarting your computer',
    },
    TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_DESCRIPTION: {
        id: 'TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_DESCRIPTION',
        defaultMessage: 'Just in case',
    },
    TR_TROUBLESHOOTING_UNREADABLE_WEBUSB: {
        id: 'TR_TROUBLESHOOTING_UNREADABLE_WEBUSB',
        defaultMessage:
            'Your device is connected properly, but your internet browser cannot communicate with it at the moment. You will need to install Trezor Bridge.',
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
            'Devices set up in seedless mode cannot access Trezor Suite. This is to avoid irreversible coin loss, which happens when using an improperly setup device for the wrong purpose.',
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
    TR_FIRMWARE_HASH_MISMATCH: {
        id: 'TR_FIRMWARE_HASH_MISMATCH',
        defaultMessage:
            'Your Trezor is running unofficial firmware. Please contact help@trezor.io immediately.',
    },
    TR_TO_SATOSHIS: {
        id: 'TR_TO_SATOSHIS',
        defaultMessage: 'To sat',
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
    TR_FEE_ROUNDING_WARNING: {
        id: 'TR_FEE_ROUNDING_WARNING',
        defaultMessage: 'Your Trezor may display a different rate caused by fee rounding.',
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
    TR_LOADING_FACT_TITLE: {
        id: 'TR_LOADING_FACT_TITLE',
        defaultMessage: 'Did you know?',
    },
    TR_LOADING_FACT_0: {
        id: 'TR_LOADING_FACT_0',
        description: '140 symbols max',
        defaultMessage:
            'Private funds will be hidden after you leave Trezor Suite. To find them again, use the “Hidden funds” button.',
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
            "To coinjoin you pay a fee to the coordinator of 0.3%. If you receive bitcoin from someone who uses coinjoin, then you don't need to pay the coordinator fee.",
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
        defaultMessage: 'One Bitcoin is equivalent to 100M satoshis (sats).',
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
            'Coinjoin is a collaborative bitcoin transaction, in which you mix your bitcoin together with hundreds of others.',
    },
    TR_LOADING_FACT_11: {
        id: 'TR_LOADING_FACT_11',
        description: '140 symbols max',
        defaultMessage: 'A coinjoin is a transaction with hundreds of inputs and outputs',
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
        defaultMessage: 'Coinjoin transactions require a minimum input of 5000 sats',
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
            "Bitcoin transactions are grouped together in 'blocks'. These blocks are organized in a chronological sequence comprising the blockchain",
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
            'The largest ever Bitcoin trade was 161,500 BTC in April 2020, making it worth about $1.1bn',
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
        description: '29 symbols max',
    },
    TR_SESSION_PHASE_COIN_SELECTION: {
        id: 'TR_SESSION_PHASE_COIN_SELECTION',
        defaultMessage: 'Choosing coins',
        description: '29 symbols max',
    },
    TR_SESSION_PHASE_ROUND_PAIRING: {
        id: 'TR_SESSION_PHASE_ROUND_PAIRING',
        defaultMessage: 'Selecting coins for the next round',
        description: '29 symbols max',
    },
    TR_SESSION_PHASE_COIN_REGISTRATION: {
        id: 'TR_SESSION_PHASE_COIN_REGISTRATION',
        defaultMessage: 'Registering coins',
        description: '29 symbols max',
    },
    TR_SESSION_ERROR_PHASE_MISSING_UTXOS: {
        id: 'TR_SESSION_ERROR_PHASE_MISSING_UTXOS',
        defaultMessage: 'Looking for available coins',
        description: '29 symbols max',
    },
    TR_SESSION_ERROR_PHASE_SKIPPING_ROUND: {
        id: 'TR_SESSION_ERROR_PHASE_SKIPPING_ROUND',
        defaultMessage: 'Skipping round',
        description: '29 symbols max',
    },
    TR_SESSION_ERROR_PHASE_RETRYING_PAIRING: {
        id: 'TR_SESSION_ERROR_PHASE_RETRYING_PAIRING',
        defaultMessage: 'Retrying pairing',
        description: '29 symbols max',
    },
    TR_SESSION_ERROR_PHASE_AFFILIATE_SERVERS_OFFLINE: {
        id: 'TR_SESSION_ERROR_PHASE_AFFILIATE_SERVERS_OFFLINE',
        defaultMessage: 'The coinjoin service is temporarily unavailable',
        description: '29 symbols max',
    },
    TR_SESSION_ERROR_PHASE_CRITICAL_ERROR: {
        id: 'TR_SESSION_ERROR_PHASE_CRITICAL_ERROR',
        defaultMessage: 'Critical error, stopping coinjoin.',
        description: '29 symbols max',
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
            'Coinjoin at least {crypto} {isAccountWithRate, select, true {(~{fiat})} false {} other {}} for the best results.',
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
    TR_PRICE: {
        id: 'TR_PRICE',
        defaultMessage: 'Price',
    },
});
