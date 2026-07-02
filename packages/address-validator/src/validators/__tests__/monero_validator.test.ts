import { addressType } from '../../addressType';
import { moneroValidator } from '../monero_validator';

// The official Monero donation address (mainnet standard, network tag 18).
const DONATION =
    '44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A';

describe('monero_validator', () => {
    it('accepts a valid mainnet standard address', () => {
        expect(moneroValidator.isAddressValid(DONATION, 'xmr')).toBe(true);
        expect(moneroValidator.getAddressType(DONATION, 'xmr')).toBe(addressType.ADDRESS);
    });

    it('rejects an address with a corrupted checksum', () => {
        const corrupted = `${DONATION.slice(0, -1)}${DONATION.endsWith('A') ? 'B' : 'A'}`;
        expect(moneroValidator.isAddressValid(corrupted, 'xmr')).toBe(false);
        expect(moneroValidator.getAddressType(corrupted, 'xmr')).toBeUndefined();
    });

    // Vectors derived from the donation address's public keys with valid keccak checksums (integrated
    // = donation address + a payment id; subaddress reuses the primary keys to exercise the tag-42
    // branch; testnet is a valid address on a network this mainnet-only validator must reject).
    const INTEGRATED =
        '4DrvGduF3ynBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVPm296MuBB7cGP397xc';
    const SUBADDRESS =
        '84zPbCjb38gBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGMwZRBo';
    const TESTNET =
        '9uhnk5k1j5NBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGRySiok';

    it('accepts a valid mainnet integrated address (tag 19)', () => {
        expect(moneroValidator.isAddressValid(INTEGRATED, 'xmr')).toBe(true);
    });

    it('accepts a valid mainnet subaddress (tag 42)', () => {
        expect(moneroValidator.isAddressValid(SUBADDRESS, 'xmr')).toBe(true);
    });

    it('rejects a non-mainnet (testnet, tag 53) address', () => {
        expect(moneroValidator.isAddressValid(TESTNET, 'xmr')).toBe(false);
    });

    it.each([
        ['empty string', ''],
        ['truncated address', DONATION.slice(0, 40)],
        ['invalid base58 symbol', `${DONATION.slice(0, -1)}0`],
        ['a bitcoin address', '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'],
        ['an ethereum address', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'],
    ])('rejects %s', (_label, address) => {
        expect(moneroValidator.isAddressValid(address, 'xmr')).toBe(false);
    });

    it('reports xmr as a supported coin', () => {
        expect(moneroValidator.getSupportedCoins()).toContain('xmr');
    });
});
