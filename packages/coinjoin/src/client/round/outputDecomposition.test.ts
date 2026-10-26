import { getOutputAmounts } from '@trezor/coinjoin-strategy';

import { outputDecomposition as fixtures } from './__fixtures__/outputDecomposition.fixture';
import { outputDecomposition } from './outputDecomposition';
import {
    configureMockCoordinator,
    createServer,
    getRoundCredentialKinds,
    resetMockCoordinator,
} from '../../../mocks/server';
import { mintCredentials } from '../../__fixtures__/credentialIssuer.fixture';
import { createInput } from '../../__fixtures__/input.fixture';
import {
    DEFAULT_ROUND,
    INPUT_ADDED_EVENT,
    ROUND_CREATION_EVENT,
    createCoinjoinRound,
} from '../../__fixtures__/round.fixture';

/**
 * This suite is about the plumbing between decomposition and credential joining: which
 * amounts are asked for, how `availableVsize` is derived, and how many credential
 * issuance round trips it takes to split the inputs' credentials into those amounts.
 *
 * Only the decomposer is stubbed, so that each case can pin the amounts it is about. The
 * credentials are real: the fixtures start in the middle of a round, and the values they
 * name are minted from the mock coordinator's own issuer, which then validates every
 * reissuance the suite drives through it — the balance proof, both range proofs and the
 * serial numbers. A join that does not balance fails here instead of being waved through.
 */
jest.mock('@trezor/coinjoin-strategy', () => ({
    ...jest.requireActual('@trezor/coinjoin-strategy'),
    getOutputAmounts: jest.fn(),
}));

const getOutputAmountsMock = getOutputAmounts as jest.MockedFunction<typeof getOutputAmounts>;

let server: Awaited<ReturnType<typeof createServer>>;

/**
 * The input's confirmed credentials, minted for the values the fixture names.
 *
 * A fixture can only name values; a `Credential` is a value plus a blinding factor plus
 * a MAC that only the coordinator can produce, so the values have to be taken through a
 * registration against the issuer that will later verify them.
 */
const withMintedCredentials = async (options: Record<string, any>) => {
    const kinds = getRoundCredentialKinds(DEFAULT_ROUND.Id);
    const values = (credentials: { value: number }[]) =>
        credentials.map(credential => credential.value) as [number, number];

    return {
        ...options,
        confirmedAmountCredentials: await mintCredentials(
            kinds.amount,
            values(options.confirmedAmountCredentials),
        ),
        confirmedVsizeCredentials: await mintCredentials(
            kinds.vsize,
            values(options.confirmedVsizeCredentials),
        ),
    };
};

describe('outputRegistration', () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        server?.removeAllListeners('test-request');
    });

    afterEach(() => {
        resetMockCoordinator();
    });

    afterAll(() => {
        if (server) server.close();
    });

    it('outputDecomposition errors. missing data in input', async () => {
        await expect(
            outputDecomposition(
                createCoinjoinRound([createInput('account-A', 'A1')], {
                    ...server?.requestOptions,
                    round: {
                        phase: 3,
                    },
                }),
                [],
                server?.requestOptions,
            ),
        ).rejects.toThrow('Missing confirmed credentials');
    });

    fixtures.forEach(f => {
        it(`outputDecomposition ${f.description}`, async () => {
            const spy = jest.fn();
            const availableVsize: number[] = [];
            getOutputAmountsMock.mockImplementation(request => {
                availableVsize.push(request.AvailableVsize);

                return f.outputAmounts;
            });
            server?.addListener('test-request', ({ url, resolve }) => {
                if (url.endsWith('/credential-issuance')) {
                    spy();
                }
                // Answered by the mock coordinator's issuer, which verifies the join.
                resolve();
            });

            // The issuer has to be built for the credential bounds the client is sizing
            // its range proofs from, which one case deliberately lowers.
            configureMockCoordinator({
                MaxAmountCredentialValue:
                    f.roundParameters.MaxAmountCredentialValue ??
                    ROUND_CREATION_EVENT.RoundParameters.MaxAmountCredentialValue,
            });

            // NOTE: scriptPubKey is only used to calculate external output size, it can be reused for all inputs
            const ScriptPubKey =
                '1 6a6daebd9abae25cdd376b811190163eb00c58e87da1867ba8546229098231c3';
            const inputs = await Promise.all(
                f.inputs.map(async ([accountKey, outpoint, options]) =>
                    createInput(
                        accountKey as string,
                        outpoint as string,
                        await withMintedCredentials(options as Record<string, any>),
                    ),
                ),
            );
            const events: any[] = inputs.map(i => ({
                Type: 'InputAdded',
                Coin: {
                    Outpoint: i.outpoint,
                    TxOut: {
                        ScriptPubKey,
                        Value: i.amount,
                    },
                },
            }));

            const response = await outputDecomposition(
                createCoinjoinRound(inputs, {
                    ...server?.requestOptions,
                    round: {
                        phase: 3,
                        coinjoinState: {
                            Type: '',
                            Events: [...events, INPUT_ADDED_EVENT],
                        },
                    },
                    roundParameters: f.roundParameters,
                }),
                f.accounts,
                server?.requestOptions,
            );

            expect(response.length).toBe(f.result.length);
            response.forEach((r, i) => {
                const { result } = f;
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const expected: (typeof result)[number] = result[i];
                expect(r.outputs.length).toBe(expected.outputs.length);
                expect(r).toMatchObject(expected);
            });
            // per-account requests run concurrently (Promise.all), so their arrival order is not
            // guaranteed; compare as a multiset rather than a sequence
            const byValue = (a: number, b: number) => a - b;
            expect([...availableVsize].sort(byValue)).toEqual([...f.availableVsize].sort(byValue));
            expect(spy).toHaveBeenCalledTimes(f.credentialIssuanceCalls);
            // Minting the inputs' credentials and every reissuance the case drives are
            // real range proofs, a few hundred milliseconds each.
        }, 120_000);
    });
});
