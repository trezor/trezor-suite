import { createSelector } from 'reselect';

import type { NetworkConfigState } from '@trezor/network-module-types';

import { ZERO_ADDRESS } from './tokenIconUtils';
import {
    selectNetworkConfig,
    selectNetworkConfigByCoingeckoId,
} from '../../network-display/networkDisplaySelectors';

export const selectCoingeckoIdAndContractAddressIncludesNativeTokens: (
    state: NetworkConfigState,
    coingeckoId: string,
    contractAddresses: readonly string[] | undefined,
) => { coingeckoId: string; contractAddresses: readonly string[] } = createSelector(
    [
        (state: NetworkConfigState, coingeckoId: string) => {
            const mainNetworkSymbol = selectNetworkConfigByCoingeckoId(
                state,
                coingeckoId,
            )?.displaySymbol?.toLowerCase();

            return mainNetworkSymbol
                ? selectNetworkConfig(state, mainNetworkSymbol)?.tradeCryptoId
                : undefined;
        },
        (_state: NetworkConfigState, coingeckoId: string) => coingeckoId,
        (
            _state: NetworkConfigState,
            _coingeckoId: string,
            contractAddresses: readonly string[] | undefined,
        ) => contractAddresses,
    ],
    (nativeTradeCryptoId, coingeckoId, contractAddresses) => {
        const addresses = contractAddresses?.map(address => address ?? ZERO_ADDRESS) ?? [];
        const hasNative = addresses.length === 0 || addresses.includes(ZERO_ADDRESS);

        return {
            coingeckoId: hasNative ? (nativeTradeCryptoId ?? coingeckoId) : coingeckoId,
            contractAddresses: addresses.length ? addresses : [ZERO_ADDRESS],
        };
    },
);
