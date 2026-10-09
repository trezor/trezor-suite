import { type DeviceRootState } from '@suite-common/device';
import { type NetworkSymbol, getAssetName } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectVisibleDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

export type AssetsRootState = AccountsRootState & DeviceRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetsRootState>();

export const selectAssetTokenInfo = createMemoizedSelector(
    [
        selectVisibleDeviceAccountsByNetworkSymbol,
        (_state: AssetsRootState, _networkSymbol: NetworkSymbol, tokenContract?: TokenAddress) =>
            tokenContract,
    ],
    (accounts, tokenContract) => {
        if (!tokenContract) return null;

        const lowerCaseTokenContract = tokenContract.toLowerCase();

        for (const account of accounts) {
            const token = account.tokens?.find(
                accountToken => accountToken.contract.toLowerCase() === lowerCaseTokenContract,
            );

            if (token) return token;
        }

        return null;
    },
);

export const selectAssetName = createMemoizedSelector(
    [
        selectAssetTokenInfo,
        (_state: AssetsRootState, networkSymbol: NetworkSymbol) => networkSymbol,
    ],
    (token, networkSymbol) =>
        getAssetName({
            symbol: networkSymbol,
            tokenName: token?.name,
            tokenSymbol: token?.symbol,
        }),
);
