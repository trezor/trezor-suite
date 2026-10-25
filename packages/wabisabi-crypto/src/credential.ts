import { pedersenCommitment } from './commitment';
import * as Generators from './generators';
import { type GroupElement } from './groupElement';
import { type Mac } from './mac';
import { type Scalar, scalarFromNumber } from './scalar';

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/ZeroKnowledge/CredentialPresentation.cs`.
 *
 * A randomized credential, i.e. the tuple of group elements presented to the
 * coordinator.
 */
export class CredentialPresentation {
    constructor(
        /** Randomized amount commitment component. */
        readonly ca: GroupElement,
        /** Randomized MAC's U component. */
        readonly cx0: GroupElement,
        /** Randomized MAC's (t * U) component. */
        readonly cx1: GroupElement,
        /** Randomized MAC's V component. */
        readonly cV: GroupElement,
        /** Credential's randomness hidden behind a discrete logarithm. */
        readonly s: GroupElement,
    ) {}
}

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/ZeroKnowledge/Credential.cs`.
 *
 * An anonymous credential and the data it represents. Credentials hold the blinding
 * factors for a round, so they are never serialized and never cross IPC.
 */
export class Credential {
    constructor(
        /** Amount represented by the credential. */
        readonly value: number,
        /** Randomness used as the blinding factor for the Pedersen committed amount. */
        readonly randomness: Scalar,
        /** Algebraic MAC representing the credential issued by the coordinator. */
        readonly mac: Mac,
    ) {
        if (!Number.isInteger(value) || value < 0) {
            throw new Error(`A credential value must be a non-negative integer, got ${value}.`);
        }
    }

    /** Randomizes the credential using a randomization scalar `z`. */
    present(z: Scalar): CredentialPresentation {
        const randomize = (g: GroupElement, m: GroupElement) => m.add(g.multiply(z));

        return new CredentialPresentation(
            randomize(
                Generators.Ga,
                pedersenCommitment(scalarFromNumber(this.value), this.randomness),
            ),
            randomize(Generators.Gx0, this.mac.u),
            randomize(Generators.Gx1, this.mac.u.multiply(this.mac.t)),
            randomize(Generators.GV, this.mac.v),
            Generators.Gs.multiply(this.randomness),
        );
    }
}

/** Port of `NWabiSabi/WabiSabi/IssuanceRequest.cs`. */
export class IssuanceRequest {
    constructor(
        /** Pedersen commitment to the credential amount. */
        readonly ma: GroupElement,
        /** Pedersen commitments to the credential amount's binary decomposition. */
        readonly bitCommitments: readonly GroupElement[],
    ) {}
}

/** Port of `NWabiSabi/WabiSabi/IssuanceValidationData.cs`. */
export class IssuanceValidationData {
    constructor(
        /** Amount committed in the Pedersen commitment `ma`. */
        readonly value: number,
        /** Randomness used as the blinding factor in `ma`. */
        readonly randomness: Scalar,
        /** Pedersen commitment to the amount used to request the credential. */
        readonly ma: GroupElement,
    ) {}
}
