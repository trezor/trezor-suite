import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';

import { type TokenInfoEntry, type TokenInfoRootState } from './tokenInfoTypes';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccountByKey } from '../accounts/accountsSelectors';

export const selectTokenInfoEntry = (
    state: TokenInfoRootState,
    symbol?: NetworkSymbol,
    contractAddress?: TokenAddress,
): TokenInfoEntry | undefined =>
    symbol && contractAddress
        ? state.wallet.tokenInfo?.[symbol]?.[contractAddress.toLowerCase() as TokenAddress]
        : undefined;

export const selectCachedTokenDecimals = (
    state: TokenInfoRootState,
    symbol?: NetworkSymbol,
    contractAddress?: TokenAddress,
): number | null => selectTokenInfoEntry(state, symbol, contractAddress)?.decimals ?? null;

export const selectTokenDecimals = (
    state: AccountsRootState & TokenInfoRootState,
    symbol?: NetworkSymbol,
    contractAddress?: TokenAddress,
    accountKey?: AccountKey,
): number | null => {
    if (!contractAddress) {
        return null;
    }

    if (accountKey) {
        const account = selectAccountByKey(state, accountKey);
        const lowerContract = contractAddress.toLowerCase();
        const held = account?.tokens?.find(token => token.contract.toLowerCase() === lowerContract);

        if (held?.decimals !== undefined) {
            return held.decimals;
        }
    }

    return selectCachedTokenDecimals(state, symbol, contractAddress);
};
