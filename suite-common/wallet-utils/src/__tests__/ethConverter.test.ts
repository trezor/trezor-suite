import { BigNumber } from '@trezor/utils';

import {
    fromBigInt,
    fromEther,
    fromGwei,
    fromHex,
    fromIntegerString,
    fromWei,
} from '../ethConverter';

// [wei, gwei, ether, hex]
const rows = [
    ['0', '0', '0', '0x0'],
    ['8191', '0.000008191', '0.000000000000008191', '0x1fff'],
    ['2147483647', '2.147483647', '0.000000002147483647', '0x7fffffff'],
    [
        '618970019642690137449562111',
        '618970019642690137.449562111',
        '618970019.642690137449562111',
        '0x1ffffffffffffffffffffff',
    ],
] as const;

type Row = (typeof rows)[number];

describe('eth converter', () => {
    describe('units', () => {
        it.each([
            ['fromWei', ([wei]: Row) => fromWei(wei)],
            ['fromGwei', ([, gwei]: Row) => fromGwei(gwei)],
            ['fromEther', ([, , ether]: Row) => fromEther(ether)],
        ])('%s', (_label, func) => {
            for (const row of rows) {
                const [wei, gwei, ether, hex] = row;
                expect(func(row).toWei()).toBe(wei);
                expect(func(row).toWei('string')).toBe(wei);
                expect(func(row).toWei('hex')).toBe(hex);
                expect(func(row).toWei('bignumber')).toStrictEqual(new BigNumber(wei));
                expect(func(row).toGwei()).toBe(gwei);
                expect(func(row).toGwei('string')).toBe(gwei);
                expect(func(row).toGwei('bignumber')).toStrictEqual(new BigNumber(gwei));
                expect(func(row).toEther()).toBe(ether);
                expect(func(row).toEther('string')).toBe(ether);
                expect(func(row).toEther('bignumber')).toStrictEqual(new BigNumber(ether));
            }
        });

        it('compatibility', () => {
            // @ts-expect-error Old fromWei supported number as well
            expect(fromWei(43981).toWei()).toBe('43981');
            // @ts-expect-error Old fromWei supported bigint as well
            expect(fromWei(BigInt(43981)).toWei()).toBe('43981');
            // Old fromWei supported hex string as well (technically still does, but it's meant to take decimal string)
            expect(fromWei('0xabcd').toWei()).toBe('43981');

            // @ts-expect-error Old toWei supported number as well
            expect(fromGwei(43981).toGwei()).toBe('43981');
            // @ts-expect-error Old toWei supported bigint as well
            expect(fromGwei(BigInt(43981)).toGwei()).toBe('43981');
            // Old toWei supported hex string as well (technically still does, but it's meant to take decimal string)
            expect(fromGwei('0xabcd').toGwei()).toBe('43981');

            // @ts-expect-error Old toWei supported number as well
            expect(fromEther(43981).toEther()).toBe('43981');
            // @ts-expect-error Old toWei supported bigint as well
            expect(fromEther(BigInt(43981)).toEther()).toBe('43981');
            // Old toWei supported hex string as well (technically still does, but it's meant to take decimal string)
            expect(fromEther('0xabcd').toEther()).toBe('43981');
        });

        it('errors', () => {
            Object.entries({
                '1ab2': 'not a number',
                '0xy': 'not a number',
                '-43': 'negative',
                Infinity: 'infinity',
            }).forEach(([value, reason]) => {
                expect(() => fromWei(value)).toThrow(`Value '${value}' is invalid (${reason})`);
                expect(() => fromGwei(value)).toThrow(`Value '${value}' is invalid (${reason})`);
                expect(() => fromEther(value)).toThrow(`Value '${value}' is invalid (${reason})`);
            });

            expect(() => fromWei('0.3')).toThrow(`Value '0.3' is invalid (decimal)`);
            expect(() => fromGwei('0.3')).not.toThrow();
            expect(() => fromEther('0.3')).not.toThrow();
        });
    });

    describe('formats', () => {
        it.each([
            ['fromHex', ([, , , hex]: Row) => fromHex(hex)],
            ['fromBigInt', ([wei]: Row) => fromBigInt(BigInt(wei))],
            ['fromIntegerString', ([wei]: Row) => fromIntegerString(wei)],
        ])('%s', (_label, func) => {
            for (const row of rows) {
                const [wei, gwei, ether, hex] = row;
                expect(func(row).toHex()).toBe(hex);
                expect(func(row).toBigNumber()).toStrictEqual(new BigNumber(wei));
                expect(func(row).toIntegerString()).toBe(wei);
                expect(func(row).asWei().toWei()).toBe(wei);
                expect(func(row).asWei().toGwei()).toBe(gwei);
                expect(func(row).asWei().toEther()).toBe(ether);
            }
        });

        it('errors', () => {
            Object.entries({
                '1ab2': 'not a number',
                '0xy': 'not a number',
                '-43': 'negative',
                Infinity: 'infinity',
                '0.3': 'decimal',
            }).forEach(([value, reason]: [any, string]) => {
                expect(() => fromHex(value)).toThrow(`Value '${value}' is invalid (${reason})`);
                expect(() => fromBigInt(value)).toThrow(`Value '${value}' is invalid (${reason})`);
                expect(() => fromIntegerString(value)).toThrow(
                    `Value '${value}' is invalid (${reason})`,
                );
            });
        });
    });
});
