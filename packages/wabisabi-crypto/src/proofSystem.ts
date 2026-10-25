import { pedersenCommitment } from './commitment';
import { type Credential, type CredentialPresentation } from './credential';
import { type CredentialIssuerParameters } from './credentialIssuerParameters';
import * as Generators from './generators';
import { type GroupElement, multiScalarMultiply } from './groupElement';
import { Knowledge, Proof, Statement } from './linearRelation';
import { type Mac } from './mac';
import { type Random } from './random';
import { type Scalar, scalarFromNumber, scalarMultiply, scalarNegate } from './scalar';
import { type Transcript } from './transcript';

/** `private static GroupElement O = GroupElement.Infinity;` */
const O = undefined;

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/ZeroKnowledge/ProofSystem.cs`.
 */

export const prove = (
    transcript: Transcript,
    knowledge: readonly Knowledge[],
    random: Random,
): Proof[] => {
    // Before anything else all components in a compound proof commit to the individual
    // sub-statement that will be proven, ensuring that the challenges and therefore the
    // responses depend on the statement as a whole.
    for (const k of knowledge) {
        transcript.commitStatement(k.statement);
    }

    const deferred: ((challenge: Scalar) => Proof)[] = [];
    for (const k of knowledge) {
        // With all the statements committed, generate a vector of random secret nonces
        // for every equation in the underlying proof system. These are synthetic nonces
        // that also depend on the witness data, so that an insecure RNG cannot reuse a
        // nonce across challenges and leak the witness.
        const secretNonceProvider = transcript.createSyntheticSecretNonceProvider(
            k.witness,
            random,
        );
        const secretNonces = secretNonceProvider.getScalarVector();

        // The prover then commits to these, adding the corresponding public points to
        // the transcript.
        const publicNonces = k.statement.equations.map(equation =>
            multiScalarMultiply(secretNonces, equation.generators),
        );
        transcript.commitPublicNonces(publicNonces);

        deferred.push(
            challenge => new Proof(publicNonces, k.respondToChallenge(challenge, secretNonces)),
        );
    }

    // With the public nonces committed to the transcript the prover can derive a
    // challenge that depends on the transcript state without interacting with the
    // verifier, while still not knowing it before the commitments were generated.
    const challenge = transcript.generateChallenge();

    return deferred.map(createProof => createProof(challenge));
};

export const verify = (
    transcript: Transcript,
    statements: readonly Statement[],
    proofs: readonly Proof[],
): boolean => {
    if (proofs.length !== statements.length) {
        throw new Error('proofs must have the same length as statements.');
    }

    for (const statement of statements) {
        transcript.commitStatement(statement);
    }

    // This is done separately from the statement commitments because the prover derives
    // the nonces from the compound statement, and the verifier must add data to the
    // transcript in the same order as the prover.
    for (const proof of proofs) {
        transcript.commitPublicNonces(proof.publicNonces);
    }

    const challenge = transcript.generateChallenge();

    return statements.every((statement, index) => {
        const proof = proofs[index] as Proof;

        return statement.checkVerificationEquation(proof.publicNonces, challenge, proof.responses);
    });
};

export const issuerParametersStatement = (
    iparams: CredentialIssuerParameters,
    mac: Mac,
    ma: GroupElement,
) =>
    new Statement([
        // public                                                  Witness terms:
        // point                        w,             wp,             x0,             x1,             ya
        [mac.v, Generators.Gw, O, mac.u, mac.u.multiply(mac.t), ma],
        [Generators.GV.subtract(iparams.I), O, O, Generators.Gx0, Generators.Gx1, Generators.Ga],
        [iparams.Cw, Generators.Gw, Generators.Gwp, O, O, O],
    ]);

export const showCredentialStatement = (
    c: CredentialPresentation,
    z: GroupElement,
    iparams: CredentialIssuerParameters,
) =>
    new Statement([
        // public         Witness terms:
        // point          z               z0              t               a               r
        [z, iparams.I, O, O, O, O],
        [c.cx1, Generators.Gx1, Generators.Gx0, c.cx0, O, O],
        [c.ca, Generators.Ga, O, O, Generators.Gg, Generators.Gh],
        [c.s, O, O, O, O, Generators.Gs],
    ]);

export const showCredentialKnowledge = (
    presentation: CredentialPresentation,
    z: Scalar,
    credential: Credential,
    iparams: CredentialIssuerParameters,
) =>
    new Knowledge(showCredentialStatement(presentation, iparams.I.multiply(z), iparams), [
        z,
        scalarNegate(scalarMultiply(credential.mac.t, z)),
        credential.mac.t,
        scalarFromNumber(credential.value),
        credential.randomness,
    ]);

/**
 * Balance commitment must be a commitment to 0, with randomness in Gh and additional
 * randomness from attribute randomization in the Show protocol, using generator Ga.
 * Witness terms: `(\sum z, \sum r_i - r'_i)`.
 */
export const balanceProofStatement = (balanceCommitment: GroupElement) =>
    Statement.of(balanceCommitment, Generators.Ga, Generators.Gh);

export const balanceProofKnowledge = (zSum: Scalar, rDeltaSum: Scalar) =>
    new Knowledge(
        balanceProofStatement(Generators.Ga.multiply(zSum).add(Generators.Gh.multiply(rDeltaSum))),
        [zSum, rDeltaSum],
    );

export { pedersenCommitment } from './commitment';

/**
 * `ProofSystem.RangeProofStatement`.
 *
 * Two equations per bit plus one for the sum; three witness columns per bit plus one
 * for the Ma randomness, plus one column for the public inputs. Unset cells are the
 * point at infinity.
 */
export const rangeProofStatement = (
    ma: GroupElement,
    bitCommitments: readonly GroupElement[],
    width: number,
) => {
    if (width < 0 || width > 255) {
        throw new Error(`width out of range: ${width}.`);
    }
    const b = bitCommitments;
    if (b.length !== width) {
        throw new Error(`Expected ${width} bit commitments, got ${b.length}.`);
    }

    const rows = width * 2 + 1;
    const columns = width * 3 + 1 + 1;

    const equations: (GroupElement | undefined)[][] = Array.from({ length: rows }, () =>
        new Array<GroupElement | undefined>(columns).fill(O),
    );

    // Proof of [ ( \sum 2^i * B_i ) - Ma = (\sum 2^i r_i)*Gh - r*Gh ]: the bit
    // commitments, if they are bits (proven in the subsequent equations), are a
    // decomposition of the amount committed in Ma.
    const powersOfTwo = Generators.ScalarPowersOfTwo.slice(0, width);
    const bitsTotal = multiScalarMultiply(powersOfTwo, b);

    const firstRow = equations[0] as (GroupElement | undefined)[];
    firstRow[0] = ma.subtract(bitsTotal);
    firstRow[1] = Generators.Gh; // first witness term is r in Ma = a*Gg + r*Gh

    // The witness structure is `r, zip3(b_i, r_i, rb_i)`.
    const bitColumn = (i: number) => 3 * i + 2;
    const rndColumn = (i: number) => bitColumn(i) + 1;
    const productColumn = (i: number) => bitColumn(i) + 2;
    const bitRepresentationRow = (i: number) => 2 * i + 1;
    const bitSquaredRow = (i: number) => bitRepresentationRow(i) + 1;

    const negatedGh = Generators.NegatedGh;
    for (let i = 0; i < width; i++) {
        // Add [ -r_i * 2^i * Gh ] term to the first equation.
        firstRow[rndColumn(i)] = Generators.NegatedGhPowersOfTwo[i];

        // [ B = b*Gg + r*Gh ] — B is a Pedersen commitment to b.
        const representationRow = equations[bitRepresentationRow(i)] as (
            GroupElement | undefined
        )[];
        representationRow[0] = b[i];
        representationRow[bitColumn(i)] = Generators.Gg;
        representationRow[rndColumn(i)] = Generators.Gh;

        // [ O = b*(B - Gg) - rb*Gh ] — proves `b = b*b`, i.e. `b \in {0,1}`.
        const squaredRow = equations[bitSquaredRow(i)] as (GroupElement | undefined)[];
        squaredRow[bitColumn(i)] = (b[i] as GroupElement).subtract(Generators.Gg);
        squaredRow[productColumn(i)] = negatedGh;
    }

    return new Statement(equations);
};

/**
 * Overload for bootstrap credential request proofs; this is just a range proof with
 * `width = 0`, equivalent to a proof of representation with respect to Gh.
 */
export const zeroProofStatement = (ma: GroupElement) => rangeProofStatement(ma, [], 0);

export const zeroProofKnowledge = (ma: GroupElement, r: Scalar) =>
    new Knowledge(zeroProofStatement(ma), [r]);

export const rangeProofKnowledge = (
    a: Scalar,
    r: Scalar,
    width: number,
    random: Random,
): { knowledge: Knowledge; bitCommitments: GroupElement[] } => {
    const ma = pedersenCommitment(a, r);
    const bits = Array.from({ length: width }, (_, i) => ((a >> BigInt(i)) & 1n) as Scalar);

    const randomness = Array.from({ length: width }, () => random.getScalar());
    const bitCommitments = bits.map((bit, index) =>
        pedersenCommitment(bit, randomness[index] as Scalar),
    );

    const columns = width * 3 + 1; // three witness terms per bit and one for the commitment
    const bitColumn = (i: number) => 3 * i + 1;
    const rndColumn = (i: number) => bitColumn(i) + 1;
    const productColumn = (i: number) => bitColumn(i) + 2;

    // First term is r from Ma = a*Gg + r*Gh, followed by three witness terms per bit
    // commitment: the bit b_i, the randomness r_i, and their product rb_i.
    const witness = new Array<Scalar>(columns).fill(0n);
    witness[0] = r;
    for (let i = 0; i < width; i++) {
        const bit = bits[i] as Scalar;
        const rnd = randomness[i] as Scalar;
        witness[bitColumn(i)] = bit;
        witness[rndColumn(i)] = rnd;
        witness[productColumn(i)] = scalarMultiply(rnd, bit);
    }

    return {
        knowledge: new Knowledge(rangeProofStatement(ma, bitCommitments, width), witness),
        bitCommitments,
    };
};
