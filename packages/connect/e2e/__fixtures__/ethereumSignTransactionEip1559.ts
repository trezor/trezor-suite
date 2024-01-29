// eslint-disable-next-line import/no-relative-packages
import commonFixtures from '../../../../submodules/trezor-common/tests/fixtures/ethereum/sign_tx_eip1559.json';

const legacyResults: Record<string, LegacyResult[]> = {
    'Ledger Live legacy path': [
        {
            // 'Forbidden key path between these versions (T1B1 does not have starting fw, too much effort to find)
            rules: ['2.3.4-2.5.4', '<1.12.2'],
            success: false,
        },
    ],
};

const legacyResultsCommon = [
    {
        // ethereumSignTransactionEip1559 not supported below this version
        rules: ['<2.4.2', '<1.10.4'],
        success: false,
    },
];

export default {
    method: 'ethereumSignTransaction',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: commonFixtures.tests.flatMap(({ name, parameters, result }) => {
        const fixture: Fixture = {
            description: `Eip1559 ${name} ${parameters.comment ?? ''}`,
            params: {
                path: parameters.path,
                transaction: {
                    to: parameters.to_address,
                    chainId: parameters.chain_id,
                    value: parameters.value,
                    nonce: parameters.nonce,
                    gasLimit: parameters.gas_limit,
                    maxFeePerGas: parameters.max_gas_fee,
                    maxPriorityFeePerGas: parameters.max_priority_fee,
                },
            },
            result: {
                r: `0x${result.sig_r}`,
                s: `0x${result.sig_s}`,
                v: `0x${result.sig_v.toString(16)}`,
            },
            legacyResults: legacyResults[name] || legacyResultsCommon,

            // weird behavior on 2.2.0, always the first test times out with some emulator
            // error. the other tests that follow do pass.
            skip: ['2.2.0'],
        };

        if (parameters.data) {
            fixture.params.transaction.data = parameters.data;
        }

        return fixture;
    }),
};
