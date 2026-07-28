import { loadCommonFixture } from './commonFixtures';

const commonFixtures = loadCommonFixture('ethereum/verifymessage.json');

const ethereumVerifyMessage: TestCase = {
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

export default ethereumVerifyMessage;
