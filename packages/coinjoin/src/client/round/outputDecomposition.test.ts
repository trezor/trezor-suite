import { getOutputAmounts } from '@trezor/coinjoin-strategy';

import { outputDecomposition as fixtures } from './__fixtures__/outputDecomposition.fixture';
import { outputDecomposition } from './outputDecomposition';
import { createServer } from '../../../mocks/server';
import { createInput } from '../../__fixtures__/input.fixture';
import { INPUT_ADDED_EVENT, createCoinjoinRound } from '../../__fixtures__/round.fixture';

/**
 * This suite is about the plumbing between decomposition and credential joining: which
 * amounts are asked for, how `availableVsize` is derived, and how many credential
 * issuance round trips it takes to split the inputs' credentials into those amounts. Its
 * fixtures start in the middle of a round with credentials of chosen values, which real
 * credentials cannot be — a `Credential` carries a blinding factor and a MAC the
 * coordinator issued. So the decomposer and the credential layer are both stubbed here,
 * and the real credential round trip against the mock coordinator's issuer is covered by
 * `inputRegistration.test.ts`, `connectionConfirmation.test.ts` and the cross-phase test
 * at the end of this file.
 */
jest.mock('@trezor/coinjoin-strategy', () => ({
    ...jest.requireActual('@trezor/coinjoin-strategy'),
    getOutputAmounts: jest.fn(),
}));

jest.mock('../credentials', () => {
    const actual = jest.requireActual('../credentials');
    const bundle = (requested: number[]) => ({
        CredentialsRequest: {
            Delta: requested.reduce((total, value) => total + value, 0),
            Presented: [],
            Requested: requested.map(String),
            Proofs: [],
        },
        CredentialsResponseValidation: { requested: requested.map(value => ({ value })) },
    });

    return {
        ...actual,
        getZeroCredentials: jest.fn(() => bundle([0, 0])),
        getRealCredentials: jest.fn((amountsToRequest: number[]) =>
            bundle(amountsToRequest.length > 0 ? amountsToRequest : [0, 0]),
        ),
        getCredentials: jest.fn(
            (
                _issuer: unknown,
                _max: number,
                _response: unknown,
                validation: { requested: { value: number }[] },
            ) => validation.requested.map(({ value }) => ({ value })),
        ),
    };
});

const getOutputAmountsMock = getOutputAmounts as jest.MockedFunction<typeof getOutputAmounts>;

let server: Awaited<ReturnType<typeof createServer>>;

describe('outputRegistration', () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        server?.removeAllListeners('test-request');
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
                    // The stubbed credential layer ignores the issued credentials, so the
                    // coordinator only has to answer with the right shape.
                    resolve({
                        RealAmountCredentials: {},
                        RealVsizeCredentials: {},
                        ZeroAmountCredentials: {},
                        ZeroVsizeCredentials: {},
                    });
                }
                resolve();
            });

            // NOTE: scriptPubKey is only used to calculate external output size, it can be reused for all inputs
            const ScriptPubKey =
                '1 6a6daebd9abae25cdd376b811190163eb00c58e87da1867ba8546229098231c3';
            const inputs = f.inputs.map(i => createInput(...(i as Parameters<typeof createInput>)));
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
        });
    });
});
