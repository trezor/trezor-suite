import { outputDecomposition } from '../../src/client/round/outputDecomposition';
import { createServer } from '../mocks/server';
import { createInput } from '../fixtures/input.fixture';
import { outputDecomposition as fixtures } from '../fixtures/outputDecomposition.fixture';
import { createCoinjoinRound, INPUT_ADDED_EVENT } from '../fixtures/round.fixture';

let server: Awaited<ReturnType<typeof createServer>>;

describe('outputRegistration', () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        if (server) server.close();
    });

    it('outputDecomposition fails. missing data in input', async () => {
        await expect(
            outputDecomposition(
                createCoinjoinRound([createInput('account-A', 'A1')], {
                    ...server?.requestOptions,
                    round: {
                        phase: 3,
                    },
                }),
                server?.requestOptions,
            ),
        ).rejects.toThrow('Missing confirmed credentials');
    });

    fixtures.forEach(f => {
        it(`outputDecomposition ${f.description}`, async () => {
            const spy = jest.fn();
            server?.addListener('test-request', ({ url, resolve }) => {
                if (url.endsWith('/get-outputs-amounts')) {
                    resolve({
                        outputAmounts: f.outputAmounts,
                    });
                }
                if (url.endsWith('/credential-issuance')) {
                    spy();
                }
                resolve();
            });

            // NOTE: scriptPubKey is only used to calculate external output size, it can be reused for all inputs
            const scriptPubKey =
                '1 6a6daebd9abae25cdd376b811190163eb00c58e87da1867ba8546229098231c3';
            const inputs = f.inputs.map(i => createInput(...(i as Parameters<typeof createInput>)));
            const events: any[] = inputs.map(i => ({
                Type: 'InputAdded',
                coin: {
                    outpoint: i.outpoint,
                    txOut: {
                        scriptPubKey,
                        value: i.amount,
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
                            events: [...events, INPUT_ADDED_EVENT],
                        },
                    },
                    roundParameters: f.roundParameters,
                }),
                server?.requestOptions,
            );

            expect(response.length).toBe(f.result.length);
            response.forEach((r, i) => {
                expect(r.outputs.length).toBe(f.result[i].outputs.length);
                expect(r).toMatchObject(f.result[i]);
            });
            expect(spy).toBeCalledTimes(f.credentialIssuanceCalls);
        });
    });
});
