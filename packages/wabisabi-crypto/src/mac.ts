import { type GroupElement, groupElementFromBuffer } from './groupElement';
import { type Scalar, scalarIsZero, scalarToBytes } from './scalar';

/** `MAC.GenerateU(Scalar t)` — the iterated-SHA256 lift of the MAC nonce. */
export const generateU = (t: Scalar): GroupElement => groupElementFromBuffer(scalarToBytes(t));

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/Mac.cs`.
 *
 * The algebraic MAC the coordinator issues; `t` is the nonce it picked and `v` the tag.
 */
export class Mac {
    /**
     * Memoized `U`.
     *
     * Upstream recomputes `GenerateU(T)` on every access, which is an iterated SHA-256
     * lift plus a square root. `Mac` is immutable and `U` is read several times per
     * credential presentation and per issuer-parameters statement, so it is cached.
     */
    private cachedU?: GroupElement;

    constructor(
        readonly t: Scalar,
        readonly v: GroupElement,
    ) {
        if (scalarIsZero(t)) {
            throw new Error('t cannot be zero.');
        }
        if (v.isInfinity) {
            throw new Error('v cannot be the point at infinity.');
        }
    }

    get u(): GroupElement {
        this.cachedU ??= generateU(this.t);

        return this.cachedU;
    }

    equals(other: Mac) {
        return this.t === other.t && this.v.equals(other.v);
    }
}
