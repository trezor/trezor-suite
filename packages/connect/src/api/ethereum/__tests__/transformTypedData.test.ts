// Ported from packages/connect-plugin-ethereum/__tests__/index.test.ts when
// the plugin was deprecated and its hashing logic moved into @trezor/connect.
// Verifies byte-equivalence of the new viem-backed transformTypedData against
// the firmware ground-truth fixtures in trezor-common.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import commonFixtures from '../../../../../../submodules/trezor-common/tests/fixtures/ethereum/sign_typed_data.json';
import { transformTypedData } from '../ethereumSignTypedData';

// fixtures sometimes start with 0x, sometimes not — normalize for comparison
function messageToHex(string: string) {
    return string.startsWith('0x') ? string : `0x${string}`;
}

// Same skips as packages/connect/e2e/__fixtures__/ethereumSignTypedData.ts —
// pending firmware support, tracked at trezor/trezor-suite#5181.
const SKIP_FIXTURES = new Set(['array_of_structs', 'injective_testcase']);

describe('transformTypedData (firmware-fixture parity)', () => {
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
