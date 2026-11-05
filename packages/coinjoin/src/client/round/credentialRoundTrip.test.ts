import { connectionConfirmation } from './connectionConfirmation';
import { inputRegistration } from './inputRegistration';
import { outputDecomposition } from './outputDecomposition';
import { createServer, resetMockCoordinator } from '../../../mocks/server';
import { createInput } from '../../__fixtures__/input.fixture';
import { INPUT_ADDED_EVENT, createCoinjoinRound } from '../../__fixtures__/round.fixture';
import { type Alice } from '../Alice';

/**
 * The credential round trip across phases, against the mock coordinator's real
 * `CredentialIssuer`.
 *
 * The per-phase suites each exercise the credential round trip for their own phase, with
 * their inputs' credentials minted from the mock coordinator's issuer so that they can
 * start mid-round (`connectionConfirmation.test.ts`, `outputDecomposition.test.ts`,
 * `outputRegistration.test.ts`). This file is what joins them up: one input carried
 * across registration, confirmation and decomposition with nothing minted and nothing
 * stubbed, so the credentials each phase presents are the ones the phase before it was
 * issued. Every range proof, the balance proof and the serial number set are checked by
 * the issuer, and every issued credential's issuer-parameters proof by the client.
 *
 * Re-presenting a credential is rejected by the issuer's serial number set; that is
 * asserted directly in `@trezor/wabisabi-crypto`'s `CredentialIssuer` suite rather than
 * paid for again here.
 */

// mock random delay function
jest.mock('@trezor/utils', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/utils'),
    getWeakRandomNumberInRange: () => 0,
}));

const ACCOUNT = {
    accountKey: 'account-A',
    changeAddresses: new Array(10).fill({
        address: 'bc1pkeah0fx2ex3jc337twlqcm9lh2eusm94j5vw2eshvczku6n7sjwqrfyfj2',
    }),
} as any;

describe('credential round trip', () => {
    let server: Awaited<ReturnType<typeof createServer>>;

    beforeAll(async () => {
        server = await createServer();
    });

    afterEach(() => {
        server?.removeAllListeners('test-request');
        resetMockCoordinator();
    });

    afterAll(() => {
        jest.clearAllMocks();
        server?.close();
    });

    it('registers, confirms and decomposes with credentials the issuer actually validates', async () => {
        // One input: a width-37 range proof is a few thousand secp256k1
        // multiplications, and this test pays for several of them in both directions.
        const inputs = [
            createInput('account-A', 'A1', { ownershipProof: '01A1', amount: 100_000_000 }),
        ];

        // Phase 0 — input registration. The coordinator issues zero-value credentials
        // against the client's null requests, and the client turns them into the real
        // credentials it will present in phase 1.
        const registered = await inputRegistration(
            createCoinjoinRound(inputs, {
                ...server?.requestOptions,
                round: { phaseDeadline: Date.now() + 3000 },
            }),
            server?.requestOptions,
        );

        registered.inputs.forEach(input => {
            expect(input.error).toBeUndefined();
            expect(input.registrationData).toMatchObject({ AliceId: expect.any(String) });
            expect(input.realAmountCredentials?.CredentialsRequest.Proofs.length).toBeGreaterThan(
                0,
            );
            input.clearConfirmationInterval();
        });

        // Phase 1 — connection confirmation. The client presents the real credentials
        // and the issuer rejects anything that does not balance or re-presents a
        // serial number.
        const confirmed = await connectionConfirmation(
            createCoinjoinRound(registered.inputs as Alice[], {
                ...server?.requestOptions,
                round: { phase: 1, phaseDeadline: Date.now() + 3000 },
            }),
            server?.requestOptions,
        );

        const amounts: number[] = [];
        confirmed.inputs.forEach(input => {
            expect(input.error).toBeUndefined();
            expect(input.confirmedAmountCredentials).toHaveLength(2);
            expect(input.confirmedVsizeCredentials).toHaveLength(2);
            amounts.push(input.confirmedAmountCredentials![0]!.value);
        });

        // The confirmed amount credential carries the registered amount: the input
        // amount less the mining and coordination fees.
        amounts.forEach(amount => {
            expect(amount).toBeGreaterThan(0);
            expect(amount).toBeLessThan(100_000_000);
        });

        // Phase 2 — output decomposition. The amounts come from the real decomposer,
        // and every join is a real reissuance through the coordinator.
        const SCRIPT_PUB_KEY = '1 6a6daebd9abae25cdd376b811190163eb00c58e87da1867ba8546229098231c3';
        const inputAdded = (Outpoint: string, Value: number) => ({
            Type: 'InputAdded',
            Coin: { Outpoint, TxOut: { ScriptPubKey: SCRIPT_PUB_KEY, Value } },
        });
        const events = [
            ...confirmed.inputs.map(input => inputAdded(input.outpoint, input.amount)),
            // Other participants, so that the denomination frequency table has more
            // than one entry: the decomposer only keeps denominations that occurred
            // at least twice across all the round's inputs.
            inputAdded('E1', 100_000_000),
            inputAdded('E2', 100_000_000),
        ];

        const decomposed = await outputDecomposition(
            createCoinjoinRound(confirmed.inputs as Alice[], {
                ...server?.requestOptions,
                round: {
                    phase: 2,
                    phaseDeadline: Date.now() + 30_000,
                    coinjoinState: {
                        Type: '',
                        Events: [...events, INPUT_ADDED_EVENT] as any,
                    },
                },
            }),
            [ACCOUNT],
            server?.requestOptions,
        );

        expect(decomposed).toHaveLength(1);
        const [account] = decomposed;
        expect(account!.accountKey).toBe('account-A');
        expect(account!.outputs.length).toBeGreaterThan(0);
        account!.outputs.forEach(output => {
            expect(output.amount).toBeGreaterThan(0);
            expect(output.amountCredentials).toHaveLength(2);
            expect(output.vsizeCredentials).toHaveLength(2);
            // the first credential of each pair covers the output
            expect(output.amountCredentials[0]!.value).toBe(output.amount);
        });

        // Nothing was created out of thin air: the decomposed outputs cannot be worth
        // more than what was registered.
        const registeredSum = amounts.reduce((total, amount) => total + amount, 0);
        const decomposedSum = account!.outputs.reduce((total, output) => total + output.amount, 0);
        expect(decomposedSum).toBeLessThanOrEqual(registeredSum);
    }, 120_000);
});
