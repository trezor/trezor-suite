export interface CoinjoinStatus {
    roundStates: Round[];
    coinJoinFeeRateMedians: FeeRateMedians[];
}

export interface CredentialsResponseValidation {
    transcript: any;
    presented: any[];
    requested: any[];
}

export interface CredentialsRequestData {
    delta: number;
    presented: any[];
    requested: any[];
    proofs: any[];
}

export interface ZeroCredentials {
    credentialsRequest: CredentialsRequestData;
    credentialsResponseValidation: CredentialsResponseValidation;
}

export interface RealCredentials {
    credentialsRequest: CredentialsRequestData;
    credentialsResponseValidation: CredentialsResponseValidation;
}

export interface IssuerParameter {
    cw: string;
    i: string;
}

export interface IssuanceData {
    realAmountCredentials: ZeroCredentials;
    realVsizeCredentials: ZeroCredentials;
    zeroAmountCredentials: RealCredentials;
    zeroVsizeCredentials: RealCredentials;
}

export interface ConfirmationData {
    realAmountCredentials: RealCredentials;
    realVsizeCredentials: RealCredentials;
    zeroAmountCredentials: RealCredentials;
    zeroVsizeCredentials: RealCredentials;
}

export interface RegistrationData {
    aliceId: string;
    amountCredentials: RealCredentials;
    vsizeCredentials: RealCredentials;
    isPayingZeroCoordinationFee: boolean;
}

export interface CoordinatorFeeRate {
    rate: number;
    plebsDontPayThreshold: number;
}

export interface CoinjoinRoundCreatedEvent {
    Type: 'RoundCreated';
    roundParameters: {
        network: string;
        miningFeeRate: number;
        coordinationFeeRate: {
            rate: number;
            plebsDontPayThreshold: number;
        };
        maxSuggestedAmount: number;
        minInputCountByRound: number;
        maxInputCountByRound: number;
        allowedInputAmounts: AllowedRange;
        allowedOutputAmounts: AllowedRange;
        allowedInputScriptTypes: AllowedScriptTypes[];
        allowedOutputScriptTypes: AllowedScriptTypes[];
        standardInputRegistrationTimeout: string;
        connectionConfirmationTimeout: string;
        outputRegistrationTimeout: string;
        transactionSigningTimeout: string;
        blameInputRegistrationTimeout: string;
        minAmountCredentialValue: number;
        maxAmountCredentialValue: number;
        initialInputVsizeAllocation: number;
        maxVsizeCredentialValue: number;
        maxVsizeAllocationPerAlice: number;
        maxTransactionSize: number;
        minRelayTxFee: number;
    };
}

export interface CoinjoinInput {
    outpoint: string;
    txOut: {
        scriptPubKey: string; // format: "0 f23290d9f9be3d13a315b6febe29fc0786d34c96"
        value: number;
    };
    ownershipProof: string;
}

export interface CoinjoinInputAddedEvent {
    Type: 'InputAdded';
    coin: CoinjoinInput;
}

export interface CoinjoinOutput {
    scriptPubKey: string; // format: "0 76215d74689b52e41c1636e46df04bde793be57a"
    value: number;
}

export interface CoinjoinOutputAddedEvent {
    Type: 'OutputAdded';
    output: CoinjoinOutput;
}

export type CoinjoinStateEvent =
    | CoinjoinRoundCreatedEvent
    | CoinjoinInputAddedEvent
    | CoinjoinOutputAddedEvent;

export interface AllowedRange {
    min: number;
    max: number;
}
export type AllowedScriptTypes = 'P2WPKH' | 'Taproot';

export interface CoinjoinState {
    Type: string; // TODO enum?
    events: CoinjoinStateEvent[];
    isFullySigned?: boolean;
    witnesses?: Record<number, string>;
}

export enum RoundPhase {
    InputRegistration = 0,
    ConnectionConfirmation = 1,
    OutputRegistration = 2,
    TransactionSigning = 3,
    Ended = 4,
}

export enum EndRoundState {
    None = 0,
    AbortedWithError = 1,
    AbortedNotEnoughAlices = 2,
    TransactionBroadcastFailed = 3,
    TransactionBroadcasted = 4,
    NotAllAlicesSign = 5,
    AbortedNotEnoughAlicesSigned = 6,
}

export interface FeeRateMedians {
    timeFrame: string; // 1 day, 1 week, 1 month
    medianFeeRate: number;
}

export interface Round {
    id: string;
    blameOf: string;
    phase: RoundPhase;
    endRoundState: EndRoundState;
    amountCredentialIssuerParameters: IssuerParameter;
    vsizeCredentialIssuerParameters: IssuerParameter;
    coinjoinState: CoinjoinState;
    inputRegistrationStart: string;
    inputRegistrationTimeout: string;
    inputRegistrationEnd: string;
}

export interface TxPaymentRequest {
    amount: number;
    recipient_name: string;
    signature: string;
}
