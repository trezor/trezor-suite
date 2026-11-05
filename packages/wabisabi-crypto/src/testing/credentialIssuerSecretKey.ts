import { CredentialIssuerParameters } from '../credentialIssuerParameters';
import * as Generators from '../generators';
import { type Random } from '../random';
import { type Scalar, scalarIsZero } from '../scalar';

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/CredentialIssuerSecretKey.cs`.
 *
 * The coordinator's secret key. Suite never holds one in production — it only ever
 * sees the derived `CredentialIssuerParameters` — so this lives behind `src/testing`
 * together with the issuer it belongs to.
 */
export class CredentialIssuerSecretKey {
    constructor(
        readonly w: Scalar,
        readonly wp: Scalar,
        readonly x0: Scalar,
        readonly x1: Scalar,
        readonly ya: Scalar,
    ) {
        Object.entries({ w, wp, x0, x1, ya }).forEach(([name, value]) => {
            if (scalarIsZero(value)) {
                throw new Error(`${name} cannot be zero.`);
            }
        });
    }

    static fromRandom(random: Random) {
        return new CredentialIssuerSecretKey(
            random.getScalar(),
            random.getScalar(),
            random.getScalar(),
            random.getScalar(),
            random.getScalar(),
        );
    }

    computeCredentialIssuerParameters() {
        return new CredentialIssuerParameters(
            Generators.Gw.multiply(this.w).add(Generators.Gwp.multiply(this.wp)),
            Generators.GV.subtract(
                Generators.Gx0.multiply(this.x0)
                    .add(Generators.Gx1.multiply(this.x1))
                    .add(Generators.Ga.multiply(this.ya)),
            ),
        );
    }

    asScalarVector(): Scalar[] {
        return [this.w, this.wp, this.x0, this.x1, this.ya];
    }
}
