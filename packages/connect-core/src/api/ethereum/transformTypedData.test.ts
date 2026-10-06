// Ported from packages/connect-plugin-ethereum/__tests__/index.test.ts when
// the plugin was deprecated and its hashing logic moved into @trezor/connect.
// Verifies byte-equivalence of the new viem-backed transformTypedData against
// the firmware ground-truth fixtures in trezor-common.

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { transformTypedData } from './ethereumSignTypedData';

// Node-only parity test: read the vector from the trezor-common submodule directly
// (no need for the browser `virtual:common-fixtures` loader). Skips when absent.
const FIXTURE_PATH = join(
    __dirname,
    '../../../../../submodules/trezor-common/tests/fixtures/ethereum/sign_typed_data.json',
);
const commonFixtures = existsSync(FIXTURE_PATH)
    ? JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8'))
    : null;

// fixtures sometimes start with 0x, sometimes not — normalize for comparison
function messageToHex(string: string) {
    return string.startsWith('0x') ? string : `0x${string}`;
}

// Also skipped in packages/connect-core/e2e/__fixtures__/ethereumSignTypedData.ts,
// pending firmware support, tracked at trezor/trezor-suite#5181.
const SKIP_FIXTURES = new Set(['array_of_structs']);

describe('transformTypedData (firmware-fixture parity)', () => {
    if (!commonFixtures) {
        // trezor-common submodule is not checked out; nothing to verify against.
        it.skip('skipped: trezor-common submodule not checked out', () => {});

        return;
    }

    commonFixtures.tests
        .filter((test: any) => test.parameters.metamask_v4_compat && !SKIP_FIXTURES.has(test.name))
        .forEach((test: any) => {
            it(`${test.name}: domain_separator_hash and message_hash match firmware ground truth`, () => {
                const { domain_separator_hash, message_hash } = transformTypedData(
                    test.parameters.data,
                    test.parameters.metamask_v4_compat,
                );

                expect(messageToHex(domain_separator_hash)).toEqual(
                    messageToHex(test.parameters.domain_separator_hash),
                );

                if (message_hash && test.parameters.message_hash) {
                    expect(messageToHex(message_hash)).toEqual(
                        messageToHex(test.parameters.message_hash),
                    );
                } else {
                    expect(message_hash).toBeNull();
                    expect(test.parameters.message_hash).toBeNull();
                }
            });
        });
});

describe('transformTypedData domain', () => {
    const domainTypes = [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
    ];

    it('hashes domain fields by their declared types', () => {
        const { domain_separator_hash } = transformTypedData(
            {
                types: {
                    EIP712Domain: [
                        ...domainTypes,
                        { name: 'verifyingContract', type: 'string' },
                        { name: 'salt', type: 'string' },
                    ],
                },
                primaryType: 'EIP712Domain',
                domain: {
                    name: 'Injective Web3',
                    version: '1.0.0',
                    chainId: 1,
                    verifyingContract: 'cosmos',
                    salt: '1646906878039',
                },
                message: {},
            },
            true,
        );

        // trezor-common vector `injective_testcase`
        expect(domain_separator_hash).toBe(
            '8e96520578ec587b6ad9d06fe5fc352b34e98090044921089e1a9cbc1290901c',
        );
    });

    it('hashes a chainId declared as string as text', () => {
        const { domain_separator_hash } = transformTypedData(
            {
                types: {
                    EIP712Domain: [
                        { name: 'name', type: 'string' },
                        { name: 'chainId', type: 'string' },
                    ],
                },
                primaryType: 'EIP712Domain',
                domain: { name: 'Injective Web3', chainId: 'injective-1' },
                message: {},
            },
            true,
        );

        // keccak256(typeHash ‖ keccak256('Injective Web3') ‖ keccak256('injective-1'))
        expect(domain_separator_hash).toBe(
            '24965cb4530f7fdfcafc05713f437dc80816c426e7bbed4ed3212b0c7a2ca569',
        );
    });

    it('accepts an address field without the 0x prefix', () => {
        const { domain_separator_hash } = transformTypedData(
            {
                types: {
                    EIP712Domain: [...domainTypes, { name: 'verifyingContract', type: 'address' }],
                },
                primaryType: 'EIP712Domain',
                domain: {
                    name: 'Ether Mail',
                    version: '1',
                    chainId: 1,
                    verifyingContract: '1e0Ae8205e9726E6F296ab8869160A6423E2337E',
                },
                message: {},
            },
            true,
        );

        // trezor-common vector `basic_data`
        expect(domain_separator_hash).toBe(
            '97d6f53774b810fbda27e091c03c6a6d6815dd1270c2e62e82c6917c1eff774b',
        );
    });
});
