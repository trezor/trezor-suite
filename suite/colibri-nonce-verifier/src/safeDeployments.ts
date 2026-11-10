// Canonical Safe{Wallet} contracts on Ethereum mainnet. Every value here is a public, reproducible
// fact; the README ("Safe implementation resolution") lists the sources and how to re-derive them.

export const SafeProxyVersion = {
    V1_1_1: '1.1.1',
    V1_3_0: '1.3.0',
    V1_4_1: '1.4.1',
    V1_5_0: '1.5.0',
} as const;
export type SafeProxyVersion = (typeof SafeProxyVersion)[keyof typeof SafeProxyVersion];

/**
 * keccak256 of the runtime code of every proxy a canonical Safe proxy factory deploys. That code
 * answers `masterCopy()` from storage slot 0 and delegatecalls everything else to the address in
 * the low 20 bytes of slot 0, so a matching code hash is what makes slot 0 the implementation.
 * Taken from the `deployedBytecode` of the published build artifacts (`@gnosis.pm/safe-contracts`
 * 1.1.1 / 1.3.0, `@safe-global/safe-contracts` 1.4.1, `@safe-global/safe-smart-account` 1.5.0)
 * whose singleton and factory code hashes match `safe-global/safe-deployments`.
 */
export const SAFE_PROXY_CODE_HASHES: Readonly<Record<string, SafeProxyVersion>> = {
    '0xaea7d4252f6245f301e540cfbee27d3a88de543af8e49c5c62405d5499fab7e5': SafeProxyVersion.V1_1_1,
    '0xb89c1b3bdf2cf8827818646bce9a8f6e372885f8c55e5c07acbd307cb133b000': SafeProxyVersion.V1_3_0,
    '0xd7d408ebcd99b2b70be43e20253d6d92a8ea8fab29bd3be7f55b10032331fb4c': SafeProxyVersion.V1_4_1,
    '0x4e381985ca68b3e5d27b4425fa581c19cf33146d3f887a3cfca96f55528ea46f': SafeProxyVersion.V1_5_0,
};

// Storage slot 0 of a Safe proxy holds the singleton (`masterCopy`) address.
export const SAFE_SINGLETON_STORAGE_SLOT = `0x${'0'.repeat(64)}`;

export type SafeSingletonVersion = Exclude<SafeProxyVersion, '1.1.1'>;

export type SafeSingleton = {
    // Lowercase; the key display-format definitions are published under.
    address: string;
    version: SafeSingletonVersion;
    isL2: boolean;
    // ERC-7730 calldata descriptor in ethereum/clear-signing-erc7730-registry `registry/safe/`.
    erc7730Descriptor: string;
};

/**
 * The singletons whose calldata the ERC-7730 registry describes on chain 1 (registry revision
 * 3bebbd05cbc2d2d2bf9c41a8edbf5e5cc88e4eb4). Addresses come from the descriptors' deployment
 * lists and match `safe-global/safe-deployments` (canonical and, for 1.3.0, eip155 deployments).
 */
export const SAFE_SINGLETONS: readonly SafeSingleton[] = [
    {
        address: '0xd9db270c1b5e3bd161e8c8503c55ceabee709552',
        version: '1.3.0',
        isL2: false,
        erc7730Descriptor: 'calldata-Safe-1.3.0.json',
    },
    {
        address: '0x69f4d1788e39c87893c980c06edf4b7f686e2938',
        version: '1.3.0',
        isL2: false,
        erc7730Descriptor: 'calldata-Safe-1.3.0.json',
    },
    {
        address: '0x3e5c63644e683549055b9be8653de26e0b4cd36e',
        version: '1.3.0',
        isL2: true,
        erc7730Descriptor: 'calldata-SafeL2-1.3.0.json',
    },
    {
        address: '0xfb1bffc9d739b8d520daf37df666da4c687191ea',
        version: '1.3.0',
        isL2: true,
        erc7730Descriptor: 'calldata-SafeL2-1.3.0.json',
    },
    {
        address: '0x41675c099f32341bf84bfc5382af534df5c7461a',
        version: '1.4.1',
        isL2: false,
        erc7730Descriptor: 'calldata-Safe-1.4.1.json',
    },
    {
        address: '0x29fcb43b46531bca003ddc8fcb67ffe91900c762',
        version: '1.4.1',
        isL2: true,
        erc7730Descriptor: 'calldata-SafeL2-1.4.1.json',
    },
    {
        address: '0xff51a5898e281db6dfc7855790607438df2ca44b',
        version: '1.5.0',
        isL2: false,
        erc7730Descriptor: 'calldata-Safe-1.5.0.json',
    },
    {
        address: '0xedd160febbd92e350d4d398fb636302fccd67c7e',
        version: '1.5.0',
        isL2: true,
        erc7730Descriptor: 'calldata-SafeL2-1.5.0.json',
    },
];
