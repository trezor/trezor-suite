import { type GetTrezorConnectDep } from '@trezor/connect-common';
import {
    type SignBitcoinMessageDep,
    type VerifyBitcoinMessageDep,
    createSignBitcoinMessage,
    createVerifyBitcoinMessage,
} from '@trezor/network-bitcoin-suite-common';
import {
    type SignCardanoMessageDep,
    createSignCardanoMessage,
} from '@trezor/network-cardano-suite-common';
import {
    type SignEthereumMessageDep,
    type VerifyEthereumMessageDep,
    createSignEthereumMessage,
    createVerifyEthereumMessage,
} from '@trezor/network-ethereum-suite-common';

export type SignVerifyCompositionRootDeps = GetTrezorConnectDep<
    | 'signMessage'
    | 'verifyMessage'
    | 'ethereumSignMessage'
    | 'ethereumVerifyMessage'
    | 'cardanoSignMessage'
>;

/** The network services that sign and verify messages, which the sign and verify thunks call. */
export type SignVerifyDep = SignBitcoinMessageDep &
    VerifyBitcoinMessageDep &
    SignEthereumMessageDep &
    VerifyEthereumMessageDep &
    SignCardanoMessageDep;

export const createSignVerifyCompositionRoot = (
    deps: SignVerifyCompositionRootDeps,
): SignVerifyDep => ({
    signBitcoinMessage: createSignBitcoinMessage(deps),
    verifyBitcoinMessage: createVerifyBitcoinMessage(deps),
    signEthereumMessage: createSignEthereumMessage(deps),
    verifyEthereumMessage: createVerifyEthereumMessage(deps),
    signCardanoMessage: createSignCardanoMessage(deps),
});
