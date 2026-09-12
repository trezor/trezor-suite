import { loadCommonFixture } from './commonFixtures';

const commonFixtures = loadCommonFixture('ethereum/sign_typed_data.json');

const ethereumDefinitionFixture = [
    {
        name: 'Wanchain',
        comment: 'Test ethereum definitions with path that is not included in device',
        parameters: {
            path: "m/44'/5718350'/0'/0/0",
            metamask_v4_compat: true,
            data: {
                types: {
                    EIP712Domain: [],
                },
                primaryType: 'EIP712Domain',
                message: {},
                domain: {},
            },
            message_hash: null,
            domain_separator_hash:
                '0x6192106f129ce05c9075d319c1fa6ea9b3ae37cbd0c1ef92e2be7137bb07baa1',
        },
        result: {
            address: '0xe432a7533D689ceed00B7EE91d9368b8A1693bD2',
            sig: '0xeaa70ecee5866fe463ecc03befecdbe04420b460cb872fa3179134572d4c5b454ab09ec98689b53ba1c652fcae8aa8fbd63186ee856649d8ecef6f9b31304b7d1c',
        },
    },
];

const fixtures = [...ethereumDefinitionFixture, ...commonFixtures.tests]
    .filter(
        f =>
            // TODO: probably newly added fixtures to trezor-common
            // https://github.com/trezor/trezor-suite/issues/5181
            !['array_of_structs', 'injective_testcase'].includes(f.name),
    )
    .flatMap(({ name, parameters, result }) => {
        let legacyResults = [
            {
                // ethereumSignTypedData support was only added in 2.4.3/1.10.5
                rules: ['<2.4.3', '<1.10.5'],
                success: false,
            },
        ];
        if (parameters.data.primaryType === 'EIP712Domain') {
            legacyResults = [
                {
                    // domain-only signTypedData not supported before this
                    rules: ['<2.4.4', '<1.10.6'],
                    success: false,
                },
            ];
        }

        // Upstream fixture has show_message_hash as a hash string,
        // but TrezorConnect API expects show_message_hash?: boolean.
        // Normalize: string → true, null/undefined → omit the key entirely.
        const { show_message_hash: rawShowHash, ...restParams } =
            parameters as typeof parameters & { show_message_hash?: string | null };
        const params =
            typeof rawShowHash === 'string'
                ? { ...restParams, show_message_hash: true }
                : restParams;

        const fixture: Fixture = {
            description: `${name}`,
            params,
            legacyResults,
            result: {
                address: result.address,
                signature: result.sig,
            },
        };

        // Parallel variant without precomputed domain_separator_hash / message_hash.
        // Connect 10 derives the hashes internally (required for T1B1 firmware,
        // ignored by core firmwares which compute from `data` on-device), so the
        // resulting signature must match the precomputed-hashes variant byte-for-byte.
        // This proves the same payload works across all supported models.
        // Skipped for v3-only fixtures (auto-compute supports v4 only, matching firmware).
        if (!parameters.metamask_v4_compat) {
            return fixture;
        }

        const {
            domain_separator_hash: _dsh,
            message_hash: _mh,
            ...paramsWithoutHashes
        } = params as typeof params & {
            domain_separator_hash?: string;
            message_hash?: string;
        };
        const autoComputeFixture: Fixture = {
            description: `${name} (auto-computed hashes)`,
            params: paramsWithoutHashes,
            legacyResults,
            result: {
                address: result.address,
                signature: result.sig,
            },
        };

        return [fixture, autoComputeFixture];
    });

const ethereumSignTypedData: TestCase = {
    method: 'ethereumSignTypedData',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: fixtures,
};

export default ethereumSignTypedData;
