import type { EthereumNetworkSymbol } from '@trezor/network-ethereum-types';
import type { NetworkSignVerify } from '@trezor/network-module-suite-common-types';

import {
    type SignEthereumMessageDeps,
    createSignEthereumMessage,
} from './createSignEthereumMessage';
import {
    type VerifyEthereumMessageDeps,
    createVerifyEthereumMessage,
} from './createVerifyEthereumMessage';

export type EthereumSignVerifyDeps = SignEthereumMessageDeps & VerifyEthereumMessageDeps;

export const createEthereumSignVerify = (
    deps: EthereumSignVerifyDeps,
): NetworkSignVerify<EthereumNetworkSymbol> => ({
    signMessage: createSignEthereumMessage(deps),
    verifyMessage: createVerifyEthereumMessage(deps),
});
