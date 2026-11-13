import { parseAsset } from '@trezor/blockchain-link-utils/src/blockfrost';
import { cardanoAssets } from '@trezor/network-cardano-assets';
import { supportedCardanoNetworks } from '@trezor/network-cardano-types';
import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { adaValidator, preloadCborDecode } from './addressValidator/cardanoAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';
import {
    type CardanoMessageSignerDeps,
    createCardanoMessageSigner,
} from './signVerify/createCardanoMessageSigner';

type CardanoSuiteCommonNetworkModuleDeps = CardanoMessageSignerDeps;

export const createCardanoSuiteCommonNetworkModule = (
    deps: CardanoSuiteCommonNetworkModuleDeps,
): SuiteCommonNetworkModule => {
    // Address validation is synchronous, so the legacy address decoder has to be ready before it.
    preloadCborDecode();

    return createNetworkModule(supportedCardanoNetworks, {
        icon: {
            ...cardanoAssets,
            getTokenLogoIdentifiers: (_symbol, contract) => [
                parseAsset(contract).policyId.toLowerCase(),
                contract,
            ],
        },
        addressValidator: adaValidator,
        getNetworkConfig,
        getAccountSyncInterval,
        messageSigner: createCardanoMessageSigner(deps),
    });
};
