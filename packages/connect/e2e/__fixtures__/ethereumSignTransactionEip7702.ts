import { loadCommonFixture } from './commonFixtures';

const commonFixtures = loadCommonFixture('ethereum/sign_tx_eip7702_mainnet.json');

// EIP-7702 transactions are experimental and unsupported on T1B1. The device additionally
// requires experimental features to be enabled, and authorizing a delegate (unlike revoking
// one) requires safety checks to be lowered - the whole case shares one emulator setup.
// The bundled auth7702 flow (trezor-firmware#7512) replaced the standalone message in 2.12.5.
const skip = ['1', '<2.12.5'];

// Firmware fixture amounts are decimal integers, the Connect API expects hex strings.
const toHex = (value: number) => `0x${value.toString(16)}`;

const ethereumSignTransactionEip7702: TestCase = {
    // Distinct E2E id so CI routes it to the `experimental` group; calls `ethereumSignTransaction`.
    method: 'ethereumSignTransactionEip7702',
    apiMethod: 'ethereumSignTransaction',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
        settings: {
            experimental_features: true,
            // SafetyCheckLevel.PromptTemporarily - authorizing a delegate is refused under strict
            // safety checks.
            safety_checks: 2,
        },
    },
    tests: commonFixtures.tests.map(({ name, parameters, result }) => ({
        description: name,
        params: {
            __experimental: true,
            path: parameters.path,
            transaction: {
                to: parameters.to_address,
                chainId: parameters.chain_id,
                value: toHex(parameters.value),
                nonce: toHex(parameters.nonce),
                gasLimit: toHex(parameters.gas_limit),
                maxFeePerGas: toHex(parameters.max_gas_fee),
                maxPriorityFeePerGas: toHex(parameters.max_priority_fee),
                authorizationList: [{ address: parameters.delegate }],
            },
        },
        result: {
            serializedTx: `0x${result.tx_bytes_hex}`,
        },
        skip,
    })),
};

export default ethereumSignTransactionEip7702;
