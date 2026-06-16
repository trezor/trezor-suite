// Nostr is an experimental method not implemented on T1B1, and added to firmware
// in 2.9.3, so it is skipped on T1B1 and on firmware versions below 2.9.3.
const skip = ['1', '<2.9.3'];

// Expected x-only (BIP-340) public keys derived per NIP-06 (m/44'/1237'/<account>'/0/0).
export default {
    method: 'nostrGetPublicKey',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: "m/44'/1237'/0'/0/0",
            params: {
                __experimental: true,
                path: "m/44'/1237'/0'/0/0",
            },
            result: {
                pubkey: '43c7046ec40c56e989a45483fc5da41819f289cf1d047f1e51e46185a356cec5',
            },
            skip,
        },
        {
            description: "m/44'/1237'/1'/0/0",
            params: {
                __experimental: true,
                path: "m/44'/1237'/1'/0/0",
            },
            result: {
                pubkey: '33c2808e1480c09b5b2506d2b560b0eac3b2ca60a0922e5466103eb26533beb3',
            },
            skip,
        },
        {
            description: "m/44'/1237'/2'/0/0",
            params: {
                __experimental: true,
                path: "m/44'/1237'/2'/0/0",
            },
            result: {
                pubkey: 'bd1202d0084edb1a6d8ae0499d62c2d88b802f8a539dc257cd72b76aab7487d9',
            },
            skip,
        },
        {
            description: 'invalid path',
            params: {
                __experimental: true,
                path: 'not-a-path',
            },
            result: false,
            skip,
        },
    ],
} satisfies TestCase;
