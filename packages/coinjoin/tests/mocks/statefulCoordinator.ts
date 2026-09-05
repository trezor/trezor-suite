import type { MockedServer } from './server';
import { EndRoundState, RoundPhase } from '../../src/enums';
import { getInputSize, getOutputSize } from '../../src/utils/coordinatorUtils';
import { DEFAULT_ROUND, FEE_RATE_MEDIANS, ROUND_CREATION_EVENT } from '../fixtures/round.fixture';

// Extends the passive mock server with a WabiSabi coordinator state machine driving one round
// through all phases. Phase transitions are triggered by the requests the client itself makes:
// all inputs registered -> ConnectionConfirmation, all inputs confirmed -> OutputRegistration,
// all inputs ready-to-sign -> TransactionSigning, all witnesses collected -> Ended (broadcasted).
// Middleware endpoints keep the echo-style defaults from ./server, which makes the credential
// arithmetic consistent on the client side without implementing any real crypto.

export interface CoordinatorInput {
    outpoint: string;
    // scriptPubKey in coordinator format, e.g. '1 <x-only-pubkey>'
    scriptPubKey: string;
    value: number;
}

export interface StatefulCoordinatorOptions {
    inputs: CoordinatorInput[];
    // base64 blob parsed by getAffiliateRequest: 33B mask + 64B signature + 1B flag per input
    affiliateRequest: string;
    roundParameters?: Partial<(typeof ROUND_CREATION_EVENT)['RoundParameters']>;
}

export interface LoggedRequest {
    url: string;
    data: Record<string, any>;
    headers: Record<string, string | string[] | undefined>;
    // remote port of the connection the request arrived on; pairs with
    // RecordedConnection.outboundLocalPort of the TorSimulator
    remotePort?: number;
}

const COORDINATOR_PATHS = [
    'status',
    'api/Software/versions',
    'input-registration',
    'connection-confirmation',
    'credential-issuance',
    'output-registration',
    'ready-to-sign',
    'transaction-signature',
    'input-unregistration',
];

export const isCoordinatorPath = (url: string) =>
    COORDINATOR_PATHS.some(path => url.endsWith(`/${path}`));

