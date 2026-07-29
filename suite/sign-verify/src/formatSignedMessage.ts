import type { SignedMessageData } from '@trezor/network-module-suite-types';

export const formatSignedMessage = (
    { message, address, signature }: SignedMessageData,
    network?: string,
) => `-----BEGIN ${network} SIGNED MESSAGE-----
${message}
-----BEGIN SIGNATURE-----
${address}
${signature}
-----END ${network} SIGNED MESSAGE-----`;
