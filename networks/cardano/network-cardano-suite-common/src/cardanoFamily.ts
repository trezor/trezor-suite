import { supportedCardanoNetworks } from '@trezor/network-cardano-types';
import { defineCapability, defineFamily } from '@trezor/network-module-suite-common-types';

import {
    type CardanoMessageSigningDeps,
    createCardanoMessageSigning,
} from './messageSigning/createCardanoMessageSigning';
import { getNetworkConfig } from './networkConfig';
import { cardanoSendOptions } from './sendOptions/cardanoSendOptions';

export type CardanoFamilyDeps = CardanoMessageSigningDeps;

export const cardanoFamily = defineFamily<CardanoFamilyDeps>()({
    family: 'cardano',
    symbols: supportedCardanoNetworks,
    getConfig: getNetworkConfig,
    capabilities: {
        messageSigning: defineCapability({
            requires: { feature: 'sign-verify' },
            create: createCardanoMessageSigning,
        }),
        sendOptions: defineCapability({ requires: {}, create: () => cardanoSendOptions }),
    },
});
