import commonFixtures from '../../../../submodules/trezor-common/tests/fixtures/ethereum/getaddress.json';

const legacyResults = {
    'Ledger Live legacy path': [
        {
            // 'Forbidden key path' below these versions
            rules: ['<2.5.4', '<1.12.2'],
            success: false,
        },
    ],
};

export default {
    method: 'ethereumGetAddress',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: commonFixtures.tests.flatMap(({ parameters: params, result, name }) => ({
        description: params.path,
        params,
        result,
        legacyResults: name ? legacyResults[name] : undefined,
    })),
};
