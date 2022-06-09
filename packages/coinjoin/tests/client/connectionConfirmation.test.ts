import { connectionConfirmation } from '../../src/client/phase/connectionConfirmation';
import { createServer, Server } from '../mocks/server';
import { createInput } from '../fixtures/input.fixture';
import { createCoinjoinRound } from '../fixtures/round.fixture';

let server: Server | undefined;

describe('connectionConfirmation', () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        if (server) server.close();
    });

    it('try to confirm without registrationData', async () => {
        const response = await connectionConfirmation(
            createCoinjoinRound(
                [createInput('account-A', 'A1'), createInput('account-B', 'B1')],
                server?.requestOptions,
            ),
            server?.requestOptions,
        );
        response.inputs.forEach(input => {
            expect(input.error?.message).toMatch(/confirm unregistered input/);
        });
    });

    it('error in coordinator connection-confirmation', async () => {
        server?.addListener('test-request', ({ url, data }, req, res) => {
            if (url.includes('connection-confirmation')) {
                if (data.aliceId === '01A2-01a2') {
                    res.writeHead(404);
                    res.end();
                }
            }
            req.emit('test-response');
        });
        const response = await connectionConfirmation(
            createCoinjoinRound(
                [
                    createInput('account-A', 'A1', {
                        registrationData: {
                            aliceId: '01A1-01a1',
                        },
                        realAmountCredentials: {},
                        realVsizeCredentials: {},
                    }),
                    createInput('account-A', 'A2', {
                        registrationData: {
                            aliceId: '01A2-01a2',
                        },
                        realAmountCredentials: {},
                        realVsizeCredentials: {},
                    }),
                    createInput('account-A', 'A3', {
                        registrationData: {
                            aliceId: '01A3-01a3',
                        },
                        realAmountCredentials: {},
                        realVsizeCredentials: {},
                    }),
                ],
                {
                    ...server?.requestOptions,
                    round: { phase: 1, id: '01' },
                },
            ),
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            if (input.outpoint === 'A2') {
                expect(input.error?.message).toMatch(/Not Found/);
            } else {
                expect(input.confirmationData).toEqual(expect.any(Object));
            }
        });
    });
});
