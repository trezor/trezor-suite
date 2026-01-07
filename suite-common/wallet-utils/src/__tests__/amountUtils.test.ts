import { BigNumber } from '@trezor/utils';

import { asAmountSubunit, asAmountUnit } from '../AmountTypes';
import { formatBigUintToLE, subunitsToUnits, unitsToSubunits } from '../amountUtils';

describe(subunitsToUnits.name, () => {
    it('converts Sats->BTC', () => {
        expect(
            subunitsToUnits({
                value: asAmountSubunit(new BigNumber(1)),
                symbol: 'btc',
            }).toString(),
        ).toEqual('0.00000001');
    });
});

describe(unitsToSubunits.name, () => {
    it('converts BTC->Sats', () => {
        const btcSymbolResult = unitsToSubunits({
            value: asAmountUnit(new BigNumber(1)),
            symbol: 'btc',
        });
        expect(btcSymbolResult.toString()).toEqual(String(100_000_000));

        const decimalsResult = unitsToSubunits({
            value: asAmountUnit(new BigNumber(1)),
            decimals: 2,
        });
        expect(decimalsResult.toString()).toEqual('100');
    });
});

describe(formatBigUintToLE.name, () => {
    it('format 8 bytes (bitcoin-like)', () => {
        const value = new BigNumber('123456789');
        const bytesLength = 8;

        // native way to write little-endian 8 bytes
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
});
