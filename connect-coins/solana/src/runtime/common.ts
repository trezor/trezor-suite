import {
    type Base64EncodedBytes,
    SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED,
    getBase64Encoder,
    isSolanaError,
} from '@solana/kit';

export { address } from '@solana/kit';

export const encodeBase64 = (bytes: Base64EncodedBytes) => getBase64Encoder().encode(bytes);

export const isConnectionClosedError = (error: any) =>
    isSolanaError(error, SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED);
