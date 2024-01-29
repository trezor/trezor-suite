import { arrayPartition } from '@trezor/utils/lib/arrayPartition';
// eslint-disable-next-line import/no-relative-packages
import commonFixtures from '../../../../submodules/trezor-common/tests/fixtures/ethereum/signmessage.json';

const [standardPathFixtures, nonstandardPathFixtures] = arrayPartition(
    commonFixtures.tests,
    ({ parameters }) => parameters.path.startsWith("m/44'/60'"),
);

export default {
    method: 'ethereumSignMessage',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: [
        ...standardPathFixtures.flatMap(({ parameters, result }) => ({
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
        ...nonstandardPathFixtures.flatMap(({ parameters, result }) => ({
            description: `non standard path ${parameters.path} => Forbidden key path`,
            params: {
                path: parameters.path,
                message: parameters.msg,
            },
            result: {
                address: result.address,
                signature: result.sig,
            },
            legacyResults: [
                {
                    // 'Forbidden key path between these versions (T1B1 does not have starting fw, too much effort to find)
                    rules: ['2.2.0-2.5.4', '<1.12.2'],
                    success: false,
                },
            ],
        })),
    ],
};
