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
): NetworkSignVerify<EthereumNetworkSymbol> => {
    const signEthereumMessage = createSignEthereumMessage(deps);
    const verifyEthereumMessage = createVerifyEthereumMessage(deps);

    return {
        signMessage: (_networkSymbol, params) => signEthereumMessage(params),
        verifyMessage: (_networkSymbol, params) => verifyEthereumMessage(params),
    };
};
