import * as Generators from './generators';
import { type GroupElement, multiScalarMultiply } from './groupElement';
import { type Scalar } from './scalar';

/**
 * `ProofSystem.PedersenCommitment` — `s*Gg + b*Gh`.
 *
 * Lives in its own module because both `Credential.present` and `ProofSystem` need it,
 * and upstream's placement inside `ProofSystem` would make that a cycle here.
 */
export const pedersenCommitment = (s: Scalar, b: Scalar): GroupElement =>
    multiScalarMultiply([s, b], [Generators.Gg, Generators.Gh]);
