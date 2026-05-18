import baseX from 'base-x';

import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';
import type { Currency } from './currency-types';

const ALLOWED_CHARS = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';

const codec = baseX(ALLOWED_CHARS);
// SUSPECTED-BUG-MUTATION: The regex `^r[ALPHA]{27,35}$` requires total length 28-36, over-restricting against the XRP base58check spec (25-byte payload encodes to 25-35 chars total). Well-known XRP addresses with leading zero bytes are silently rejected: empirically `rrrrrrrrrrrrrrrrrrrrrhoLvTp` (ACCOUNT_ZERO, 27 chars, valid checksum) and `rrrrrrrrrrrrrrrrrrrn5RM1rHd` (ACCOUNT_ONE, 27 chars, valid checksum) both base58-decode to exactly 25 bytes and pass `sha256Checksum` verification, but `isValidAddress` returns false because they fail the regex's 28-char minimum. Lower bound should be `{24,35}` (i.e. 25-36 total chars) to match the XRPL spec.
// Mutator: Regex/Block  Original: `^r[ALPHA]{27,35}$`  →  Mutant: `^r[ALPHA]{24,35}$`
// Needs human spec review before locking behavior with a test.
const regexp = new RegExp('^r[' + ALLOWED_CHARS + ']{27,35}$');

function verifyChecksum(address: string): boolean {
    const bytes = codec.decode(address);
    const computedChecksum = cryptoUtils.sha256Checksum(cryptoUtils.toHex(bytes.slice(0, -4)));
    const checksum = cryptoUtils.toHex(bytes.slice(-4));

    return computedChecksum === checksum;
}

export const isValidAddress = (address: string): boolean => {
    if (regexp.test(address)) {
        return verifyChecksum(address);
    }

    return false;
};

export const getAddressType = (address: string, _currency?: Currency, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
