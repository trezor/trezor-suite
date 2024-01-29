// eslint-disable-next-line import/no-relative-packages
import commonFixtures from '../../../../submodules/trezor-common/tests/fixtures/ethereum/getaddress.json';

const legacyResults: Record<string, LegacyResult[]> = {
    'Ledger Live legacy path': [
        {
            // 'Forbidden key path between these versions (T1B1 does not have starting fw, too much effort to find)
            rules: ['2.3.4-2.5.4', '<1.12.2'],
            success: false,
        },
    ],
};

export default {
    method: 'ethereumGetAddress',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: [
        ...commonFixtures.tests.flatMap(({ parameters: params, result, name }) => ({
            description: params.path,
            params,
            result,
            legacyResults: name ? legacyResults[name] : undefined,
        })),

        {
            description: 'batch where each member loads definition',

            params: {
                bundle: [
                    {
                        path: "m/44'/6060'/0'/0/0",
                        showOnTrezor: true,
                    },
                    {
                        path: "m/44'/5718350'/0'/0/0",
                        showOnTrezor: true,
                    },
                ],
            },

            result: [
                {
                    address: '0xA26a450ef46a5f11a510eBA2119A3236fa0Aca92',
                    path: [2147483692, 2147489708, 2147483648, 0, 0],
                    serializedPath: "m/44'/6060'/0'/0/0",
                },
                {
                    address: '0xe432a7533D689ceed00B7EE91d9368b8A1693bD2',
                    path: [2147483692, 2153201998, 2147483648, 0, 0],
                    serializedPath: "m/44'/5718350'/0'/0/0",
                },
            ],
        },
    ],
};
