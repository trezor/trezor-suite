import type { NetworkAssetsModule, NetworkIcon } from '@trezor/network-assets-types';
import type { CardanoAssetSymbol } from '@trezor/network-cardano-assets';
import { type CardanoNetworkSymbol, supportedCardanoNetworks } from '@trezor/network-cardano-types';
import { createNetworkIcon } from '@trezor/network-module-suite-common-types';

export type CardanoIconDeps = {
    cardanoAssets: NetworkAssetsModule<CardanoAssetSymbol>;
    parseAsset: (contract: string) => { policyId: string };
};

export const createCardanoIcon = (deps: CardanoIconDeps): NetworkIcon =>
    createNetworkIcon<CardanoNetworkSymbol>({
        supportedNetworks: supportedCardanoNetworks,
        assets: deps.cardanoAssets,
        getTokenLogoIdentifiers: (_symbol, contract) => [
            deps.parseAsset(contract).policyId.toLowerCase(),
            contract,
        ],
    });
