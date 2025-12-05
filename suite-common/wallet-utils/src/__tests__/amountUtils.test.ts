import { BigNumber } from '@trezor/utils';

import { asAmountSubunit, asAmountUnit } from '../AmountTypes';
import { formatBigNumberToLE, subunitsToUnits, unitsToSubunits } from '../amountUtils';

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

describe(formatBigNumberToLE.name, () => {
    it('formatBigNumberToLE 8 bytes (bitcoin-like)', () => {
        const value = new BigNumber('123456789');
        const bytesLength = 8;

        // native way to write little-endian 8 bytes
        const amountBigInt = BigInt(value.toFixed(0));
        const byteArray = Buffer.alloc(bytesLength);
        byteArray.writeBigUInt64LE(amountBigInt, 0);

        expect(formatBigNumberToLE({ value, bytesLength })).toEqual('15cd5b0700000000');
        expect(formatBigNumberToLE({ value, bytesLength })).toEqual(byteArray.toString('hex'));
    });

    it('formatBigNumberToLE 32 bytes (evm)', () => {
        const value = new BigNumber('12345678901234567890');
        const bytesLength = 32;

        expect(formatBigNumberToLE({ value, bytesLength })).toEqual(
            'd20a1feb8ca954ab000000000000000000000000000000000000000000000000',
        );
    });

    it('formatBigNumberToLE throws if number exceeds byte length', () => {
        expect(() =>
            formatBigNumberToLE({ value: new BigNumber('4294967296'), bytesLength: 4 }),
        ).toThrow('Exceeds 4 bytes');
        expect(() =>
            formatBigNumberToLE({ value: new BigNumber('18446744073709551616'), bytesLength: 8 }),
        ).toThrow('Exceeds 8 bytes');
    });
});
