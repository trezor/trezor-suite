import commonFixtures from '../../../../../submodules/trezor-common/tests/fixtures/ethereum/sign_tx_eip155.json';

const legacyResults = {
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
};

export default {
    method: 'ethereumSignTransaction',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: commonFixtures.tests
        // exclude test using integer value higher than Number.maxSafeInteger
        .filter(f => !['max_uint64'].includes(f.name))
        .flatMap(({ name, parameters, result }) => {
            const fixture = {
                description: `Eip155 ${name} ${parameters.comment ?? ''}`,
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
