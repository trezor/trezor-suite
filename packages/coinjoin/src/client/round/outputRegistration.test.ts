import { outputDecomposition } from './outputDecomposition';
import { outputRegistration } from './outputRegistration';
import { createServer } from '../../../mocks/server';
import { createInput } from '../../__fixtures__/input.fixture';
import { createCoinjoinRound } from '../../__fixtures__/round.fixture';

// mock random delay function
jest.mock('@trezor/utils', () => {
    const originalModule = jest.requireActual('@trezor/utils');

    return {
        __esModule: true,
        ...originalModule,
        getWeakRandomNumberInRange: () => 0,
    };
});

jest.mock('./outputDecomposition', () => ({
    ...jest.requireActual('./outputDecomposition'),
    outputDecomposition: jest.fn(jest.requireActual('./outputDecomposition').outputDecomposition),
}));

describe('outputRegistration', () => {
    let server: Awaited<ReturnType<typeof createServer>>;

    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        server?.close();
    });

    it('errors on joining credentials (missing data in input)', async () => {
        const response = await outputRegistration(
            createCoinjoinRound([createInput('account-A', 'A1')], {
                ...server?.requestOptions,
                round: {
                    phase: 3,
                },
            }),
            [],
            server?.requestOptions,
        );
        const { inputs } = response;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstInput: (typeof inputs)[number] = inputs[0];
        expect(firstInput.error?.message).toMatch(/Missing confirmed credentials/);
    });

    it('errors on insufficient amount of available change addresses', async () => {
        server?.addListener('test-request', ({ url, resolve, reject }) => {
            if (url.endsWith('/output-registration')) {
                // do not accept **any** output
                reject(500, { ErrorCode: 'AlreadyRegisteredScript' });
            }
            resolve();
        });

        // Mock outputDecomposition module responses
        (outputDecomposition as jest.Mock).mockImplementation(() =>
            Promise.resolve([
                {
                    accountKey: 'account-A',
                    outputs: [
                        {
                            accountKey: 'account-A',
                            amount: 2000,
                            amountCredentials: [],
                            vsizeCredentials: [],
                        },
                    ],
                },
            ]),
        );

        const round = createCoinjoinRound([createInput('account-A', 'A1')], {
            ...server?.requestOptions,
            round: {
                phase: 3,
            },
        });

        // Detain first address **before** processing other addresses will not be accepted by coordinator
        round.prison.detain({
            accountKey: 'account-A',
            address: 'tb1ppll2u0aaprp92gfkntamd476emye7weykcgnctlyj7lduprjx7ys9jn7w3',
        });

        const response = await outputRegistration(
            round,
            [
                {
                    accountKey: 'account-A',
                    changeAddresses: [
                        {
                            address:
                                'tb1ppll2u0aaprp92gfkntamd476emye7weykcgnctlyj7lduprjx7ys9jn7w3',
                        },
                        {
                            address:
                                'tb1p55k3nua65qqqsq7j9zn8xp6rn3ntht9gj2ww3zfstczytd07htts3txmh9',
                        },
                        {
                            address:
                                'tb1p4jf9crt5gh57h2spvfht4zwjtnre700uvs4u63l2g2huchrk2dms4lm6kv',
                        },
                    ],
                } as any, // partial Account
            ],
            server?.requestOptions,
        );

        const { inputs } = response;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstInput2: (typeof inputs)[number] = inputs[0];
        expect(firstInput2.error?.message).toMatch(/No change address available/);
    });
});
