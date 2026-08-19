import { networks } from '@suite-common/wallet-config';

import { getSignedMessage } from './useCopySignedMessage';

const signed = {
    message: 'hello world',
    address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
    signature:
        'H2fLW/kaRvA9YKtLMuJZ4TQ5b9dTa0wpVqBLnGLPCFHVSp8Yn3ZoBoFmB2j8AzJZ0i9YZ8v1kKTvo1a6L1n2xUE=',
};

describe(getSignedMessage.name, () => {
    it('wraps the message, the address and the signature in the block a verifier is given', () => {
        expect(getSignedMessage(signed, networks.btc)).toBe(
            `-----BEGIN BITCOIN SIGNED MESSAGE-----
${signed.message}
-----BEGIN SIGNATURE-----
${signed.address}
${signed.signature}
-----END BITCOIN SIGNED MESSAGE-----`,
        );
    });

    it('has no block for a network that does not produce one, so only the signature is shown', () => {
        expect(getSignedMessage(signed, networks.ada)).toBeNull();
    });

    it('names the network in the header even when nothing says which it is', () => {
        expect(getSignedMessage(signed)).toContain('-----BEGIN  SIGNED MESSAGE-----');
    });
});
