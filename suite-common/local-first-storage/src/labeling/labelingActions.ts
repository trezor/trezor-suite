import { createAction } from '@reduxjs/toolkit';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor, WalletDescriptor } from '@suite-common/wallet-types';

export const LABELING_PREFIX = '@suite/labeling';

export const setWalletLabel = createAction(
    `${LABELING_PREFIX}/set-device-label`,
    (payload: { walletDescriptor: WalletDescriptor; label: string | null }) => ({ payload }),
);

export const setAccountLabel = createAction(
    `${LABELING_PREFIX}/set-account-label`,
    (payload: {
        walletDescriptor: WalletDescriptor;
        accountDescriptor: AccountDescriptor;
        networkSymbol: NetworkSymbol;
        label: string | null;
    }) => ({
        payload,
    }),
);

export const setAddressLabel = createAction(
    `${LABELING_PREFIX}/set-address-label`,
    (payload: { walletDescriptor: WalletDescriptor; address: string; label: string | null }) => ({
        payload,
    }),
);

export const setOutputLabel = createAction(
    `${LABELING_PREFIX}/set-output-label`,
    (payload: {
        walletDescriptor: WalletDescriptor;
        txId: string;
        outputIndex: number;
        label: string | null;
    }) => ({ payload }),
);

export const clearAllLabels = createAction(
    `${LABELING_PREFIX}/clear-all-labels`,
    (payload: { walletDescriptor: WalletDescriptor }) => ({ payload }),
);

export const updateLocaleFirstStorageEnabled = createAction(
    `${LABELING_PREFIX}/update-locale-first-storage-enabled`,
    (payload: { isEnabled: boolean }) => ({ payload }),
);

export const updateLocaleFirstStorageDebugEnabled = createAction(
    `${LABELING_PREFIX}/update-locale-first-storage-debug-enabled`,
    (payload: { isEnabled: boolean }) => ({ payload }),
);

export const updateisFeatureLocalFirstStorageAvailable = createAction(
    `${LABELING_PREFIX}/update-show-locale-first-storage`,
    (payload: { isShownInSettings: boolean }) => ({ payload }),
);

export const setLocalFirstStorageRelayUrl = createAction(
    `${LABELING_PREFIX}/set-local-first-storage-relay-url`,
    (payload: { url: string | null }) => ({ payload }),
);

export const labelingActions = {
    setWalletLabel,
    setAccountLabel,
    setAddressLabel,
    setOutputLabel,
    clearAllLabels,
    updateLocaleFirstStorageEnabled,
    updateLocaleFirstStorageDebugEnabled,
    updateisFeatureLocalFirstStorageAvailable,
    setLocalFirstStorageRelayUrl,
};
