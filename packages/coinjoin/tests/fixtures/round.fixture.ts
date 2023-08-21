import { CoinjoinRound } from '../../src/client/CoinjoinRound';
import { CoinjoinPrison } from '../../src/client/CoinjoinPrison';
import { Round, AllowedScriptTypes } from '../../src/types/coordinator';
import { ROUND_SELECTION_REGISTRATION_OFFSET } from '../../src/constants';

export const ROUND_CREATION_EVENT = {
    Type: 'RoundCreated' as const,
    RoundParameters: {
        Network: 'TestNet',
        MiningFeeRate: 129000,
        CoordinationFeeRate: {
            Rate: 0.003,
            PlebsDontPayThreshold: 1000000,
        },
        AllowedInputAmounts: {
            Min: 5000,
            Max: 134375000000,
        },
        AllowedOutputAmounts: {
            Min: 5000,
            Max: 134375000000,
        },
        AllowedInputTypes: ['P2WPKH', 'Taproot'] as AllowedScriptTypes[],
        AllowedOutputTypes: ['P2WPKH', 'Taproot'] as AllowedScriptTypes[],
        StandardInputRegistrationTimeout: '0d 0h 1m 0s',
        ConnectionConfirmationTimeout: '0d 0h 1m 0s',
        OutputRegistrationTimeout: '0d 0h 1m 0s',
        TransactionSigningTimeout: '0d 0h 1m 0s',
        BlameInputRegistrationTimeout: '0d 0h 1m 0s',
        MaxSuggestedAmount: 1000000000,
        MinInputCountByRound: 2,
        MaxInputCountByRound: 10,
        MinAmountCredentialValue: 5000,
        MaxAmountCredentialValue: 134375000000,
        InitialInputVsizeAllocation: 99942,
        MaxVsizeCredentialValue: 255,
        MaxVsizeAllocationPerAlice: 255,
        MaxTransactionSize: 100000,
        MinRelayTxFee: 1000,
    },
};

// random P2WPKH external input
export const INPUT_ADDED_EVENT = {
    Type: 'InputAdded',
    Coin: {
        Outpoint: 'AABBCCDD001123344000000000000000000000000000000000000000000000000000000',
        TxOut: {
            ScriptPubKey: '0 751e76e8199196d454941c45d1b3a323f1433bd6',
            Value: 5000,
        },
    },
    OwnershipProof: '',
};

export const FEE_RATE_MEDIANS = [
    {
        TimeFrame: '1d 0h 1m 0s',
        MedianFeeRate: 129000,
    },
    {
        TimeFrame: '7d 0h 1m 0s',
        MedianFeeRate: 129000,
    },
    {
        TimeFrame: '31d 0h 1m 0s',
        MedianFeeRate: 129000,
    },
];

export const DEFAULT_ROUND = {
    Id: '80b4e3efd1aedeb7b140d605946ca5662241d6829b6018bb0eee58c9ac929fce',
    BlameOf: '0000000000000000000000000000000000000000000000000000000000000000',
    AmountCredentialIssuerParameters: {
        Cw: '03CFB034383C718F51182773D3AE90C0826DB752330462CAD73F81A7F0AA3CBB6C',
        I: '032988176AD16B5414F15B44BACFE4C584AEB1D1851614BF6C614CBC5C8B9F4DC7',
    },
    VsizeCredentialIssuerParameters: {
        Cw: '025E28EC14AA222CF90B00E564D3572806B7449DDB830A392257D4B9C89A4A5FAE',
        I: '0395DFD855C84500B656BD11EB9A185FA1719F8F8C93890B836FDCB40ABEB1E454',
    },
    Phase: 0,
    EndRoundState: 0,
    CoinjoinState: {
        Events: [ROUND_CREATION_EVENT],
    },
    InputRegistrationEnd: new Date(
        Date.now() + ROUND_SELECTION_REGISTRATION_OFFSET * 2,
    ).toUTCString(),
} as Round;

export const AFFILIATE_INFO = {
    RunningAffiliateServers: ['trezor' as const],
    AffiliateData: {},
};

export const STATUS_EVENT = {
    RoundStates: [],
    AffiliateInformation: AFFILIATE_INFO,
    CoinJoinFeeRateMedians: FEE_RATE_MEDIANS,
};

type CJRoundArgs = ConstructorParameters<typeof CoinjoinRound>;
type CJRoundOptions = CJRoundArgs[2];
interface CreateCoinjoinRoundOptions extends CJRoundOptions {
    statusRound?: Partial<Round>;
    round?: Partial<CoinjoinRound>;
    prison?: CJRoundArgs[1];
    roundParameters?: Partial<CoinjoinRound['roundParameters']>;
}
export const createCoinjoinRound = (
    inputs: CoinjoinRound['inputs'],
    {
        statusRound,
        round: roundOptions,
        roundParameters,
        prison,
        ...options
    }: CreateCoinjoinRoundOptions,
) => {
    const R = { ...DEFAULT_ROUND };
    if (statusRound) {
        Object.keys(statusRound).forEach(key => {
            // @ts-expect-error key-value unsolvable problem
            R[key] = statusRound[key];
        });
    }

    const round = new CoinjoinRound(R, prison || new CoinjoinPrison(), options);
    round.inputs = inputs;

    if (roundOptions) {
        Object.keys(roundOptions).forEach(key => {
            // @ts-expect-error key-value unsolvable problem
            round[key] = roundOptions[key];
        });
    }

    if (roundParameters) {
        round.roundParameters = {
            ...round.roundParameters,
            ...roundParameters,
        };
    }

    return round;
};

export const STATUS_TRANSFORMED = {
    feeRateMedian: 129,
    allowedInputAmounts: {
        max: 134375000000,
        min: 5000,
    },
    rounds: [],
    coordinationFeeRate: {
        plebsDontPayThreshold: 1000000,
        rate: 0.003,
    },
};
