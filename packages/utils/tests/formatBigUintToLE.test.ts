import { BigNumber, formatBigUintToLE } from '../src';

describe(formatBigUintToLE.name, () => {
    it('format 8 bytes (bitcoin-like)', () => {
        const value = new BigNumber('123456789');
        const bytesLength = 8;

        const amountBigInt = BigInt(value.toFixed(0));
        const byteArray = Buffer.alloc(bytesLength);
        byteArray.writeBigUInt64LE(amountBigInt, 0);

        expect(formatBigUintToLE({ value, bytesLength })).toEqual('15cd5b0700000000');
        expect(formatBigUintToLE({ value, bytesLength })).toEqual(byteArray.toString('hex'));
    });

    it('format 32 bytes (evm)', () => {
        const value = new BigNumber('12345678901234567890');
        const bytesLength = 32;

        expect(formatBigUintToLE({ value, bytesLength })).toEqual(
            'd20a1feb8ca954ab000000000000000000000000000000000000000000000000',
        );
    });

    it('accepts plain string and safe-integer number inputs', () => {
        expect(formatBigUintToLE({ value: '7000000', bytesLength: 8 })).toEqual('c0cf6a0000000000');
        expect(formatBigUintToLE({ value: 7000000, bytesLength: 8 })).toEqual('c0cf6a0000000000');
    });

    it('throws if number is not a safe integer', () => {
        expect(() =>
            formatBigUintToLE({
                value: Number.MAX_SAFE_INTEGER + 1,
                bytesLength: 8,
            }),
        ).toThrow('Number value must be a safe integer');
    });

    it('throws if number exceeds byte length', () => {
        expect(() =>
            formatBigUintToLE({
                value: new BigNumber('4294967296'),
                bytesLength: 4,
            }),
        ).toThrow('Exceeds 4 bytes');
        expect(() =>
            formatBigUintToLE({
                value: new BigNumber('18446744073709551616'),
                bytesLength: 8,
            }),
        ).toThrow('Exceeds 8 bytes');
    });

    it('throws if number is negative', () => {
        expect(() =>
            formatBigUintToLE({
                value: new BigNumber('-1'),
                bytesLength: 4,
            }),
        ).toThrow('Value cannot be negative');
    });

    it('throws if number is not an integer', () => {
        expect(() =>
            formatBigUintToLE({
                value: new BigNumber('1.1'),
                bytesLength: 4,
            }),
        ).toThrow('Value must be an integer');
    });

    it('throws if byte length is zero, negative, or fractional', () => {
        expect(() => formatBigUintToLE({ value: '0', bytesLength: 0 })).toThrow(
            'Byte length must be a positive safe integer',
        );
        expect(() => formatBigUintToLE({ value: '0', bytesLength: -1 })).toThrow(
            'Byte length must be a positive safe integer',
        );
        expect(() => formatBigUintToLE({ value: '0', bytesLength: 1.5 })).toThrow(
            'Byte length must be a positive safe integer',
        );
    });
});
