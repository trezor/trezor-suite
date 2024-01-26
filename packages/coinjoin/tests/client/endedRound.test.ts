import { networks } from '@trezor/utxo-lib';

import { RoundPhase, EndRoundState, WabiSabiProtocolErrorCode } from '../../src/enums';
import { ended } from '../../src/client/round/endedRound';
import { createInput } from '../fixtures/input.fixture';
import { createCoinjoinRound } from '../fixtures/round.fixture';

describe('ended', () => {
    const logger = {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };

    const options: any = {
        coordinatorName: 'CoinJoinCoordinatorIdentifier',
        logger,
        network: networks.bitcoin,
    };

    beforeAll(async () => {});

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {});

    it('NotAllAlicesSign by this instance (missing confirmed inputs)', () => {
        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', {
                    ownershipProof: '01A1',
                    registrationData: {
                        AliceId: '01A1-01a1',
                    },
                    realAmountCredentials: {},
                    realVsizeCredentials: {},
                }),
            ],
            {
                ...options,
                round: {
                    phase: RoundPhase.Ended,
                    endRoundState: EndRoundState.NotAllAlicesSign,
                },
            },
        );

        ended(round, options);

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringMatching(/Missing confirmed inputs/),
        );
        expect(round.prison.inmates.length).toEqual(1);
    });

    it('NotAllAlicesSign by this instance (missing outputs)', () => {
        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', {
                    ownershipProof: '01A1',
                    registrationData: {
                        AliceId: '01A1-01a1',
                    },
                    realAmountCredentials: {},
                    realVsizeCredentials: {},
                    confirmationData: {},
                    confirmedAmountCredentials: {},
                    confirmedVsizeCredentials: {},
                }),
            ],
            {
                ...options,
                round: {
                    phase: RoundPhase.Ended,
                    endRoundState: EndRoundState.NotAllAlicesSign,
                },
            },
        );

        ended(round, options);

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(expect.stringMatching(/Missing outputs/));
        expect(round.prison.inmates.length).toEqual(1);
    });

    it('NotAllAlicesSign by this instance (missing affiliate request)', () => {
        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', {
                    ownershipProof: '01A1',
                    registrationData: {
                        AliceId: '01A1-01a1',
                    },
                    realAmountCredentials: {},
                    realVsizeCredentials: {},
                    confirmationData: {},
                    confirmedAmountCredentials: {},
                    confirmedVsizeCredentials: {},
                }),
            ],
            {
                ...options,
                logger,
                round: {
                    phase: RoundPhase.Ended,
                    endRoundState: EndRoundState.NotAllAlicesSign,
                    addresses: [
                        {
                            address:
                                'bc1pkeah0fx2ex3jc337twlqcm9lh2eusm94j5vw2eshvczku6n7sjwqrfyfj2',
                            path: '',
                            scriptPubKey: '',
                        },
                    ],
                },
            },
        );

        ended(round, options);

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringMatching(/Missing affiliate request/),
        );
        expect(round.prison.inmates.length).toEqual(2); // input + output are detained
    });

    it('NotAllAlicesSign by this instance (missing witnesses)', () => {
        // create CoinjoinRound in phase 1 (ConnectionConfirmation)
        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', {
                    ownershipProof: '01A1',
                    registrationData: {
                        AliceId: '01A1-01a1',
                    },
                    realAmountCredentials: {},
                    realVsizeCredentials: {},
                    confirmationData: {},
                    confirmedAmountCredentials: {},
                    confirmedVsizeCredentials: {},
                }),
            ],
            {
                ...options,
                round: {
                    phase: RoundPhase.Ended,
                    endRoundState: EndRoundState.NotAllAlicesSign,
                    addresses: [
                        {
                            address:
                                'bc1pkeah0fx2ex3jc337twlqcm9lh2eusm94j5vw2eshvczku6n7sjwqrfyfj2',
                            path: '',
                            scriptPubKey: '',
                        },
                    ],
                    affiliateRequest: Buffer.from('0'.repeat(97 * 2 + 4), 'hex').toString('base64'),
                },
            },
        );

        ended(round, options);

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(expect.stringMatching(/Missing signed inputs/));
        expect(round.prison.inmates.length).toEqual(2); // input + output are detained
    });

    it('NotAllAlicesSign by this instance (other)', () => {
        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', {
                    ownershipProof: '01A1',
                    registrationData: {
                        AliceId: '01A1-01a1',
                    },
                    realAmountCredentials: {},
                    realVsizeCredentials: {},
                    confirmationData: {},
                    confirmedAmountCredentials: {},
                    confirmedVsizeCredentials: {},
                    witness: '0'.repeat(97 * 2 + 4),
                }),
            ],
            {
                ...options,
                round: {
                    phase: RoundPhase.Ended,
                    endRoundState: EndRoundState.NotAllAlicesSign,
                    addresses: [
                        {
                            address:
                                'bc1pkeah0fx2ex3jc337twlqcm9lh2eusm94j5vw2eshvczku6n7sjwqrfyfj2',
                            path: '',
                            scriptPubKey: '',
                        },
                    ],
                    affiliateRequest: Buffer.from('0'.repeat(97 * 2 + 4), 'hex').toString('base64'),
                },
            },
        );

        ended(round, options);

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringMatching(/This should never happen/),
        );
        expect(round.prison.inmates.length).toEqual(2); // input + output are detained
    });

    it('AbortedNotEnoughAlicesSigned by other instance (no blame round)', () => {
        const round = createCoinjoinRound(
            [
                createInput('account-A', '0'.repeat(72), {
                    ownershipProof: '01A1',
                    registrationData: {
                        AliceId: '01A1-01a1',
                    },
                    realAmountCredentials: {},
                    realVsizeCredentials: {},
                    confirmationData: {},
                    confirmedAmountCredentials: {},
                    confirmedVsizeCredentials: {},
                    witness: '0'.repeat(97 * 2 + 4),
                }),
            ],
            {
                ...options,
                round: {
                    phase: RoundPhase.Ended,
                    signed: true,
                    endRoundState: EndRoundState.AbortedNotEnoughAlicesSigned,
                    addresses: [
                        {
                            address:
                                'bc1pkeah0fx2ex3jc337twlqcm9lh2eusm94j5vw2eshvczku6n7sjwqrfyfj2',
                            path: '',
                            scriptPubKey: '',
                        },
                    ],
                    affiliateRequest: Buffer.from('0'.repeat(97 * 2 + 4), 'hex').toString('base64'),
                },
            },
        );

        ended(round, options);

        expect(logger.error).toHaveBeenCalledTimes(0);
        expect(round.prison.inmates.length).toEqual(0);
    });

    it('NotAllAlicesSign by other instance (wait for blame round)', () => {
        const round = createCoinjoinRound(
            [
                createInput('account-A', '0'.repeat(72), {
                    ownershipProof: '01A1',
                    registrationData: {
                        AliceId: '01A1-01a1',
                    },
                    realAmountCredentials: {},
                    realVsizeCredentials: {},
                    confirmationData: {},
                    confirmedAmountCredentials: {},
                    confirmedVsizeCredentials: {},
                    witness: '0'.repeat(97 * 2 + 4),
                }),
            ],
            {
                ...options,
                round: {
                    phase: RoundPhase.Ended,
                    signed: true,
                    endRoundState: EndRoundState.NotAllAlicesSign,
                    addresses: [
                        {
                            address:
                                'bc1pkeah0fx2ex3jc337twlqcm9lh2eusm94j5vw2eshvczku6n7sjwqrfyfj2',
                            path: '',
                            scriptPubKey: '',
                        },
                    ],
                    affiliateRequest: Buffer.from('0'.repeat(97 * 2 + 4), 'hex').toString('base64'),
                },
            },
        );

        ended(round, options);

        expect(logger.error).toHaveBeenCalledTimes(0);
        expect(round.prison.inmates.length).toEqual(2); // input and address (output) detained
    });

    it('AbortedNotEnoughAlices', () => {
        const round = createCoinjoinRound(
            [
                createInput('account-A', '0'.repeat(72), {
                    ownershipProof: '01A1',
                    registrationData: {
                        AliceId: '01A1-01a1',
                    },
                    realAmountCredentials: {},
                    realVsizeCredentials: {},
                }),
            ],
            {
                ...options,
                round: {
                    phase: RoundPhase.Ended,
                    endRoundState: EndRoundState.AbortedNotEnoughAlices,
                },
            },
        );

        // NOTE: registered inputs are detained by inputRegistration process
        round.prison.detain(
            { accountKey: 'account-A', outpoint: '0'.repeat(72) },
            {
                roundId: round.id,
                errorCode: WabiSabiProtocolErrorCode.AliceAlreadyRegistered,
            },
        );

        ended(round, options);

        expect(logger.error).toHaveBeenCalledTimes(0);
        expect(round.prison.inmates.length).toEqual(0); // input released from detention
    });

    it('TransactionBroadcasted', () => {
        const round = createCoinjoinRound(
            [
                createInput('account-A', '0'.repeat(72), {
                    ownershipProof: '01A1',
                    registrationData: {
                        AliceId: '01A1-01a1',
                    },
                    realAmountCredentials: {},
                    realVsizeCredentials: {},
                }),
            ],
            {
                ...options,
                round: {
                    phase: RoundPhase.Ended,
                    endRoundState: EndRoundState.TransactionBroadcasted,
                    addresses: [
                        {
                            address:
                                'bc1pkeah0fx2ex3jc337twlqcm9lh2eusm94j5vw2eshvczku6n7sjwqrfyfj2',
                            path: '',
                            scriptPubKey:
                                '1 b67b77a4cac9a32c463e5bbe0c6cbfbab3c86cb59518e5661766056e6a7e849c',
                        },
                    ],
                },
            },
        );

        ended(round, options);

        expect(logger.error).toHaveBeenCalledTimes(0);
        expect(round.prison.inmates.length).toEqual(2); // input and output detained forever
    });
});
