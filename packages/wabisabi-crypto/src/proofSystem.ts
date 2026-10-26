import { pedersenCommitment } from './commitment';
import { type Credential, type CredentialPresentation } from './credential';
import { type CredentialIssuerParameters } from './credentialIssuerParameters';
import * as Generators from './generators';
import { type GroupElement, multiScalarMultiply } from './groupElement';
import { Knowledge, Proof, Statement } from './linearRelation';
import { type Mac } from './mac';
import { type Random } from './random';
import { type Scalar, scalarFromNumber, scalarMultiply, scalarNegate, scalarSum } from './scalar';
import { type Transcript } from './transcript';

/** `private static GroupElement O = GroupElement.Infinity;` */
const O = undefined;

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/ZeroKnowledge/ProofSystem.cs`.
 */

/**
 * `ProofSystem.Prove`, split into the steps it is made of.
 *
 * One statement commitment or one statement's nonces per step, which is the finest
 * grain the protocol allows: the challenge depends on the whole compound statement, so
 * nothing can be finished before everything is committed. Measured on a mainnet amount
 * request (two width-42 range proofs, two credential presentations and a balance proof),
 * the largest step is about 70 ms — under the budget for a single synchronous
 * computation, which is why `proveWithYields` exists at all. The body is shared so the
 * synchronous and the yielding driver cannot drift apart.
 */
const proveSteps = (transcript: Transcript, knowledge: readonly Knowledge[], random: Random) => {
    const steps: (() => void)[] = [];

    // Before anything else all components in a compound proof commit to the individual
    // sub-statement that will be proven, ensuring that the challenges and therefore the
    // responses depend on the statement as a whole.
    for (const k of knowledge) {
        steps.push(() => transcript.commitStatement(k.statement));
    }

    const deferred: ((challenge: Scalar) => Proof)[] = [];
    for (const k of knowledge) {
        steps.push(() => {
            // With all the statements committed, generate a vector of random secret
            // nonces for every equation in the underlying proof system. These are
            // synthetic nonces that also depend on the witness data, so that an insecure
            // RNG cannot reuse a nonce across challenges and leak the witness.
            const secretNonceProvider = transcript.createSyntheticSecretNonceProvider(
                k.witness,
                random,
            );
            const secretNonces = secretNonceProvider.getScalarVector();

            // The prover then commits to these, adding the corresponding public points
            // to the transcript.
            const publicNonces = k.statement.equations.map(equation =>
                multiScalarMultiply(secretNonces, equation.generators),
            );
            transcript.commitPublicNonces(publicNonces);

            deferred.push(
                challenge => new Proof(publicNonces, k.respondToChallenge(challenge, secretNonces)),
            );
        });
    }

    // With the public nonces committed to the transcript the prover can derive a
    // challenge that depends on the transcript state without interacting with the
    // verifier, while still not knowing it before the commitments were generated.
    const finish = () => {
        const challenge = transcript.generateChallenge();

        return deferred.map(createProof => createProof(challenge));
    };

    return { steps, finish };
};

export const prove = (
    transcript: Transcript,
    knowledge: readonly Knowledge[],
    random: Random,
): Proof[] => {
    const { steps, finish } = proveSteps(transcript, knowledge, random);
    steps.forEach(step => step());

    return finish();
};

/**
 * `prove`, handing the event loop back between steps.
 *
 * Same steps in the same order off the same randomness, so the proofs are identical to
 * `prove`'s — `wabiSabiClient.test.ts` pins that against the deterministic PRNG. What it
 * buys is that a phase does not block the Electron main process, which also serves
 * device IPC, for the whole length of a credential request.
 */
export const proveWithYields = async (
    transcript: Transcript,
    knowledge: readonly Knowledge[],
    random: Random,
    yieldToCaller: () => Promise<void>,
): Promise<Proof[]> => {
    const { steps, finish } = proveSteps(transcript, knowledge, random);
    for (const step of steps) {
        step();
        await yieldToCaller();
    }

    return finish();
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
        // `t * U` is public on both sides (the coordinator sends `T` in the response), and
        // upstream's `Scalar * GroupElement` is libsecp's variable-time `ecmult`, so this
        // is the faithful multiplication as well as the cheap one — it was 4 of the 17 ms
        // a `get-credentials` call took.
        [mac.v, Generators.Gw, O, mac.u, mac.u.multiplyUnsafe(mac.t), ma],
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
 *
 * `knownBitsTotal` is the prover's shortcut for `\sum 2^i * B_i`, see
 * `rangeProofKnowledge`. A verifier has only the public bit commitments and leaves it
 * unset.
 */
export const rangeProofStatement = (
    ma: GroupElement,
    bitCommitments: readonly GroupElement[],
    width: number,
    knownBitsTotal?: GroupElement,
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
    const bitsTotal = knownBitsTotal ?? multiScalarMultiply(powersOfTwo, b);

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

    // The statement's first equation needs `\sum 2^i * B_i`, which a verifier can only
    // get by multiplying each public bit commitment — 42 multiplications of points that
    // have no precomputed table, a third of what a mainnet amount request costs. The
    // prover knows the openings, and `B_i = b_i*Gg + r_i*Gh` gives
    // `\sum 2^i * B_i = (\sum 2^i b_i)*Gg + (\sum 2^i r_i)*Gh`: the same group element
    // from two multiplications of generators that do have tables. The sums are taken
    // over the bits rather than assuming they add back up to `a`, so a value wider than
    // the proof still produces the statement its own bit commitments determine (an
    // invalid one, as upstream would also produce).
    const powersOfTwo = Generators.ScalarPowersOfTwo.slice(0, width);
    const bitsValue = scalarSum(
        bits.map((bit, i) => scalarMultiply(bit, powersOfTwo[i] as Scalar)),
    );
    const bitsRandomness = scalarSum(
        randomness.map((r, i) => scalarMultiply(r, powersOfTwo[i] as Scalar)),
    );
    const bitsTotal = pedersenCommitment(bitsValue, bitsRandomness);

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
        knowledge: new Knowledge(
            rangeProofStatement(ma, bitCommitments, width, bitsTotal),
            witness,
        ),
        bitCommitments,
    };
};
