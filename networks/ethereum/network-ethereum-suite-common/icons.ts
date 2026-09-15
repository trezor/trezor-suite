import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import { ethereumAssets } from '@trezor/network-ethereum-assets';
import type { NetworkIcon } from '@trezor/network-module-suite-common-types';

import { isWrappedNativeToken } from './src/wrappedNativeToken';

export const ethereumIcon: NetworkIcon<EthereumNetworkSymbol> = {
    getIcons: ethereumAssets.getIcons,
    isWrappedNativeToken,
    getTokenLogoIdentifiers: (_symbol, contract) => [contract.toLowerCase()],
};
