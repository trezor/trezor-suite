// eslint-disable-next-line import/no-relative-packages
import commonFixtures from '../../../../submodules/trezor-common/tests/fixtures/ethereum/verifymessage.json';

export default {
    method: 'ethereumVerifyMessage',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: commonFixtures.tests.flatMap(({ parameters }) => ({
        description: `${parameters.msg.substring(0, 30)}...`,
        params: {
            address: parameters.address,
            message: parameters.msg,
            signature: parameters.sig,
        },
        result: {
            message: 'Message verified',
        },
    })),
};
