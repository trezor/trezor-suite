const SET_BASE_CURRENCY = '@wallet-settings/set-base-currency';
const FROM_STORAGE = '@wallet-settings/from-storage';
const SET_BITCOIN_AMOUNT_UNITS = '@suite/set-bitcoin-amount-units';
const SET_SUSPICIOUS_TRANSACTIONS_FILTER = '@wallet-settings/set-suspicious-transactions-filter';
const CHANGE_COIN_VISIBILITY = '@wallet-settings/change-coin-visibility';
const SET_MEV_PROTECTION = '@wallet-settings/set-mev-protection';
const SET_NETWORK_RESERVE = '@wallet-settings/set-network-reserve';
const SET_AUTO_EJECT = '@wallet-settings/set-auto-eject';
const SET_ADDRESS_DISPLAY_TYPE = '@wallet-settings/set-address-display-type';

export const WALLET_SETTINGS = {
    SET_BASE_CURRENCY,
    FROM_STORAGE,
    SET_BITCOIN_AMOUNT_UNITS,
    SET_SUSPICIOUS_TRANSACTIONS_FILTER,
    CHANGE_COIN_VISIBILITY,
    SET_MEV_PROTECTION,
    SET_NETWORK_RESERVE,
    SET_AUTO_EJECT,
    SET_ADDRESS_DISPLAY_TYPE,
} as const;
