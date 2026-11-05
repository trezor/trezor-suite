import { CredentialIssuerParameters } from './credentialIssuerParameters';
import * as Generators from './generators';
import { GroupElement } from './groupElement';
import { Mac, generateU } from './mac';
import { secureRandom } from './random';
import { SCALAR_ONE, SCALAR_ZERO, scalarFromNumber } from './scalar';
import { CredentialIssuerSecretKey, computeMac, scriptedRandom } from './testing';

const verifyMac = (mac: Mac, sk: CredentialIssuerSecretKey, ma: GroupElement) =>
    computeMac(sk, ma, mac.t).equals(mac);

describe('Mac', () => {
    // Port of NWabiSabi/WabiSabi.Tests/Crypto/MacTests.cs
    it('cannot be built with a zero nonce', () => {
        const sk = CredentialIssuerSecretKey.fromRandom(secureRandom);

        expect(() => computeMac(sk, Generators.G, SCALAR_ZERO)).toThrow('t cannot be zero.');
    });

    it('cannot be built with the point at infinity as the tag', () => {
        expect(() => new Mac(SCALAR_ONE, GroupElement.INFINITY)).toThrow(
            'v cannot be the point at infinity.',
        );
    });

    it('can be produced and verified', () => {
        const sk = CredentialIssuerSecretKey.fromRandom(secureRandom);
        const attribute = Generators.G.multiply(secureRandom.getScalar());
        const t = secureRandom.getScalar();

        expect(verifyMac(computeMac(sk, attribute, t), sk, attribute)).toBe(true);
    });

    it('detects an invalid MAC', () => {
        const sk = CredentialIssuerSecretKey.fromRandom(secureRandom);
        const attribute = Generators.G.multiply(secureRandom.getScalar());
        const differentAttribute = Generators.G.multiply(secureRandom.getScalar());
        const t = secureRandom.getScalar();

        const mac = computeMac(sk, attribute, t);
        expect(verifyMac(mac, sk, differentAttribute)).toBe(false);

        const differentT = secureRandom.getScalar();
        expect(mac.equals(computeMac(sk, attribute, differentT))).toBe(false);

        const differentSk = CredentialIssuerSecretKey.fromRandom(secureRandom);
        expect(verifyMac(computeMac(sk, attribute, differentT), differentSk, attribute)).toBe(
            false,
        );
    });

    it('is equal only for the same key, attribute and nonce', () => {
        const right = {
            attribute: Generators.G.multiply(secureRandom.getScalar()),
            sk: CredentialIssuerSecretKey.fromRandom(secureRandom),
            t: secureRandom.getScalar(),
        };
        const wrong = {
            attribute: Generators.G.multiply(secureRandom.getScalar()),
            sk: CredentialIssuerSecretKey.fromRandom(secureRandom),
            t: secureRandom.getScalar(),
        };
        const mac = computeMac(right.sk, right.attribute, right.t);

        [
            [right, right, right, true],
            [right, right, wrong, false],
            [right, wrong, right, false],
            [right, wrong, wrong, false],
            [wrong, right, right, false],
            [wrong, right, wrong, false],
            [wrong, wrong, right, false],
            [wrong, wrong, wrong, false],
        ].forEach(([attributeFrom, skFrom, tFrom, isEqual]) => {
            const other = computeMac(
                (skFrom as typeof right).sk,
                (attributeFrom as typeof right).attribute,
                (tFrom as typeof right).t,
            );
            expect(mac.equals(other)).toBe(isEqual);
            expect(other.equals(mac)).toBe(isEqual);
        });

        expect(mac.equals(mac)).toBe(true);
    });

    it('derives U deterministically from the nonce', () => {
        const t = scalarFromNumber(42);

        expect(generateU(t).toHex()).toBe(generateU(t).toHex());
        expect(generateU(t).toHex()).not.toBe(generateU(scalarFromNumber(43)).toHex());
        expect(new Mac(t, Generators.G).u.toHex()).toBe(generateU(t).toHex());
    });
});

describe('CredentialIssuerSecretKey', () => {
    // Port of NWabiSabi/WabiSabi.Tests/Crypto/CredentialIssuerKeyTests.cs
    it.each([
        [0, 'w'],
        [1, 'wp'],
        [2, 'x0'],
        [3, 'x1'],
        [4, 'ya'],
    ])('cannot be generated with a zero at position %i (%s)', (zeroIndex, name) => {
        const scalars = [SCALAR_ONE, SCALAR_ONE, SCALAR_ONE, SCALAR_ONE, SCALAR_ONE];
        scalars[zeroIndex] = SCALAR_ZERO;

        expect(() => CredentialIssuerSecretKey.fromRandom(scriptedRandom(scalars))).toThrow(
            `${name} cannot be zero.`,
        );
    });

    it('derives issuer parameters that are not the point at infinity', () => {
        const sk = CredentialIssuerSecretKey.fromRandom(secureRandom);
        const iparams = sk.computeCredentialIssuerParameters();

        expect(iparams.Cw.isInfinity).toBe(false);
        expect(iparams.I.isInfinity).toBe(false);
        expect(sk.asScalarVector()).toEqual([sk.w, sk.wp, sk.x0, sk.x1, sk.ya]);
        expect(iparams.toString()).toContain('Cw:');
    });
});

describe('CredentialIssuerParameters', () => {
    it('rejects the point at infinity', () => {
        expect(() => new CredentialIssuerParameters(GroupElement.INFINITY, Generators.G)).toThrow(
            'Cw cannot be the point at infinity.',
        );
        expect(() => new CredentialIssuerParameters(Generators.G, GroupElement.INFINITY)).toThrow(
            'I cannot be the point at infinity.',
        );
    });
});
