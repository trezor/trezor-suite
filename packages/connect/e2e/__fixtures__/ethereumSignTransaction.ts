/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import commonFixtures from '../../../../submodules/trezor-common/tests/fixtures/ethereum/sign_tx.json';

const legacyResults: Record<string, LegacyResult[]> = {
    'Ledger Live legacy path': [
        {
            // 'Forbidden key path between these versions (T1B1 does not have starting fw, too much effort to find)
            rules: ['2.3.4-2.5.4', '<1.12.2'],
            success: false,
        },
    ],
    'EIP-7702 - Uniswap': [
        {
            // EIP-7702 (tx_type 4) added in firmware 2.10.0
            rules: ['<2.10.0'],
            success: false,
        },
    ],
    'Hoodi Testnet, testnet path': [
        {
            // Hoodi testnet (chain_id 560048) definitions sent from host since 2.6.0
            rules: ['<2.6.0'],
        },
    ],
};

export default {
    method: 'ethereumSignTransaction',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: commonFixtures.tests
        .flatMap(({ name, parameters, result, skip_models }: any) => {
            const isEIP7702 = parameters.tx_type === 4;
            const fixture: Fixture = {
                description: `${name} ${parameters.comment ?? ''}`,
                skip: skip_models?.includes('t1') ? ['1'] : undefined,
                // EIP-7702 requires safety_checks disabled on the device
                ...(isEIP7702 && {
                    setup: {
                        mnemonic: commonFixtures.setup.mnemonic,
                        settings: {
                            safety_checks: 2,
                        },
                    },
                }),
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
                legacyResults: legacyResults[name],
            };

            if (parameters.data) {
                fixture.params.transaction.data = parameters.data;
            }

            if (parameters.tx_type) {
                fixture.params.transaction.txType = parameters.tx_type;
            }

            return fixture;
        })
        // // Expect failure scenarios
        .concat([
            {
                description: 'new contract',
                params: {
                    path: "m/44'/60'/0'",
                    transaction: {
                        nonce: '0x1e240',
                        gasPrice: '0x4e20',
                        gasLimit: '0x4e20',
                        to: '',
                        value: '0xab54a98ceb1f0ad2',
                        chainId: 1,
                    },
                },
                result: false,
            },

            {
                description: 'gas overflow',
                params: {
                    path: "m/44'/60'/0'",
                    transaction: {
                        nonce: '0x1e240',
                        gasPrice: '0xffffffffffffffffffffffffffffffff',
                        gasLimit: '0xffffffffffffffffffffffffffffffff',
                        to: '0x1d1c328764a41bda0492b66baa30c4a339ff85ef',
                        value: '0xab54a98ceb1f0ad2',
                        chainId: 1,
                    },
                },
                result: false,
            },

            {
                description: 'no gas price',
                params: {
                    path: "m/44'/60'/0'",
                    transaction: {
                        nonce: '0x1e240',
                        gasLimit: '0x2710',
                        to: '0x1d1c328764a41bda0492b66baa30c4a339ff85ef',
                        value: '0xab54a98ceb1f0ad2',
                    },
                },
                result: false,
            },

            {
                description: 'no gas limit',
                params: {
                    path: "m/44'/60'/0'",
                    transaction: {
                        nonce: '0x1e240',
                        gasPrice: '0x2710',
                        to: '0x1d1c328764a41bda0492b66baa30c4a339ff85ef',
                        value: '0xab54a98ceb1f0ad2',
                    },
                },
                result: false,
            },

            {
                description: 'no nonce',
                params: {
                    path: "m/44'/60'/0'",
                    transaction: {
                        gasLimit: '0x2710',
                        to: '0x1d1c328764a41bda0492b66baa30c4a339ff85ef',
                        value: '0xab54a98ceb1f0ad2',
                    },
                },
                result: false,
            },
        ]),
} satisfies TestCase;
