import { CoinjoinPrison } from '../../src/client/CoinjoinPrison';
import { outputRegistration } from '../../src/client/phase/outputRegistration';
import { createServer, Server } from '../mocks/server';
import { createInput } from '../fixtures/input.fixture';
import { createCoinjoinRound } from '../fixtures/round.fixture';

let server: Server | undefined;

const prison = new CoinjoinPrison();

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

    it('fails on joining credentials (missing data in input)', async () => {
        const response = await outputRegistration(
            createCoinjoinRound([createInput('account-A', 'A1')], {
                ...server?.requestOptions,
                round: {
                    phase: 3,
                },
            }),
            [],
            prison,
            server?.requestOptions,
        );
        expect(response.inputs[0].error?.message).toMatch(/Missing confirmed credentials/);
    });
});
