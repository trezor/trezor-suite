import type { NetworkSignMessage, SignError } from './NetworkSignMessage';
import type { NetworkVerifyMessage, VerifyError } from './NetworkVerifyMessage';

export type SignVerifyError = SignError | VerifyError;

export type NetworkSignVerify<TNetworkSymbol extends string> = NetworkSignMessage<TNetworkSymbol> &
    NetworkVerifyMessage<TNetworkSymbol>;
