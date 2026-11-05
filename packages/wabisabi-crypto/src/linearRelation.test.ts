import * as Generators from './generators';
import { GroupElement, groupElementSum, multiScalarMultiply } from './groupElement';
import { Equation, Knowledge, Proof, Statement } from './linearRelation';
import {
    SCALAR_ONE,
    SCALAR_ORDER,
    SCALAR_ZERO,
    type Scalar,
    scalarAdd,
    scalarFromNumber,
} from './scalar';

const s = scalarFromNumber;

/** Port of NWabiSabi/WabiSabi.Tests/Crypto/ZeroKnowledge/LinearRelationTests.cs */
describe('Equation', () => {
    it.each([
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
        [1, 2],
        [3, 5],
        [5, 7],
        [7, 11],
        [32767, 4294967295],
        [2147483647, 4294967295],
        [4294967295, 4294967295],
    ])('verifies responses for witness (%i, %i)', (seed1, seed2) => {
        const witness = [s(seed1), s(seed2)];
        const generators = [Generators.G, Generators.Ga];
        const publicPoint = multiScalarMultiply(witness, generators);
        const equation = new Equation(publicPoint, generators);

        const secretNonces = [s(23), s(42)];
        const publicNonce = groupElementSum(
            secretNonces.map((nonce, i) => (generators[i] as GroupElement).multiply(nonce)),
        );
        const challenge = s(101);
        const response = Equation.respond(witness, secretNonces, challenge);
        expect(equation.verify(publicNonce, challenge, response)).toBe(true);

        // A different challenge must be rejected. The exception is a witness term of
        // zero: by the absorption property the response is then the same for the same
        // nonce whatever the challenge.
        if (seed1 !== 0 && seed2 !== 0) {
            expect(equation.verify(publicNonce, s(103), response)).toBe(false);
        }

        // Modifying the response invalidates the equation, unless the public nonce is
        // tweaked to match — which Fiat-Shamir prevents.
        const modifiedResponse = [scalarAdd(response[0] as Scalar, SCALAR_ONE), response[1]!];
        expect(equation.verify(publicNonce, challenge, modifiedResponse)).toBe(false);
        expect(equation.verify(publicNonce.add(Generators.G), challenge, modifiedResponse)).toBe(
            true,
        );

        // A proof made with a different witness must be rejected, including when the
        // challenge is zero (negligible under Fiat-Shamir, but the verifier must still
        // reject because a zero challenge constrains nothing).
        const badWitness = [s(seed1 + 1), s(seed2)];
        expect(
            equation.verify(
                publicNonce,
                challenge,
                Equation.respond(badWitness, secretNonces, challenge),
            ),
        ).toBe(false);
        expect(
            equation.verify(
                publicNonce,
                SCALAR_ZERO,
                Equation.respond(badWitness, secretNonces, SCALAR_ZERO),
            ),
        ).toBe(false);

        // Different secret nonces must also be rejected unless the public nonce is
        // tweaked, which needs a second pre-image attack on the hash.
        const modifiedSecretNonces = [
            scalarAdd(secretNonces[0] as Scalar, SCALAR_ONE),
            secretNonces[1]!,
        ];
        const modifiedNonceResponse = Equation.respond(witness, modifiedSecretNonces, challenge);
        expect(equation.verify(publicNonce, challenge, modifiedNonceResponse)).toBe(false);
        expect(
            equation.verify(publicNonce.add(Generators.G), challenge, modifiedNonceResponse),
        ).toBe(true);
    });

    it('refuses to respond with an unsafe zero secret nonce', () => {
        const x = s(42);
        const knowledge = new Knowledge(Statement.of(Generators.Gg.multiply(x), Generators.Gg), [
            x,
        ]);

        expect(() => knowledge.respondToChallenge(SCALAR_ONE, [SCALAR_ZERO])).toThrow(
            'secretNonce cannot be zero',
        );
    });

    it('ignores witness components whose generator is the point at infinity', () => {
        const generators = [Generators.G, GroupElement.INFINITY];
        const publicPoint = Generators.G.multiply(s(42));
        const equation = new Equation(publicPoint, generators);

        const witness1 = [s(42), s(23)];
        const witness2 = [s(42), s(100)];

        // A single shared nonce — catastrophic in production, intentional here so the
        // two responses are comparable.
        const secretNonces = [s(7), s(11)];
        const publicNonce = groupElementSum(
            secretNonces.map((nonce, i) => (generators[i] as GroupElement).multiply(nonce)),
        );
        const challenge = s(13);

        const response1 = Equation.respond(witness1, secretNonces, challenge);
        const response2 = Equation.respond(witness2, secretNonces, challenge);
        expect(equation.verify(publicNonce, challenge, response1)).toBe(true);
        expect(equation.verify(publicNonce, challenge, response2)).toBe(true);
        expect(response1).not.toEqual(response2);
        expect(response1[0]).toBe(response2[0]);
    });
});

