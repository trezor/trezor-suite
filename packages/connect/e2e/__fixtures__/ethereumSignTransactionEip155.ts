// eslint-disable-next-line import/no-relative-packages
import commonFixtures from '../../../../submodules/trezor-common/tests/fixtures/ethereum/sign_tx_eip155.json';

const legacyResults: Record<string, LegacyResult[]> = {
    Palm: [
        {
            rules: ['<2.4.2'],
            payload: {
                r: `0x0ecc50afef98c57adbbf633965419de191a31c326510fce4913a312b02457065`,
                s: `0x0b8b7267d2e09b5ce330dcd34579f36f01aa91745640d14bbcb017e924650517`,
                v: `0x542b8613e`,
            },
        },
    ],
    'Ledger Live legacy path': [
        {
            // 'Forbidden key path between these versions (T1B1 does not have starting fw, too much effort to find)
            rules: ['2.3.4-2.5.4', '<1.12.2'],
            success: false,
        },
    ],
};

// Legacy results for eth networks related fixtures
// historically, ethereum definitions used to be part of firwmares so it was expected that certain fw would
// not support certain eth network. With (I believe) 2.6.0, definitions are sent from host so we don't really need
// to care about support of particular networks.
[
    'Unknown_chain_id_testnet_path',
    'Ropsten',
    'Rinkeby',
    'max_chain_id',
    'max_chain_plus_one',
].forEach(fixture => {
    legacyResults[fixture] = [
        {
            rules: ['2.2.0'], // I am not sure about exact fw ranges here, so just lets use 2.2.0 which is the fw version we run legacy tests with
        },
    ];
});

export default {
    method: 'ethereumSignTransaction',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: commonFixtures.tests
        // exclude test using integer value higher than Number.maxSafeInteger
        .filter(f => !['max_uint64'].includes(f.name))
        .flatMap(({ name, parameters, result }) => {
            const fixture: Fixture = {
                description: `Eip155 ${name}`,
                params: {
                    path: parameters.path,
                    transaction: {
                        to: parameters.to_address,
                        chainId: parameters.chain_id,
                        value: parameters.value,
                        nonce: parameters.nonce,
                        gasLimit: parameters.gas_limit,
                        gasPrice: parameters.gas_price,
                    },
                },
                result: {
                    r: `0x${result.sig_r}`,
                    s: `0x${result.sig_s}`,
                    v: `0x${result.sig_v.toString(16)}`,
                },
            };
            const legacyResult = legacyResults[name];

            if (legacyResults) {
                fixture.legacyResults = legacyResult;
            }

            if (parameters.data) {
                fixture.params.transaction.data = parameters.data;
            }

            return fixture;
        }),
};
