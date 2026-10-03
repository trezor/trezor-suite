import { parseAsset } from '@trezor/blockchain-link-utils/src/blockfrost';
import type { CardanoNetworkSymbol } from '@trezor/network-cardano/constants';
import { cardanoAssets } from '@trezor/network-cardano-assets';
import type { NetworkIcon } from '@trezor/network-module-suite-common-types';

export const cardanoIcon: NetworkIcon<CardanoNetworkSymbol> = {
    getIcons: cardanoAssets.getIcons,
    getTokenLogoIdentifiers: (_symbol, contract) => [
        parseAsset(contract).policyId.toLowerCase(),
        contract,
    ],
};
