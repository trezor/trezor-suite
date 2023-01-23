import commonFixtures from '../../../../submodules/trezor-common/tests/fixtures/ethereum/signmessage.json';

export default {
    method: 'ethereumSignMessage',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
        settings: {
            safety_checks: 2,
        },
    },
    tests: commonFixtures.tests.flatMap(({ parameters, result }) => {
        // todo: update trezor-common with firmware ranges for fixtures so that we don't need to do it here in such a clumsy way
        const legacyResults =
            parameters.path === "m/45'/60/2/1/1"
                ? [
                      {
                          // allow-unsafe-paths is not available for lower versions
                          rules: ['<2.3.2', '1'],
                          success: false,
                      },
                  ]
                : [];
        return {
            description: `${parameters.path} ${parameters.msg.substring(0, 30)}...`,

            params: {
                path: parameters.path,
                message: parameters.msg,
            },
            result: {
                address: result.address,
                signature: result.sig,
            },
            legacyResults,
        };
    }),
};
