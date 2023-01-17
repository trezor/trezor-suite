import { RoundPhase, EndRoundState } from '../enums';

export type AffiliationFlag = 'trezor' | 'WalletWasabi';

export interface CoinjoinStatus {
    roundStates: Round[];
    coinJoinFeeRateMedians: FeeRateMedians[];
    affiliateInformation: {
        runningAffiliateServers: AffiliationFlag[];
        coinjoinRequests: Record<string, Record<AffiliationFlag, string>>;
    };
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
    realAmountCredentials?: RealCredentials; // real Credentials are not present in phase: 0
    realVsizeCredentials?: RealCredentials;
    zeroAmountCredentials: RealCredentials;
    zeroVsizeCredentials: RealCredentials;
}

export interface RegistrationData {
    aliceId: string;
    amountCredentials: RealCredentials;
    vsizeCredentials: RealCredentials;
    isPayingZeroCoordinationFee: boolean;
}

export interface CoordinationFeeRate {
    rate: number;
    plebsDontPayThreshold: number;
}

export interface CoinjoinRoundParameters {
    network: string;
    miningFeeRate: number;
    coordinationFeeRate: CoordinationFeeRate;
    maxSuggestedAmount: number;
    minInputCountByRound: number;
    maxInputCountByRound: number;
    allowedInputAmounts: AllowedRange;
    allowedOutputAmounts: AllowedRange;
    allowedInputTypes: AllowedScriptTypes[];
    allowedOutputTypes: AllowedScriptTypes[];
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
}

export interface CoinjoinRoundCreatedEvent {
    Type: 'RoundCreated';
    roundParameters: CoinjoinRoundParameters;
}

export interface CoinjoinInput {
    outpoint: string;
    txOut: {
        scriptPubKey: string; // format: "0 f23290d9f9be3d13a315b6febe29fc0786d34c96"
        value: number;
    };
}

export interface CoinjoinInputAddedEvent {
    Type: 'InputAdded';
    coin: CoinjoinInput;
    ownershipProof: string;
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
    affiliateRequest?: string; // conditionally added by ./client/Status
}

// errors from coordinator in string based format (see ./utils/http coordinatorRequest errorCode handling)
export enum WabiSabiProtocolErrorCode {
    RoundNotFound = 'RoundNotFound',
    WrongPhase = 'WrongPhase',
    InputSpent = 'InputSpent',
    InputUnconfirmed = 'InputUnconfirmed',
    InputImmature = 'InputImmature',
    WrongOwnershipProof = 'WrongOwnershipProof',
    TooManyInputs = 'TooManyInputs',
    NotEnoughFunds = 'NotEnoughFunds',
    TooMuchFunds = 'TooMuchFunds',
    NonUniqueInputs = 'NonUniqueInputs',
    InputBanned = 'InputBanned',
    InputLongBanned = 'InputLongBanned',
    InputNotWhitelisted = 'InputNotWhitelisted',
    AliceNotFound = 'AliceNotFound',
    IncorrectRequestedVsizeCredentials = 'IncorrectRequestedVsizeCredentials',
    TooMuchVsize = 'TooMuchVsize',
    ScriptNotAllowed = 'ScriptNotAllowed',
    IncorrectRequestedAmountCredentials = 'IncorrectRequestedAmountCredentials',
    WrongCoinjoinSignature = 'WrongCoinjoinSignature',
    SignatureTooLong = 'SignatureTooLong',
    AliceAlreadyRegistered = 'AliceAlreadyRegistered',
    NonStandardInput = 'NonStandardInput',
    NonStandardOutput = 'NonStandardOutput',
    WitnessAlreadyProvided = 'WitnessAlreadyProvided',
    InsufficientFees = 'InsufficientFees',
    SizeLimitExceeded = 'SizeLimitExceeded',
    DustOutput = 'DustOutput',
    UneconomicalInput = 'UneconomicalInput',
    VsizeQuotaExceeded = 'VsizeQuotaExceeded',
    DeltaNotZero = 'DeltaNotZero',
    WrongNumberOfCreds = 'WrongNumberOfCreds',
    CryptoException = 'CryptoException',
    AliceAlreadySignalled = 'AliceAlreadySignalled',
    AliceAlreadyConfirmedConnection = 'AliceAlreadyConfirmedConnection',
    AlreadyRegisteredScript = 'AlreadyRegisteredScript',
}

export interface CoinjoinAffiliateRequest {
    fee_rate: number;
    no_fee_threshold: number;
    min_registrable_amount: number;
    mask_public_key: string;
    coinjoin_flags_array: number[];
    signature: string;
}
