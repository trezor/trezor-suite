// Nostr is an experimental method not implemented on T1B1, and added to firmware
// in 2.9.3, so it is skipped on T1B1 and on firmware versions below 2.9.3.
const skip = ['1', '<2.9.3'];

// pubkey is the x-only (BIP-340) key derived per NIP-06 (m/44'/1237'/0'/0/0);
// id is the NIP-01 event id (sha256 of the serialized event). The BIP-340
// signature is not asserted because it is not deterministic, so only the
// deterministic fields are checked (matchObject ignores the extra signature).
const nostrSignEvent: TestCase = {
    method: 'nostrSignEvent',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'sign event (kind 1, no tags)',
            params: {
                __experimental: true,
                path: "m/44'/1237'/0'/0/0",
                created_at: 1700000000,
                kind: 1,
                tags: [],
                content: 'Hello from Trezor Suite e2e',
            },
            result: {
                pubkey: '43c7046ec40c56e989a45483fc5da41819f289cf1d047f1e51e46185a356cec5',
                id: '3a2dd8be3cf312a68322056052f2d56f7852e6f74444d076ddf97e90d8e2f522',
            },
            skip,
        },
        {
            description: 'invalid path',
            params: {
                __experimental: true,
                path: 'not-a-path',
                created_at: 1700000000,
                kind: 1,
                tags: [],
                content: 'Hello from Trezor Suite e2e',
            },
            result: false,
            skip,
        },
    ],
};

export default nostrSignEvent;
