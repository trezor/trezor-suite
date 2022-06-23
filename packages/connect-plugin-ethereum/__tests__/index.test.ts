/* eslint-disable camelcase */

// @ts-ignore
import commonFixtures from '../../../submodules/trezor-common/tests/fixtures/ethereum/sign_typed_data.json';
import { transformTypedData } from '../src/index';

// Adds 0x to a string if it doesn't start with one
// fixtures sometimes start with 0x, sometimes not
function messageToHex(string: string) {
    return string.startsWith('0x') ? string : `0x${string}`;
}

describe('typedData', () => {
    commonFixtures.tests
        .filter(test => test.parameters.metamask_v4_compat)
        .forEach(test => {
            it('typedData to message_hash and domain_separator_hash', () => {
                const transformed = transformTypedData(
                    // @ts-ignore JSON..
                    test.parameters.data,
                    test.parameters.metamask_v4_compat,
                );
                const { domain_separator_hash, message_hash } = transformed;

                expect(messageToHex(domain_separator_hash)).toEqual(
                    messageToHex(test.parameters.domain_separator_hash),
                );
                if (message_hash && test.parameters.message_hash) {
                    expect(messageToHex(message_hash)).toEqual(
                        messageToHex(test.parameters.message_hash),
                    );
                } else {
                    expect(null).toEqual(test.parameters.message_hash);
                }
            });
        });
});
