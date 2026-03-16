import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { BaseCurrencyCode } from '@trezor/blockchain-link-types';

/** The dust threshold is in fiat (USD), as we want to detect economically meaningful dust-sized value movements */
export const DUST_PHISHING_THRESHOLD = '0.005';

/** Fiat currency code for the dust threshold amount  */
export const DUST_PHISHING_THRESHOLD_CURRENCY = 'usd' satisfies BaseCurrencyCode;

/** Transaction types that are not considered during phishing detection */
export const PHISHING_WHITELISTED_TX_TYPES: WalletAccountTransaction['type'][] = [
    'sent',
    'self',
    'contract',
];
