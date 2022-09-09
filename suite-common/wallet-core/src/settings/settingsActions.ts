import { createAction } from '@reduxjs/toolkit';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { FeeLevel, PROTO } from '@trezor/connect';
import { analytics, EventType } from '@trezor/suite-analytics';
import { UNIT_ABBREVIATIONS } from '@trezor/suite/libDev/src/hooks/wallet/useBitcoinAmountUnit';
import { WALLET_SETTINGS } from '@trezor/suite/libDev/src/actions/settings/constants';
import { WalletSettingsAction } from '@trezor/suite/libDev/src/actions/settings/walletSettingsActions';

export const settingsActionPrefix = '@common/wallet-core/settings';

// WALLET_SETTINGS.SET_LOCAL_CURRENCY,
const setLocalCurrency = createAction(
    `${settingsActionPrefix}/setLocalCurrency`,
    (localCurrency: string) => ({
        payload: {
            localCurrency: localCurrency.toLowerCase(),
        },
    }),
);

// WALLET_SETTINGS.CHANGE_NETWORKS,
const changeNetworks = createAction(
    `${settingsActionPrefix}/changeNetworks`,
    (payload: NetworkSymbol[]) => ({
        payload,
    }),
);

// WALLET_SETTINGS.SET_HIDE_BALANCE
const setHideBalance = createAction(
    `${settingsActionPrefix}/setHideBalance`,
    (toggled: boolean) => ({
        payload: {
            toggled,
        },
    }),
);

// WALLET_SETTINGS.SET_LAST_USED_FEE_LEVEL
const setLastUsedFeeLevel = createAction(
    `${settingsActionPrefix}/setLastUsedFeeLevel`,
    (symbol: NetworkSymbol, feeLevel?: FeeLevel) => ({
        payload: {
            symbol,
            feeLevel,
        },
    }),
);

// WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS
const setBitcoinAmountUnits = createAction(
    `${settingsActionPrefix}/setBitcoinAmountUnits`,
    (units: PROTO.AmountUnit) => ({
        payload: { units },
    }),
);

export const settingsActions = {
    setLocalCurrency,
    changeNetworks,
    setHideBalance,
    setLastUsedFeeLevel,
    setBitcoinAmountUnits,
} as const;
