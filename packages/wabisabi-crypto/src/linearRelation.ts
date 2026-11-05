import { GroupElement, multiScalarMultiply } from './groupElement';
import {
    type Scalar,
    scalarIsZero,
    scalarNegate,
    scalarVectorAdd,
    scalarVectorScale,
} from './scalar';

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/ZeroKnowledge/LinearRelation/Equation.cs`.
 *
 * Each proof of a linear relation consists of multiple knowledge-of-representation
 * equations, all sharing a single witness comprised of several secret scalars:
 *
 *     P_i = x_1 * G_{i,1} + x_2 * G_{i,2} + ... + x_n * G_{i,n}
 *
 * Some of the generators for an equation can be the point at infinity, when a term in
 * the witness does not play a part in the representation of a specific point.
 */
export class Equation {
    constructor(
        readonly publicPoint: GroupElement,
        readonly generators: readonly GroupElement[],
    ) {}

    /** Evaluate the verification equation corresponding to the one in the statement. */
    verify(publicNonce: GroupElement, challenge: Scalar, responses: readonly Scalar[]): boolean {
        // A challenge of 0 does not place any constraint on the witness.
        if (scalarIsZero(challenge)) {
            return false;
        }

        // The verification equation (for the one generator case) is:
        //   sG =? R + eP
        // where:
        //   - R = kG is the public nonce, k is the secret nonce
        //   - P = xG is the public input, x is the secret
        //   - e is the challenge
        //   - s is the response
        //
        // Rearranged to `(s*G) + (-e)*P =? R` so that the challenge term is folded into
        // the same sum rather than costing a separate multiplication. Exact group
        // arithmetic either way, and it matters: a 42-bit range proof statement has 85
        // equations, and `P` is a fresh point with no precomputed table, so the separate
        // form paid for 85 of the most expensive kind of multiplication there is.
        return multiScalarMultiply(
            [...responses, scalarNegate(challenge)],
            [...this.generators, this.publicPoint],
        ).equals(publicNonce);
    }

    /**
     * Given a witness and secret nonces, respond to a challenge proving the equation
     * holds with respect to the witness: `s = k + ex`.
     */
    static respond(
        witness: readonly Scalar[],
        secretNonces: readonly Scalar[],
        challenge: Scalar,
    ): Scalar[] {
        // Blinding terms are required in order to protect the witness (unless the
        // challenge is 0), so only respond if that is the case.
        for (const secretNonce of secretNonces) {
            if (scalarIsZero(secretNonce)) {
                throw new Error('secretNonce cannot be zero.');
            }
        }

        return scalarVectorAdd(secretNonces, scalarVectorScale(challenge, witness));
    }

    checkSolution(witness: readonly Scalar[]) {
        if (!this.publicPoint.equals(multiScalarMultiply(witness, this.generators))) {
            throw new Error('witness is not solution of the equation');
        }
    }
}

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/ZeroKnowledge/LinearRelation/Statement.cs`.
 *
 * Built from a table whose first column holds each equation's public point and whose
 * remaining columns hold the generators. Upstream leaves unset cells as `null` and
 * coalesces them to the point at infinity; here the table holds `undefined` for those.
 */
export class Statement {
    readonly equations: readonly Equation[];

    constructor(equations: readonly (readonly (GroupElement | undefined)[])[]) {
        const terms = equations[0]?.length ?? 0;
        if (terms < 2) {
            throw new Error(
                'Invalid terms. It needs to have at least one generator and one public point.',
            );
        }
        this.equations = equations.map(
            row =>
                new Equation(
                    row[0] ?? GroupElement.INFINITY,
                    Array.from(
                        { length: terms - 1 },
                        (_, index) => row[index + 1] ?? GroupElement.INFINITY,
                    ),
                ),
        );
    }

    /** `new Statement(GroupElement publicPoint, IEnumerable<GroupElement> generators)`. */
    static of(publicPoint: GroupElement, ...generators: GroupElement[]) {
        return new Statement([[publicPoint, ...generators]]);
    }

    get publicPoints(): GroupElement[] {
        return this.equations.map(equation => equation.publicPoint);
    }

    get generators(): GroupElement[] {
        return this.equations.flatMap(equation => [...equation.generators]);
    }

    checkVerificationEquation(
        publicNonces: readonly GroupElement[],
        challenge: Scalar,
        responses: readonly Scalar[],
    ): boolean {
        // There should be one nonce per equation. Upstream guards rather than
        // returning false, so a response with the wrong shape throws.
        if (this.equations.length !== publicNonces.length) {
            throw new Error('publicNonces must hold one nonce per equation.');
        }

        return this.equations.every((equation, index) =>
            equation.verify(publicNonces[index] as GroupElement, challenge, responses),
        );
    }
}

/** Port of `NWabiSabi/WabiSabi/Crypto/ZeroKnowledge/LinearRelation/Knowledge.cs`. */
export class Knowledge {
    constructor(
        readonly statement: Statement,
        readonly witness: readonly Scalar[],
    ) {
        const expected = statement.equations[0]?.generators.length ?? 0;
        if (witness.length !== expected) {
            throw new Error('witness size does not match statement.equations');
        }
    }

    respondToChallenge(challenge: Scalar, secretNonces: readonly Scalar[]): Scalar[] {
        return Equation.respond(this.witness, secretNonces, challenge);
    }

    /** For testing purposes. */
    assertSoundness() {
        for (const equation of this.statement.equations) {
            equation.checkSolution(this.witness);
        }
    }
}

/** Port of `NWabiSabi/WabiSabi/Crypto/ZeroKnowledge/Proof.cs`. */
export class Proof {
    constructor(
        readonly publicNonces: readonly GroupElement[],
        readonly responses: readonly Scalar[],
    ) {
        if (publicNonces.length === 0 || publicNonces.some(nonce => nonce.isInfinity)) {
            throw new Error('publicNonces cannot be empty or contain the point at infinity.');
        }
        if (responses.length === 0) {
            throw new Error('responses cannot be empty.');
        }
    }
}
