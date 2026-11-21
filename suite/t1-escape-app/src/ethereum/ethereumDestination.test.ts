import { getEthereumAddressBytes, validateEthereumDestination } from './ethereumDestination';

const CHECKSUMMED = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

const validate = (input: string, ownAddresses: string[] = []) =>
    validateEthereumDestination({ input, ownAddresses: new Set(ownAddresses) });

describe('validateEthereumDestination', () => {
    it('accepts a checksummed address as it is', () => {
        expect(validate(CHECKSUMMED)).toEqual({
            success: true,
            payload: { address: CHECKSUMMED },
        });
    });

    it('accepts an all-lowercase address and returns it checksummed', () => {
        expect(validate(` ${CHECKSUMMED.toLowerCase()} `)).toEqual({
            success: true,
            payload: { address: CHECKSUMMED },
        });
    });

    it('refuses a mixed-case address whose checksum does not match', () => {
        const mistyped = `${CHECKSUMMED.slice(0, -1)}${CHECKSUMMED.endsWith('5') ? '6' : '5'}`;

        expect(validate(mistyped)).toEqual({ success: false, error: { type: 'bad-checksum' } });
        expect(validate(CHECKSUMMED.replace('dA', 'Da'))).toEqual({
            success: false,
            error: { type: 'bad-checksum' },
        });
    });

    it.each([
        'hello',
        '0x',
        'd8da6bf26964af9d7eed9e03e53415d37aa96045',
        '0xd8da6bf26964af9d7eed9e03e53415d37aa9604',
        '0xd8da6bf26964af9d7eed9e03e53415d37aa960455',
        '0xg8da6bf26964af9d7eed9e03e53415d37aa96045',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
    ])('refuses "%s" as not an address', input => {
        expect(validate(input)).toEqual({ success: false, error: { type: 'invalid' } });
    });

    it('refuses an empty entry', () => {
        expect(validate('   ')).toEqual({ success: false, error: { type: 'empty' } });
    });

    it('refuses an address of the scanned wallet whatever its case', () => {
        expect(validate(CHECKSUMMED, [CHECKSUMMED.toLowerCase()])).toEqual({
            success: false,
            error: { type: 'own-address' },
        });
        expect(validate(CHECKSUMMED.toLowerCase(), [CHECKSUMMED.toLowerCase()])).toEqual({
            success: false,
            error: { type: 'own-address' },
        });
    });
});

describe('getEthereumAddressBytes', () => {
    it('returns the 20 bytes as lowercase hex without the prefix', () => {
        expect(getEthereumAddressBytes(CHECKSUMMED)).toBe(
            'd8da6bf26964af9d7eed9e03e53415d37aa96045',
        );
    });
});
