// eslint-disable-next-line import/no-relative-packages
import commonFixtures from '../../../../submodules/trezor-common/tests/fixtures/ethereum/sign_typed_data.json';

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

        const fixture: Fixture = {
            description: `${name}`,
            params: parameters,
            legacyResults,
            result: {
                address: result.address,
                signature: result.sig,
            },
        };

        return fixture;
    });

export default {
    method: 'ethereumSignTypedData',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: fixtures,
};
