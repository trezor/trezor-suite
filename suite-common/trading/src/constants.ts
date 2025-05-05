import { CryptoId } from 'invity-api';

export const TRADING_PREFIX = '@trading';
export const TRADING_BUY_PREFIX = `${TRADING_PREFIX}-buy`;
export const TRADING_EXCHANGE_PREFIX = `${TRADING_PREFIX}-exchange`;
export const TRADING_SELL_PREFIX = `${TRADING_PREFIX}-sell`;

export const TRADING_THUNK_PREFIX = `${TRADING_PREFIX}/thunk`;
export const TRADING_BUY_THUNK_PREFIX = `${TRADING_BUY_PREFIX}/thunk`;
export const TRADING_EXCHANGE_THUNK_PREFIX = `${TRADING_EXCHANGE_PREFIX}/thunk`;
export const TRADING_SELL_THUNK_PREFIX = `${TRADING_SELL_PREFIX}/thunk`;

export const TRADING_DEFAULT_CRYPTO_CURRENCY = 'bitcoin' as CryptoId;
export const TRADING_DEFAULT_CRYPTO_SECONDARY_CURRENCY = 'ethereum' as CryptoId;
export const TRADING_DEFAULT_PAYMENT_METHOD = 'creditCard' as const;
export const TRADING_DEFAULT_FIAT_CURRENCY = 'eur' as const;

export const TRADING_EXCHANGE_RATE = 'rateType';
export const TRADING_EXCHANGE_RATE_FIXED = 'fixed';
export const TRADING_EXCHANGE_RATE_FLOATING = 'floating';

export const TRADING_EXCHANGE_FORM = 'exchangeType';
export const TRADING_EXCHANGE_FORM_CEX = 'CEX';
export const TRADING_EXCHANGE_FORM_DEX = 'DEX';

export const TRADING_FORM_OUTPUT_AMOUNT = 'outputs.0.amount';
export const TRADING_FORM_CRYPTO_TOKEN = 'outputs.0.token';
export const TRADING_FORM_OUTPUT_ADDRESS = 'outputs.0.address';
export const TRADING_FORM_OUTPUT_FIAT = 'outputs.0.fiat';
export const TRADING_FORM_OUTPUT_CURRENCY = 'outputs.0.currency';
export const TRADING_FORM_OUTPUT_MAX = 'setMaxOutputId';

export const TRADING_FORM_FIAT_INPUT = 'fiatInput';
export const TRADING_FORM_FIAT_CURRENCY_SELECT = 'currencySelect';
export const TRADING_FORM_CRYPTO_INPUT = 'cryptoInput';
export const TRADING_FORM_CRYPTO_CURRENCY_SELECT = 'cryptoSelect';
export const TRADING_FORM_COUNTRY_SELECT = 'countrySelect';
export const TRADING_FORM_PAYMENT_METHOD_SELECT = 'paymentMethod';
export const TRADING_FORM_AMOUNT_IN_CRYPTO = 'amountInCrypto';

export const TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT = 'sendCryptoSelect';
export const TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT = 'receiveCryptoSelect';

export const TRADING_EXCHANGE_COMPARATOR_RATE_FILTER = 'exchangeComparatorRateFilter';
export const TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_ALL = 'all';
export const TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_FIXED_CEX = 'fixedCex';
export const TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_FLOATING_CEX = 'floatingCex';
export const TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_DEX = 'dex';

export const TRADING_EXCHANGE_COMPARATOR_KYC_FILTER = 'exchangeComparatorKycFilter';
export const TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_ALL = 'all';
export const TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_NO_KYC = 'noKyc';

export const INVITY_API_RELOAD_DATA_AFTER_MS = 10 * 60 * 1000; // 10 minutes
export const INVITY_API_RELOAD_QUOTES_AFTER_SECONDS = 30;

export const CRYPTO_PLATFORM_SEPARATOR = '--';
/**
 * Used for L2 networks (e.g. base, op)
 */
export const CONTRACT_ADDRESS_FOR_NATIVE_TOKEN = '0x0000000000000000000000000000000000000000';
