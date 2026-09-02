import { createAction } from '@reduxjs/toolkit';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AddressDisplayOptions,
    type SuspiciousTransactionsFilter,
} from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type PROTO } from '@trezor/connect';

import { WALLET_SETTINGS } from './walletSettingsConstants';

export const setBaseCurrency = createAction(
    WALLET_SETTINGS.SET_BASE_CURRENCY,
    (baseCurrencyCode: BaseCurrencyCode) => ({
        payload: {
            localCurrency: baseCurrencyCode.toLowerCase() as BaseCurrencyCode,
        },
    }),
);

export const changeNetworks = createAction(
    '@wallet-settings/change-networks',
    (payload: NetworkSymbol[]) => ({ payload }),
);

export const setMevProtection = createAction(
    WALLET_SETTINGS.SET_MEV_PROTECTION,
    (enabled: boolean) => ({
        payload: enabled,
    }),
);

export const setNetworkReserve = createAction(
    WALLET_SETTINGS.SET_NETWORK_RESERVE,
    (enabled: boolean) => ({ payload: enabled }),
);

export const setSuspiciousTransactionsFilter = createAction(
    WALLET_SETTINGS.SET_SUSPICIOUS_TRANSACTIONS_FILTER,
    (payload: { symbol: NetworkSymbol; filter: SuspiciousTransactionsFilter }) => ({ payload }),
);

export const setAutoEjectEnabled = createAction(
    WALLET_SETTINGS.SET_AUTO_EJECT,
    (enabled: boolean) => ({ payload: enabled }),
);

export const setAddressDisplayType = createAction(
    WALLET_SETTINGS.SET_ADDRESS_DISPLAY_TYPE,
    (value: AddressDisplayOptions) => ({ payload: value }),
);

export const changeCoinVisibilityEvent = createAction(
    WALLET_SETTINGS.CHANGE_COIN_VISIBILITY,
    (payload: { symbol: NetworkSymbol; shouldBeVisible: boolean }) => ({ payload }),
);

export const setBitcoinAmountUnits = createAction(
    WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS,
    (payload: PROTO.AmountUnit) => ({ payload }),
);
