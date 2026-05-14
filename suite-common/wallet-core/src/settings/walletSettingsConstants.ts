const SET_BASE_CURRENCY = '@wallet-settings/set-base-currency';
const SET_HIDE_BALANCE = '@wallet-settings/hide-balance';
const CHANGE_NETWORKS = '@wallet-settings/change-networks';
const FROM_STORAGE = '@wallet-settings/from-storage';
const SET_BITCOIN_AMOUNT_UNITS = '@suite/set-bitcoin-amount-units';
const TOGGLE_HIDE_SUSPICIOUS_TRANSACTIONS = '@wallet-settings/toggle-hide-suspicious-transactions';
const SET_DISCREET_MODE = '@wallet-settings/set-discreet-mode';
const CHANGE_COIN_VISIBILITY = '@wallet-settings/change-coin-visibility';
const SET_MEV_PROTECTION = '@wallet-settings/set-mev-protection';
const SET_NETWORK_RESERVE = '@wallet-settings/set-network-reserve';
const SET_AUTO_EJECT = '@wallet-settings/set-auto-eject';
const SET_ADDRESS_DISPLAY_TYPE = '@wallet-settings/set-address-display-type';

export const WALLET_SETTINGS = {
    SET_BASE_CURRENCY,
    SET_HIDE_BALANCE,
    CHANGE_NETWORKS,
    FROM_STORAGE,
    SET_BITCOIN_AMOUNT_UNITS,
    TOGGLE_HIDE_SUSPICIOUS_TRANSACTIONS,
    SET_DISCREET_MODE,
    CHANGE_COIN_VISIBILITY,
    SET_MEV_PROTECTION,
    SET_NETWORK_RESERVE,
    SET_AUTO_EJECT,
    SET_ADDRESS_DISPLAY_TYPE,
} as const;
