import type { NetworkIcon } from '@trezor/network-module-suite-common-types';
import type { SolanaNetworkSymbol } from '@trezor/network-solana/constants';
import { solanaAssets } from '@trezor/network-solana-assets';

export const solanaIcon: NetworkIcon<SolanaNetworkSymbol> = {
    getIcons: solanaAssets.getIcons,
    getTokenLogoIdentifiers: (_symbol, contract) => [contract],
};
