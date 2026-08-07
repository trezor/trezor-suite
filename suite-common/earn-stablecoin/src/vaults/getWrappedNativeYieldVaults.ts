import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol, getNetworkByYieldXyzId } from '@suite-common/wallet-config';
import { isYieldVaultOperational } from '@suite-common/wallet-core';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

type WrappedNativeVaultFields = Pick<YieldDtoV2, 'metadata' | 'network' | 'status' | 'token'>;

type GetWrappedNativeYieldVaultsParams<TVault extends WrappedNativeVaultFields> = {
    vaults: TVault[] | undefined;
    networkSymbol: NetworkSymbol;
};

/**
 * Deposit-open vaults taking the network's wrapped-native token — the native balance
 * can be wrapped on the way into them, so they represent the native coin's yield options.
 */
export const getWrappedNativeYieldVaults = <TVault extends WrappedNativeVaultFields>({
    vaults = [],
    networkSymbol,
}: GetWrappedNativeYieldVaultsParams<TVault>): TVault[] =>
    vaults.filter(
        vault =>
            isYieldVaultOperational(vault) &&
            vault.status.enter &&
            getNetworkByYieldXyzId(vault.network)?.symbol === networkSymbol &&
            isWrappedNativeToken(networkSymbol, vault.token.address),
    );
