import * as Generators from './generators';
import {
    GroupElement,
    constantTimeMultiScalarMultiply,
    groupElementFromText,
    groupElementSum,
    groupElementsEqual,
    multiScalarMultiply,
} from './groupElement';
import { fromHex, toHex } from './hex';
import { SCALAR_ORDER, scalarFromNumber, scalarNegate } from './scalar';

const { G } = Generators;
const one = scalarFromNumber(1);
const two = scalarFromNumber(2);
const three = scalarFromNumber(3);
const zero = scalarFromNumber(0);
const NC = (1n << 256n) - SCALAR_ORDER;

describe('GroupElement', () => {
    // Port of NWabiSabi/WabiSabi.Tests/Crypto/GroupElements/OperationTests.cs
    describe('operations', () => {
        it('addition', () => {
            expect(GroupElement.INFINITY.add(G).equals(G)).toBe(true);
            expect(G.add(GroupElement.INFINITY).equals(G)).toBe(true);
            expect(GroupElement.INFINITY.add(GroupElement.INFINITY).isInfinity).toBe(true);

            const p1 = G.multiply(one);
            const p2 = G.multiply(two);
            const p3 = G.multiply(three);
            const p0 = G.multiply(zero);

            expect(p1.equals(G)).toBe(true);
            expect(p0.isInfinity).toBe(true);

            expect(p1.add(p1).equals(p2)).toBe(true);
            expect(p1.add(p1).add(p1).equals(p3)).toBe(true);
            expect(p2.add(p1).equals(p3)).toBe(true);
            expect(p1.add(p2).equals(p3)).toBe(true);
            expect(p1.add(p0).equals(p1)).toBe(true);
            expect(p2.add(p0).equals(p2)).toBe(true);
            expect(p3.add(p0).equals(p3)).toBe(true);
        });

        it('subtraction', () => {
            expect(GroupElement.INFINITY.subtract(G).equals(G.negate())).toBe(true);
            expect(G.subtract(GroupElement.INFINITY).equals(G)).toBe(true);
            expect(GroupElement.INFINITY.subtract(GroupElement.INFINITY).isInfinity).toBe(true);

            const minusOne = G.negate().multiply(one);
            const minusTwo = G.negate().multiply(two);
            const p1 = G.multiply(one);
            const p2 = G.multiply(two);
            const p3 = G.multiply(three);
            const p0 = G.multiply(zero);

            expect(p1.subtract(p1).equals(p0)).toBe(true);
            expect(p1.subtract(p1).subtract(p1).equals(minusOne)).toBe(true);
            expect(p1.add(p1).subtract(p1).equals(p1)).toBe(true);
            expect(p2.subtract(p1).equals(p1)).toBe(true);
            expect(p1.subtract(p2).equals(minusOne)).toBe(true);
            expect(p0.subtract(p1).equals(minusOne)).toBe(true);
            expect(p0.subtract(p2).equals(minusTwo)).toBe(true);
            expect(p3.subtract(p1).equals(p2)).toBe(true);
            expect(p1.subtract(p3).equals(minusTwo)).toBe(true);
            expect(p0.add(p0).subtract(p0).add(p0).isInfinity).toBe(true);
        });

        it('negation', () => {
            expect(G.negate().equals(G.negate().multiply(one))).toBe(true);
            expect(GroupElement.INFINITY.negate().isInfinity).toBe(true);
        });

        it('multiplication by a scalar', () => {
            [one, two, three, NC, SCALAR_ORDER - 1n].forEach(scalar => {
                expect(G.multiply(scalar).equals(G.multiplyUnsafe(scalar))).toBe(true);
            });

            // A zero scalar and the point at infinity both yield infinity.
            expect(G.multiply(zero).isInfinity).toBe(true);
            expect(GroupElement.INFINITY.multiply(two).isInfinity).toBe(true);
            expect(GroupElement.INFINITY.multiply(zero).isInfinity).toBe(true);
            expect(GroupElement.INFINITY.multiplyUnsafe(two).isInfinity).toBe(true);
        });
    });

    // Port of NWabiSabi/WabiSabi.Tests/Crypto/GroupElements/GeneralTests.cs
    describe('general', () => {
        it('all representations of infinity are equal', () => {
            expect(GroupElement.INFINITY.equals(G.multiply(zero))).toBe(true);
            expect(GroupElement.INFINITY.equals(G)).toBe(false);
            expect(G.equals(GroupElement.INFINITY)).toBe(false);
        });

        it('is not equal to null or undefined', () => {
            expect(G.equals(null)).toBe(false);
            expect(G.equals(undefined)).toBe(false);
        });

        it('one equals one and does not equal two', () => {
            expect(G.multiply(one).equals(G.multiply(one))).toBe(true);
            expect(G.multiply(one).equals(G.multiply(two))).toBe(false);
        });

        it.each([
            '000000000000000000000000000000000000000000000000000000000000000000',
            '001000000000000000000000000000000000000000000000000000000000000000',
            '002000000000000000000000000000000000000000000000000000000000000000',
            '003000000000000000000000000000000000000000000000000000000000000000',
            '000000000000000000000000000000000000000000000000000000000000000001',
        ])('deserializes %s as infinity', hex => {
            expect(GroupElement.fromBytes(fromHex(hex)).isInfinity).toBe(true);
        });

        it('round-trips serialization', () => {
            [
                G,
                GroupElement.INFINITY,
                G.multiply(one),
                G.multiply(two),
                G.multiply(three),
                G.multiply(scalarFromNumber(21)),
                G.multiply(NC),
            ].forEach(element => {
                expect(GroupElement.fromBytes(element.toBytes()).equals(element)).toBe(true);
            });
        });

        it('serializes infinity as 33 zero bytes', () => {
            expect(toHex(GroupElement.INFINITY.toBytes())).toBe('00'.repeat(33));
            expect(GroupElement.INFINITY.toString()).toBe('Infinity');
        });

        it('serializes even and odd y with the right prefix', () => {
            const hexG = '0279BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798';
            const hexGodd = '0379BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798';

            expect(G.toHex()).toBe(hexG);
            expect(GroupElement.fromBytes(fromHex(hexG)).equals(G)).toBe(true);
            expect(G.negate().toHex()).toBe(hexGodd);
            expect(GroupElement.fromBytes(fromHex(hexGodd)).equals(G.negate())).toBe(true);
        });

        it('rejects malformed serializations', () => {
            expect(() => GroupElement.fromBytes(new Uint8Array(0))).toThrow();
            expect(() => GroupElement.fromBytes(new Uint8Array(32))).toThrow();
            expect(() => GroupElement.fromBytes(new Uint8Array(34))).toThrow();
            expect(() =>
                GroupElement.fromBytes(
                    fromHex('100000000000000000000000000000000000000000000000000000000000000000'),
                ),
            ).toThrow('well-formatted');
        });

        it('rejects a point that is not on the curve', () => {
            const even = new Uint8Array(33);
            even[0] = 0x02;
            expect(() => GroupElement.fromBytes(even)).toThrow('not a valid group element');
            const odd = new Uint8Array(33);
            odd[0] = 0x03;
            expect(() => GroupElement.fromBytes(odd)).toThrow('not a valid group element');
        });

        it('has no affine representation for infinity', () => {
            expect(() => GroupElement.INFINITY.point).toThrow('point at infinity');
        });

        // Port of the `FromText` theory in GeneralTests.cs
        it.each([
            ['', '02E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'],
            [' ', '0224944F33566D9ED9C410AE72F89454AC6F0CFEE446590C01751F094E185E8978'],
            ['  ', '026C179F21E6F62B629055D8AB40F454ED02E48B68563913473B857D3638E23B28'],
            ['a', '02EB48BDFA15FC43DBEA3AABB1EE847B6E69232C0F0D9705935E50D60CCE77877F'],
            ['12345', '035994471ABB01112AFCC18159F6CC74B4F511B99806DA59B3CAF5A9C173CACFC5'],
        ])('derives a point from the text %p', (text, expected) => {
            expect(groupElementFromText(text).toHex()).toBe(expected);
        });
    });

    describe('vectors', () => {
        it('sums group elements', () => {
            expect(groupElementSum([]).isInfinity).toBe(true);
            expect(groupElementSum([G, G]).equals(G.multiply(two))).toBe(true);
        });

        it('multi-scalar multiplication matches the naive sum', () => {
            const scalars = [one, two, three];
            const elements = [Generators.Gg, Generators.Gh, Generators.Ga];
            const expected = groupElementSum(
                scalars.map((scalar, index) => (elements[index] as GroupElement).multiply(scalar)),
            );

            expect(multiScalarMultiply(scalars, elements).equals(expected)).toBe(true);
            expect(constantTimeMultiScalarMultiply(scalars, elements).equals(expected)).toBe(true);
        });

        it('multi-scalar multiplication skips zero scalars and infinite generators', () => {
            expect(multiScalarMultiply([], []).isInfinity).toBe(true);
            expect(multiScalarMultiply([zero], [Generators.Gg]).isInfinity).toBe(true);
            expect(multiScalarMultiply([one], [GroupElement.INFINITY]).isInfinity).toBe(true);
            expect(
                multiScalarMultiply([zero, one], [Generators.Gg, Generators.Gh]).equals(
                    Generators.Gh,
                ),
            ).toBe(true);
        });

        it('multi-scalar multiplication requires matching lengths', () => {
            expect(() => multiScalarMultiply([one], [])).toThrow('same length');
            expect(() => constantTimeMultiScalarMultiply([one], [])).toThrow('same length');
        });

        it('the variable-time form agrees with the constant-time one on random inputs', () => {
            const candidates = [
                Generators.G,
                Generators.Gg,
                Generators.Gh,
                Generators.Ga,
                Generators.Gs,
                GroupElement.INFINITY,
                ...Generators.NegatedGhPowersOfTwo.slice(0, 8),
            ];

            for (let n = 0; n < 50; n++) {
                const length = n % 12;
                const elements = Array.from(
                    { length },
                    (_, i) => candidates[(i * 7 + n) % candidates.length] as GroupElement,
                );
                const scalars = Array.from({ length }, (_, i) =>
                    // Deliberately includes zeroes, which the batched form drops.
                    i % 4 === 0 ? 0n : BigInt(i + 1) * 0x9876543210fedcban + BigInt(n),
                );

                expect(multiScalarMultiply(scalars, elements).toHex()).toBe(
                    constantTimeMultiScalarMultiply(scalars, elements).toHex(),
                );
            }
        });

        it('the variable-time form agrees with the constant-time one on a range-proof shaped row', () => {
            // Equation 0 of a 42-bit range proof statement: Gh plus the negated powers
            // of two, with every other column the point at infinity.
            const width = 42;
            const elements: GroupElement[] = [Generators.Gh];
            const scalars: bigint[] = [0x1111n];
            for (let i = 0; i < width; i++) {
                elements.push(GroupElement.INFINITY, GroupElement.INFINITY);
                scalars.push(0n, 0n);
                elements.push(Generators.NegatedGhPowersOfTwo[i] as GroupElement);
                scalars.push(BigInt(i + 1) * 0x1234567n);
            }

            expect(multiScalarMultiply(scalars, elements).toHex()).toBe(
                constantTimeMultiScalarMultiply(scalars, elements).toHex(),
            );
        });

        it('memoizes serialization without changing it', () => {
            const element = Generators.G.multiply(scalarFromNumber(9));
            const first = element.toBytes();

            expect(element.toBytes()).toBe(first);
            expect(toHex(element.toBytes())).toBe(toHex(first));
            expect(GroupElement.INFINITY.toBytes()).toBe(GroupElement.INFINITY.toBytes());
        });

        it('compares group element vectors', () => {
            expect(groupElementsEqual([G, Generators.Gh], [G, Generators.Gh])).toBe(true);
            expect(groupElementsEqual([G], [G, Generators.Gh])).toBe(false);
            expect(groupElementsEqual([G], [Generators.Gh])).toBe(false);
        });
    });
});

