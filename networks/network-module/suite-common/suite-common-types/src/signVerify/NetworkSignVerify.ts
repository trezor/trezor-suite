import type { NetworkSignMessage, SignError } from './NetworkSignMessage';
import type { NetworkVerifyMessage, VerifyError } from './NetworkVerifyMessage';

export type SignVerifyError = SignError | VerifyError;

/**
 * A network's SignVerify: signing a message with an account's key to prove control of its address,
 * and verifying such a signature against an address.
 * Missing `verifyMessage` means the network signs but cannot verify.
 *
 * @see https://github.com/trezor/trezor-suite/blob/develop/docs/ubiquitous-language.md
 */
export type NetworkSignVerify<TNetworkSymbol extends string> = NetworkSignMessage<TNetworkSymbol> &
    NetworkVerifyMessage<TNetworkSymbol>;
