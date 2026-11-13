import type { MessageSigning, SignError } from './SignMessage';
import type { MessageVerification, VerifyError } from './VerifyMessage';

export type SignVerifyError = SignError | VerifyError;

/** Missing `verifyMessage` means the network signs but cannot verify. */
export type MessageSigner<TNetworkSymbol extends string> = MessageSigning<TNetworkSymbol> &
    MessageVerification<TNetworkSymbol>;
