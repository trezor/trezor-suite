/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
// @ts-ignore
import commonFixtures from '../../../../submodules/trezor-common/tests/fixtures/ethereum/sign_typed_data.json';

const fixtures = commonFixtures.tests
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
