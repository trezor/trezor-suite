import commonFixtures from '../../../../../submodules/trezor-common/tests/fixtures/ethereum/getaddress.json';

export default {
    method: 'ethereumGetAddress',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: commonFixtures.tests.flatMap(({ parameters: params, result }) => ({
        description: params.path,
        params,
        result,
    })),
};
