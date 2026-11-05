import { Credential } from './credential';
import * as Generators from './generators';
import { GroupElement, groupElementsEqual, multiScalarMultiply } from './groupElement';
import { Knowledge, Proof, Statement } from './linearRelation';
import * as ProofSystem from './proofSystem';
import { type Random, secureRandom } from './random';
import {
    SCALAR_ONE,
    SCALAR_ORDER,
    SCALAR_ZERO,
    type Scalar,
    scalarAdd,
    scalarFromNumber,
    scalarNegate,
} from './scalar';
import {
    CredentialIssuerSecretKey,
    computeMac,
    computeZ,
    constantRandom,
    issuerParametersKnowledge,
} from './testing';
import { Transcript } from './transcript';

const s = scalarFromNumber;
const rnd = secureRandom;

/** Port of `NWabiSabi/WabiSabi.Tests/Crypto/ProofSystemHelpers.cs`. */
const emptyTranscript = () => new Transcript(new Uint8Array(0));

const prove = (knowledge: Knowledge, random: Random = rnd) =>
    ProofSystem.prove(emptyTranscript(), [knowledge], random)[0] as Proof;

const verify = (statement: Statement, proof: Proof) =>
    ProofSystem.verify(emptyTranscript(), [statement], [proof]);

/** Port of NWabiSabi/WabiSabi.Tests/Crypto/ProofSystemTests.cs */
describe('ProofSystem', () => {
    it('can prove and verify a MAC', () => {
        const credentialIssuerKey = CredentialIssuerSecretKey.fromRandom(rnd);
        const credentialIssuerParameters = credentialIssuerKey.computeCredentialIssuerParameters();

        const amount = s(10_000);
        const r = rnd.getScalar();
        const ma = Generators.G.multiply(amount).add(Generators.Gh.multiply(r));

        const t = rnd.getScalar();
        const mac = computeMac(credentialIssuerKey, ma, t);

        const proofOfMac = prove(issuerParametersKnowledge(mac, ma, credentialIssuerKey));

        const clientStatement = ProofSystem.issuerParametersStatement(
            credentialIssuerParameters,
            mac,
            ma,
        );
        expect(verify(clientStatement, proofOfMac)).toBe(true);

        const corruptedResponses = [...proofOfMac.responses].reverse();
        expect(
            verify(clientStatement, new Proof(proofOfMac.publicNonces, corruptedResponses)),
        ).toBe(false);

        const corruptedNonces = [...proofOfMac.publicNonces].reverse();
        expect(verify(clientStatement, new Proof(corruptedNonces, proofOfMac.responses))).toBe(
            false,
        );
    });

    it('can prove and verify a MAC show', () => {
        const credentialIssuerKey = CredentialIssuerSecretKey.fromRandom(rnd);
        const credentialIssuerParameters = credentialIssuerKey.computeCredentialIssuerParameters();

        const amount = 10_000;
        const r = rnd.getScalar();
        const ma = Generators.Gg.multiply(s(amount)).add(Generators.Gh.multiply(r));
        const t = rnd.getScalar();
        const mac = computeMac(credentialIssuerKey, ma, t);

        const credential = new Credential(amount, r, mac);
        const z = rnd.getScalar();
        const randomizedCredential = credential.present(z);
        const knowledge = ProofSystem.showCredentialKnowledge(
            randomizedCredential,
            z,
            credential,
            credentialIssuerParameters,
        );
        const proofOfMacShow = prove(knowledge);

        const capitalZ = computeZ(randomizedCredential, credentialIssuerKey);
        expect(capitalZ.equals(credentialIssuerParameters.I.multiply(z))).toBe(true);

        const statement = ProofSystem.showCredentialStatement(
            randomizedCredential,
            capitalZ,
            credentialIssuerParameters,
        );
        expect(verify(statement, proofOfMacShow)).toBe(true);
    });

    it('can prove and verify a presented balance', () => {
        const a = s(10_000);
        const r = rnd.getScalar();
        const z = rnd.getScalar();
        const ca = Generators.Ga.multiply(z)
            .add(Generators.Gg.multiply(a))
            .add(Generators.Gh.multiply(r));

        const proofOfBalance = prove(ProofSystem.balanceProofKnowledge(z, r));

        expect(
            verify(
                ProofSystem.balanceProofStatement(ca.subtract(Generators.Gg.multiply(a))),
                proofOfBalance,
            ),
        ).toBe(true);
        expect(
            verify(
                ProofSystem.balanceProofStatement(
                    ca.add(Generators.Gg).subtract(Generators.Gg.multiply(a)),
                ),
                proofOfBalance,
            ),
        ).toBe(false);
        expect(verify(ProofSystem.balanceProofStatement(ca), proofOfBalance)).toBe(false);
    });

    it('can prove and verify a requested balance', () => {
        const a = s(10_000);
        const r = rnd.getScalar();
        const ma = Generators.Gg.multiply(a).add(Generators.Gh.multiply(r));

        const proofOfBalance = prove(
            ProofSystem.balanceProofKnowledge(SCALAR_ZERO, scalarNegate(r)),
        );

        expect(
            verify(
                ProofSystem.balanceProofStatement(Generators.Gg.multiply(a).subtract(ma)),
                proofOfBalance,
            ),
        ).toBe(true);
        expect(verify(ProofSystem.balanceProofStatement(ma), proofOfBalance)).toBe(false);
    });

    it.each([
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
        [7, 11],
        [11, 7],
        [10_000, 0],
        [0, 10_000],
        [10_000, 10_000],
        [2147483647, 2147483647],
        [2147483646, 2147483647],
        [2147483647, 2147483646],
    ])(
        'can prove and verify a balance of %i presented and %i requested',
        (presentedAmount, requestedAmount) => {
            const a = s(presentedAmount);
            const r = rnd.getScalar();
            const z = rnd.getScalar();
            const ca = Generators.Ga.multiply(z)
                .add(Generators.Gg.multiply(a))
                .add(Generators.Gh.multiply(r));

            const ap = s(requestedAmount);
            const rp = rnd.getScalar();
            const ma = Generators.Gg.multiply(ap).add(Generators.Gh.multiply(rp));

            const absDelta = s(Math.abs(presentedAmount - requestedAmount));
            const delta = presentedAmount > requestedAmount ? scalarNegate(absDelta) : absDelta;
            const knowledge = ProofSystem.balanceProofKnowledge(z, scalarAdd(r, scalarNegate(rp)));
            const proofOfBalance = prove(knowledge);

            expect(
                verify(
                    ProofSystem.balanceProofStatement(
                        ca.add(Generators.Gg.multiply(delta)).subtract(ma),
                    ),
                    proofOfBalance,
                ),
            ).toBe(true);
            expect(
                verify(
                    ProofSystem.balanceProofStatement(
                        ca.add(Generators.Gg.multiply(scalarAdd(delta, SCALAR_ONE))).subtract(ma),
                    ),
                    proofOfBalance,
                ),
            ).toBe(false);
        },
    );

    it.each([
        [0n, 0, true],
        [0n, 1, true],
        [1n, 0, false],
        [1n, 1, true],
        [1n, 2, true],
        [2n, 0, false],
        [2n, 1, false],
        [2n, 2, true],
        [3n, 1, false],
        [3n, 2, true],
        [4n, 2, false],
        [4n, 3, true],
        [7n, 2, false],
        [7n, 3, true],
        [4294967296n, 32, false],
        [4294967296n, 33, true],
    ])('proves amount %s is representable in %i bits: %s', (amount, width, pass) => {
        const amountScalar = amount as Scalar;
        const randomness = rnd.getScalar();
        const commitment = Generators.Gg.multiply(amountScalar).add(
            Generators.Gh.multiply(randomness),
        );

        const { knowledge, bitCommitments } = ProofSystem.rangeProofKnowledge(
            amountScalar,
            randomness,
            width as number,
            rnd,
        );
        const rangeProof = prove(knowledge);

        expect(
            verify(
                ProofSystem.rangeProofStatement(commitment, bitCommitments, width as number),
                rangeProof,
            ),
        ).toBe(pass);

        if (pass) {
            return;
        }

        expect(() => knowledge.assertSoundness()).toThrow('not solution');

        // When the statement is unprovable, clear the high bits of the secret so
        // the proof is formally valid but proves a different statement. The
        // verifier must still reject.
        const maskedScalar = (amountScalar & ((1n << BigInt(width as number)) - 1n)) as Scalar;
        const other = ProofSystem.rangeProofKnowledge(
            maskedScalar,
            randomness,
            width as number,
            rnd,
        );
        const incorrectRangeProof = prove(other.knowledge);

        expect(
            verify(
                ProofSystem.rangeProofStatement(commitment, other.bitCommitments, width as number),
                incorrectRangeProof,
            ),
        ).toBe(false);
        expect(
            verify(
                ProofSystem.rangeProofStatement(commitment, bitCommitments, width as number),
                incorrectRangeProof,
            ),
        ).toBe(false);
        expect(
            verify(
                ProofSystem.rangeProofStatement(commitment, other.bitCommitments, width as number),
                rangeProof,
            ),
        ).toBe(false);
    });

    /**
     * The prover builds `\sum 2^i * B_i` from the openings of its own bit commitments
     * rather than by multiplying each commitment, which is the single largest saving in
     * a mainnet amount request. The two have to agree exactly, or the verifier (which
     * only has the public commitments) computes a different statement and every proof
     * is rejected — so compare the statements term by term, not just the verdict.
     */
    it.each([1, 8, 37, 42])(
        'builds the same width-%i statement as a verifier who only has the bit commitments',
        width => {
            const amount = (
                (1n << BigInt(width)) - 7n > 0n ? (1n << BigInt(width)) - 7n : 1n
            ) as Scalar;
            const randomness = rnd.getScalar();
            const { knowledge, bitCommitments } = ProofSystem.rangeProofKnowledge(
                amount,
                randomness,
                width,
                rnd,
            );
            const ma = Generators.Gg.multiply(amount).add(Generators.Gh.multiply(randomness));
            const verifierStatement = ProofSystem.rangeProofStatement(ma, bitCommitments, width);

            expect(
                groupElementsEqual(
                    knowledge.statement.publicPoints,
                    verifierStatement.publicPoints,
                ),
            ).toBe(true);
            expect(
                groupElementsEqual(knowledge.statement.generators, verifierStatement.generators),
            ).toBe(true);
        },
    );

    it('can prove and verify compound zero proofs', () => {
        const r0 = rnd.getScalar();
        const ma0 = Generators.Gh.multiply(r0);
        const r1 = rnd.getScalar();
        const ma1 = Generators.Gh.multiply(r1);

        const knowledge = [
            ProofSystem.zeroProofKnowledge(ma0, r0),
            ProofSystem.zeroProofKnowledge(ma1, r1),
        ];
        const proofs = ProofSystem.prove(emptyTranscript(), knowledge, rnd);
        const statements = [
            ProofSystem.zeroProofStatement(ma0),
            ProofSystem.zeroProofStatement(ma1),
        ];

        expect(ProofSystem.verify(emptyTranscript(), statements, proofs)).toBe(true);
        // Swapping the statements must not verify.
        expect(ProofSystem.verify(emptyTranscript(), [...statements].reverse(), proofs)).toBe(
            false,
        );
    });

    it('rejects a proof count that does not match the statement count', () => {
        const r = rnd.getScalar();
        const ma = Generators.Gh.multiply(r);
        const proofs = ProofSystem.prove(
            emptyTranscript(),
            [ProofSystem.zeroProofKnowledge(ma, r)],
            rnd,
        );

        expect(() =>
            ProofSystem.verify(
                emptyTranscript(),
                [ProofSystem.zeroProofStatement(ma), ProofSystem.zeroProofStatement(ma)],
                proofs,
            ),
        ).toThrow('same length as statements');
    });

    // Port of `End2EndVerificationSimple` in KnowledgeOfDlogTests.cs. Knowledge of a
    // discrete log is a one-term representation proof. The RNG contributes nothing here,
    // which still works because the nonce is synthetic and depends on the witness.
    it.each([1, 3, 5, 7, 32767, 2147483647, 4294967295])(
        'proves knowledge of the discrete log of %i * G with a zero-entropy RNG',
        seed => {
            const secret = s(seed);
            const publicPoint = Generators.G.multiply(secret);
            const proof = ProofSystem.prove(
                emptyTranscript(),
                [new Knowledge(Statement.of(publicPoint, Generators.G), [secret])],
                constantRandom(),
            );

            expect(
                ProofSystem.verify(
                    emptyTranscript(),
                    [Statement.of(publicPoint, Generators.G)],
                    proof,
                ),
            ).toBe(true);
        },
    );

    // Port of `End2EndVerificationLargeScalar` in KnowledgeOfDlogTests.cs
    it('proves knowledge of a large discrete log against a non-standard generator', () => {
        const gen = Generators.G.multiply(s(4));
        const NC = (1n << 256n) - SCALAR_ORDER;
        const allIntMax = Array.from({ length: 8 }).reduce<bigint>(
            (acc, _, index) => acc | (0x7fffffffn << BigInt(index * 32)),
            0n,
        );

        [allIntMax, SCALAR_ORDER - 1n, NC, NC + 1n, NC - 1n].forEach(raw => {
            const secret = (raw % SCALAR_ORDER) as Scalar;
            const p = gen.multiply(secret);
            const proof = ProofSystem.prove(
                emptyTranscript(),
                [new Knowledge(Statement.of(p, gen), [secret])],
                rnd,
            );

            expect(ProofSystem.verify(emptyTranscript(), [Statement.of(p, gen)], proof)).toBe(true);
        });
    });

    // Port of `End2EndVerificationSimple` in KnowledgeOfRepTests.cs
    it.each([
        [1, 1],
        [1, 2],
        [3, 5],
        [5, 7],
        [7, 11],
        [32767, 4294967295],
        [2147483647, 4294967295],
        [4294967295, 4294967295],
    ])('proves knowledge of a representation (%i, %i)', (seed1, seed2) => {
        const secrets = [s(seed1), s(seed2)];
        const generators = [Generators.G, Generators.Ga];
        const publicPoint = multiScalarMultiply(secrets, generators);
        const proof = ProofSystem.prove(
            emptyTranscript(),
            [new Knowledge(Statement.of(publicPoint, ...generators), secrets)],
            constantRandom(),
        );

        expect(
            ProofSystem.verify(
                emptyTranscript(),
                [Statement.of(publicPoint, ...generators)],
                proof,
            ),
        ).toBe(true);
    });

    it('rejects a range proof statement with the wrong number of bit commitments', () => {
        const ma = Generators.Gg.multiply(SCALAR_ONE);

        expect(() => ProofSystem.rangeProofStatement(ma, [], 1)).toThrow(
            'Expected 1 bit commitments, got 0',
        );
        expect(() => ProofSystem.rangeProofStatement(ma, [], 256)).toThrow('width out of range');
    });

    it('builds a zero proof statement as a width-zero range proof', () => {
        const ma = Generators.Gh.multiply(SCALAR_ONE);
        const statement = ProofSystem.zeroProofStatement(ma);

        expect(statement.equations).toHaveLength(1);
        expect(statement.equations[0]!.publicPoint.equals(ma)).toBe(true);
        expect(statement.equations[0]!.generators[0]!.equals(Generators.Gh)).toBe(true);
    });

    it('computes a Pedersen commitment', () => {
        const commitment = ProofSystem.pedersenCommitment(s(5), s(7));

        expect(
            commitment.equals(Generators.Gg.multiply(s(5)).add(Generators.Gh.multiply(s(7)))),
        ).toBe(true);
        expect(ProofSystem.pedersenCommitment(SCALAR_ZERO, SCALAR_ZERO)).toBeInstanceOf(
            GroupElement,
        );
    });
});
