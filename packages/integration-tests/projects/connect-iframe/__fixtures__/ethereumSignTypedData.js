import commonFixtures from '../../../../../submodules/trezor-common/tests/fixtures/ethereum/sign_typed_data.json';

const fixtures = commonFixtures.tests.flatMap(({ name, parameters, result }) => {
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

    const fixture = {
        description: `${name} ${parameters.comment ?? ''}`,
        name,
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