export const attachStatefulCoordinator = (
    server: MockedServer,
    { inputs, affiliateRequest, roundParameters }: StatefulCoordinatorOptions,
) => {
    const params = { ...ROUND_CREATION_EVENT.RoundParameters, ...roundParameters };
    const inputSize = getInputSize('Taproot');
    const outputSize = getOutputSize('Taproot');
    // IsPayingZeroCoordinationFee is reported for every input, so the client subtracts only
    // the mining fee, and the same must hold for the credentials issued by this mock
    const effectiveAmount = (value: number) =>
        value - Math.floor((inputSize * params.MiningFeeRate) / 1000);
    const outputFee = Math.floor((outputSize * params.MiningFeeRate) / 1000);
    const remainingVsize = params.MaxVsizeAllocationPerAlice - inputSize;

    let phase: RoundPhase = RoundPhase.InputRegistration;
    let endRoundState = EndRoundState.None;
    const events: Record<string, any>[] = [{ ...ROUND_CREATION_EVENT, RoundParameters: params }];
    const aliceOutpoints: Record<string, string> = {};
    const confirmedAlices = new Set<string>();
    const readyAlices = new Set<string>();
    const witnesses: Record<number, string> = {};
    const requests: LoggedRequest[] = [];

    const findInput = (outpoint: string) =>
        inputs.find(i => i.outpoint.toLowerCase() === outpoint.toLowerCase());

    const buildStatus = () => ({
        RoundStates: [
            {
                ...DEFAULT_ROUND,
                InputRegistrationEnd: new Date(Date.now() + 45000).toUTCString(),
                Phase: phase,
                EndRoundState: endRoundState,
                CoinjoinState: {
                    Events: [...events],
                    ...(phase === RoundPhase.Ended
                        ? { IsFullySigned: true, Witnesses: { ...witnesses } }
                        : {}),
                },
            },
        ],
        CoinJoinFeeRateMedians: FEE_RATE_MEDIANS,
        AffiliateInformation: {
            RunningAffiliateServers: ['trezor'],
            AffiliateData:
                phase >= RoundPhase.TransactionSigning
                    ? { [DEFAULT_ROUND.Id]: { trezor: affiliateRequest } }
                    : {},
        },
    });

    const handleCoordinatorRequest = ({
        url,
        data,
        resolve,
        reject,
    }: {
        url: string;
        data: Record<string, any>;
        resolve: (data?: Record<string, any>) => void;
        reject: (code: number, error?: any) => void;
    }) => {
        if (url.endsWith('/status')) {
            return resolve(buildStatus());
        }
        if (url.endsWith('/select-inputs-for-round')) {
            return resolve({ Indices: data.Utxos.map((_: unknown, index: number) => index) });
        }
        if (url.endsWith('/input-registration')) {
            const input = findInput(data.Input);
            if (!input) {
                return reject(500, { ErrorCode: 'InputSpent', Description: 'Unknown input' });
            }
            const aliceId = `alice-${Object.keys(aliceOutpoints).length}`;
            aliceOutpoints[aliceId] = input.outpoint;
            events.push({
                Type: 'InputAdded',
                Coin: {
                    Outpoint: data.Input,
                    TxOut: { ScriptPubKey: input.scriptPubKey, Value: input.value },
                },
                OwnershipProof: data.OwnershipProof,
            });
            if (Object.keys(aliceOutpoints).length === inputs.length) {
                phase = RoundPhase.ConnectionConfirmation;
            }

            return resolve({
                AliceId: aliceId,
                AmountCredentials: [{ Value: effectiveAmount(input.value) }, { Value: 0 }],
                VsizeCredentials: [{ Value: remainingVsize }, { Value: 0 }],
                IsPayingZeroCoordinationFee: true,
            });
        }
        if (url.endsWith('/connection-confirmation')) {
            // keep-alive ping in InputRegistration phase returns no credentials
            if (phase === RoundPhase.InputRegistration) {
                return resolve({});
            }
            const input = findInput(aliceOutpoints[data.AliceId] ?? '');
            if (!input) {
                return reject(500, { ErrorCode: 'AliceNotFound', Description: 'Unknown alice' });
            }
            confirmedAlices.add(data.AliceId);
            if (confirmedAlices.size === inputs.length) {
                phase = RoundPhase.OutputRegistration;
            }

            return resolve({
                RealAmountCredentials: [{ Value: effectiveAmount(input.value) }, { Value: 0 }],
                RealVsizeCredentials: [{ Value: remainingVsize }, { Value: 0 }],
            });
        }
        if (url.endsWith('/get-outputs-amounts')) {
            // one output per internal input, in amounts which exactly match the credentials
            // issued above (the client adds the output mining fee back before decomposition)
            return resolve({
                OutputAmounts: data.InternalAmounts.map((amount: number) => amount - outputFee),
            });
        }
        if (url.endsWith('/output-registration')) {
            events.push({
                Type: 'OutputAdded',
                Output: {
                    ScriptPubKey: data.Script,
                    // middleware echo-mock presents the requested output credential first
                    Value: data.AmountCredentialRequests?.Presented?.[0]?.Value,
                },
            });

            return resolve();
        }
        if (url.endsWith('/ready-to-sign')) {
            readyAlices.add(data.AliceId);
            if (readyAlices.size === inputs.length) {
                phase = RoundPhase.TransactionSigning;
            }

            return resolve();
        }
        if (url.endsWith('/transaction-signature')) {
            witnesses[data.InputIndex] = data.Witness;
            if (Object.keys(witnesses).length === inputs.length) {
                phase = RoundPhase.Ended;
                endRoundState = EndRoundState.TransactionBroadcasted;
            }

            return resolve();
        }

        // everything else (middleware, version) is served by the echo-style defaults
        resolve();
    };

    server.addListener('test-request', ({ url, data, request, resolve, reject }) => {
        requests.push({
            url,
            data,
            headers: { ...request.headers },
            remotePort: request.socket.remotePort,
        });

        // an unexpected payload shape must fail fast with a readable response instead of
        // an unhandled rejection inside the mock server's request handler
        try {
            handleCoordinatorRequest({ url, data, resolve, reject });
        } catch (error) {
            reject(500, { ErrorCode: 'MockCoordinatorError', Description: String(error) });
        }
    });

    return {
        requests,
        aliceOutpoints,
        getPhase: () => phase,
    };
};
