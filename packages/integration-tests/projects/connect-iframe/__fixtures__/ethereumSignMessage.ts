import commonFixtures from '../../../../../submodules/trezor-common/tests/fixtures/ethereum/signmessage.json';

export default {
    method: 'ethereumSignMessage',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: commonFixtures.tests.flatMap(({ parameters, result }) => ({
        description: `${parameters.path} ${parameters.msg.substring(0, 30)}...`,
        params: {
            path: parameters.path,
            message: parameters.msg,
        },
        result: {
            address: result.address,
            signature: result.sig,
        },
    })),
};