describe('Statement and Knowledge', () => {
    const x = s(42);
    const a = Generators.Gg.multiply(x);
    const b = Generators.Gh.multiply(x);

    it('proves discrete log equality (Chaum-Pedersen)', () => {
        const statement = new Statement([
            [a, Generators.Gg],
            [b, Generators.Gh],
        ]);
        const challenge = s(13);
        const knowledge = new Knowledge(statement, [x]);
        const secretNonces = [s(7)];
        const publicNonces = statement.equations.map(equation =>
            multiScalarMultiply(secretNonces, equation.generators),
        );
        const responses = knowledge.respondToChallenge(challenge, secretNonces);

        expect(responses).toHaveLength(1);
        expect(statement.checkVerificationEquation(publicNonces, challenge, responses)).toBe(true);
        expect(statement.checkVerificationEquation(publicNonces, s(17), responses)).toBe(false);

        const modifiedNonces = [
            publicNonces[0]!.add(Generators.Gg),
            publicNonces[1]!.add(Generators.Gh),
        ];
        const modifiedResponses = responses.map(response => scalarAdd(response, SCALAR_ONE));
        expect(
            statement.checkVerificationEquation(modifiedNonces, challenge, modifiedResponses),
        ).toBe(true);
        expect(statement.checkVerificationEquation(modifiedNonces, challenge, responses)).toBe(
            false,
        );
        expect(
            statement.checkVerificationEquation(publicNonces, challenge, modifiedResponses),
        ).toBe(false);
    });

    it('rejects a witness whose size does not match the statement', () => {
        const statement = new Statement([
            [a, Generators.Gg],
            [b, Generators.Gh],
        ]);

        expect(() => new Knowledge(statement, [SCALAR_ZERO, SCALAR_ZERO])).toThrow(
            'size does not match',
        );
    });

    it('rejects a witness that is not a solution', () => {
        const statement = new Statement([
            [a, Generators.Gg],
            [b, Generators.Gh],
        ]);

        expect(() => new Knowledge(statement, [SCALAR_ONE]).assertSoundness()).toThrow(
            'witness is not solution of the equation',
        );

        const badStatement = new Statement([
            [a, Generators.Gh],
            [b, Generators.Gg],
        ]);
        expect(() => new Knowledge(badStatement, [SCALAR_ONE]).assertSoundness()).toThrow(
            'witness is not solution of the equation',
        );
    });

    it('accepts a correct witness', () => {
        const statement = new Statement([
            [a, Generators.Gg],
            [b, Generators.Gh],
        ]);

        expect(() => new Knowledge(statement, [x]).assertSoundness()).not.toThrow();
    });

    // Port of `KnowledgeThrows` in KnowledgeOfRepTests.cs
    it('rejects mismatched generators and secrets', () => {
        const two = s(2);
        const three = s(3);
        const point = Generators.G.multiply(two).add(Generators.Ga.multiply(three));

        expect(
            () => new Knowledge(Statement.of(point, Generators.Gg, Generators.Ga), [two]),
        ).toThrow('size does not match');
        expect(() => new Statement([[point]])).toThrow('at least one generator');
        expect(() => new Knowledge(Statement.of(point, Generators.Gg), [two, three])).toThrow(
            'size does not match',
        );
        expect(
            () =>
                new Knowledge(Statement.of(point, Generators.G, Generators.Ga, Generators.Gg), [
                    two,
                    three,
                ]),
        ).toThrow('size does not match');
    });

    it('rejects a statement with mismatched nonce count', () => {
        const statement = new Statement([
            [a, Generators.Gg],
            [b, Generators.Gh],
        ]);

        expect(() => statement.checkVerificationEquation([a], s(13), [x])).toThrow(
            'one nonce per equation',
        );
    });

    it('fills unset cells with the point at infinity', () => {
        const statement = new Statement([[a, Generators.Gg, undefined]]);

        expect(statement.equations[0]!.generators[1]!.isInfinity).toBe(true);
        expect(statement.generators).toHaveLength(2);
        expect(statement.publicPoints).toEqual([a]);
    });

    it('rejects a challenge of zero, which constrains nothing', () => {
        const equation = new Equation(a, [Generators.Gg]);

        expect(equation.verify(Generators.Gg, SCALAR_ZERO, [x])).toBe(false);
    });

    it('wraps responses modulo the group order', () => {
        const response = Equation.respond([SCALAR_ONE], [SCALAR_ORDER - 1n], SCALAR_ONE);

        expect(response).toEqual([SCALAR_ZERO]);
    });
});

describe('Proof', () => {
    it('rejects empty nonces, infinite nonces and empty responses', () => {
        expect(() => new Proof([], [SCALAR_ONE])).toThrow('cannot be empty');
        expect(() => new Proof([GroupElement.INFINITY], [SCALAR_ONE])).toThrow('point at infinity');
        expect(() => new Proof([Generators.G], [])).toThrow('responses cannot be empty');
    });
});
