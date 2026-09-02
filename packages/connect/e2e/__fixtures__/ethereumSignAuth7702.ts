import { loadCommonFixture } from './commonFixtures';

const commonFixtures = loadCommonFixture('ethereum/sign_auth_eip7702.json');
const errorFixtures = loadCommonFixture('ethereum/sign_auth_eip7702_errors.json');

// EIP-7702 is an experimental message not implemented on T1B1 and added to firmware in 2.12.4,
// so it is skipped on T1B1 and on older firmware.
const skip = ['1', '<2.12.4'];

// The signed digest covers only chain id, delegate and nonce, so the upstream signatures hold
// whether or not network definitions are downloaded - definitions only change what the device
// displays. That includes the `_defs` fixtures, where the firmware test suite injects fake
// definitions we have no equivalent for.
const ethereumSignAuth7702: TestCase = {
    method: 'ethereumSignAuth7702',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
        settings: {
            experimental_features: true,
            // Authorizing a delegate is refused under strict safety checks. Revocation is not,
            // but the whole test case shares one emulator setup.
            safety_checks: 2,
        },
    },
    tests: [
        ...commonFixtures.tests.map(({ name, parameters, result }) => ({
            description: name,
            params: {
                __experimental: true,
                path: parameters.path,
                chainId: parameters.chain_id,
                delegate: parameters.delegate,
                nonce: parameters.nonce,
            },
            result: {
                yParity: result.sig_v,
                r: `0x${result.sig_r}`,
                s: `0x${result.sig_s}`,
            },
            skip,
        })),
        ...errorFixtures.tests.map(({ name, parameters }) => ({
            description: `${name} => rejected`,
            params: {
                __experimental: true,
                path: parameters.path,
                chainId: parameters.chain_id,
                delegate: parameters.delegate,
                nonce: parameters.nonce,
            },
            result: false,
            skip,
        })),
        {
            description: 'missing __experimental opt-in',
            params: {
                path: "m/44'/60'/0'/0/0",
                chainId: 1,
                delegate: '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b',
                nonce: 1,
            },
            result: false,
            skip,
        },
        {
            description: 'delegate is not an address',
            params: {
                __experimental: true,
                path: "m/44'/60'/0'/0/0",
                chainId: 1,
                delegate: 'not-an-address',
                nonce: 1,
            },
            result: false,
            skip,
        },
    ],
};

export default ethereumSignAuth7702;