describe('generators', () => {
    // Port of `GeneratorsArentChanged` in GeneratorTests.cs. The module asserts this at
    // import time too; this pins the expected constants in a place a reviewer will read.
    it.each(Object.entries(Generators.GENERATOR_HEX))('%s is unchanged', (name, hex) => {
        const generator = (Generators as unknown as Record<string, GroupElement>)[name];
        expect(generator?.toHex()).toBe(hex);
    });

    it('the powers of two tables have 255 entries and agree with each other', () => {
        expect(Generators.ScalarPowersOfTwo).toHaveLength(255);
        expect(Generators.NegatedGhPowersOfTwo).toHaveLength(255);
        [0, 1, 7, 41, 254].forEach(i => {
            const power = Generators.ScalarPowersOfTwo[i] as bigint;
            expect(power).toBe(1n << BigInt(i));
            expect(
                (Generators.NegatedGhPowersOfTwo[i] as GroupElement).equals(
                    Generators.Gh.multiply(scalarNegate(power)),
                ),
            ).toBe(true);
        });
    });

    it('names generators for debugging', () => {
        expect(Generators.tryGetFriendlyGeneratorName(Generators.G)).toBe('Standard Generator');
        expect(Generators.tryGetFriendlyGeneratorName(Generators.Gwp)).toBe('Gwp Generator');
        expect(Generators.tryGetFriendlyGeneratorName(null)).toBeUndefined();
        expect(
            Generators.tryGetFriendlyGeneratorName(Generators.G.multiply(scalarFromNumber(5))),
        ).toBeUndefined();
    });
});
