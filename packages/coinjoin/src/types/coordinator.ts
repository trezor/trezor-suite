import { RoundPhase, EndRoundState } from '../enums';
import { AFFILIATION_ID } from '../constants';

export type AffiliationId = keyof typeof AFFILIATION_ID;

export interface CoinjoinStatus {
    RoundStates: Round[];
    CoinJoinFeeRateMedians: FeeRateMedians[];
    AffiliateInformation?: {
        RunningAffiliateServers: AffiliationId[];
        AffiliateData: Record<string, Record<AffiliationId, string>>;
    };
}

export interface SoftwareVersion {
    ClientVersion: string;
    BackenMajordVersion: string; // NOTE: typo is intentional https://github.com/zkSNACKs/WalletWasabi/blob/18edb38d4fb0a3ce75ff161e47d4b50fa9f71575/WalletWasabi/Backend/Models/Responses/VersionsResponse.cs#L9
    LegalDocumentsVersion: string;
    Ww2LegalDocumentsVersion: string;
    CommitHash: string;
}

export interface CredentialsResponseValidation {
    Transcript: Record<string, any>;
    Presented: any[];
    Requested: any[];
}

export interface CredentialsRequestData {
    Delta: number;
    Presented: any[];
    Proofs: any[];
    Requested: any[];
}

export interface ZeroCredentials {
    CredentialsRequest: CredentialsRequestData;
    CredentialsResponseValidation: CredentialsResponseValidation;
}

export interface RealCredentials {
    CredentialsRequest: CredentialsRequestData;
    CredentialsResponseValidation: CredentialsResponseValidation;
}

export interface IssuerParameter {
    Cw: string;
    I: string;
}

export interface IssuanceData {
    RealAmountCredentials: ZeroCredentials;
    RealVsizeCredentials: ZeroCredentials;
    ZeroAmountCredentials: RealCredentials;
    ZeroVsizeCredentials: RealCredentials;
}

export interface ConfirmationData {
    RealAmountCredentials?: RealCredentials; // real Credentials are not present in phase: 0
    RealVsizeCredentials?: RealCredentials;
    ZeroAmountCredentials: RealCredentials;
    ZeroVsizeCredentials: RealCredentials;
}

export interface RegistrationData {
    AliceId: string;
    AmountCredentials: RealCredentials;
    VsizeCredentials: RealCredentials;
    IsPayingZeroCoordinationFee: boolean;
}

export interface CoordinationFeeRate {
    Rate: number;
    PlebsDontPayThreshold: number;
}

export interface CoinjoinRoundParameters {
    Network: string;
    MiningFeeRate: number;
    CoordinationFeeRate: CoordinationFeeRate;
    MaxSuggestedAmount: number;
    MinInputCountByRound: number;
    MaxInputCountByRound: number;
    AllowedInputAmounts: AllowedRange;
    AllowedOutputAmounts: AllowedRange;
    AllowedInputTypes: AllowedScriptTypes[];
    AllowedOutputTypes: AllowedScriptTypes[];
    StandardInputRegistrationTimeout: string;
    ConnectionConfirmationTimeout: string;
    OutputRegistrationTimeout: string;
    TransactionSigningTimeout: string;
    BlameInputRegistrationTimeout: string;
    MinAmountCredentialValue: number;
    MaxAmountCredentialValue: number;
    InitialInputVsizeAllocation: number;
    MaxVsizeCredentialValue: number;
    MaxVsizeAllocationPerAlice: number;
    MaxTransactionSize: number;
    MinRelayTxFee: number;
}

export interface CoinjoinRoundCreatedEvent {
    Type: 'RoundCreated';
    RoundParameters: CoinjoinRoundParameters;
}

export interface CoinjoinInput {
    Outpoint: string;
    TxOut: {
        ScriptPubKey: string; // format: "0 f23290d9f9be3d13a315b6febe29fc0786d34c96"
        Value: number;
    };
}

export interface CoinjoinInputAddedEvent {
    Type: 'InputAdded';
    Coin: CoinjoinInput;
    OwnershipProof: string;
}

export interface CoinjoinOutput {
    ScriptPubKey: string; // format: "0 76215d74689b52e41c1636e46df04bde793be57a"
    Value: number;
}

export interface CoinjoinOutputAddedEvent {
    Type: 'OutputAdded';
    Output: CoinjoinOutput;
}

export type CoinjoinStateEvent =
    | CoinjoinRoundCreatedEvent
    | CoinjoinInputAddedEvent
    | CoinjoinOutputAddedEvent;

export interface AllowedRange {
    Min: number;
    Max: number;
}
export type AllowedScriptTypes = 'P2WPKH' | 'Taproot';

export interface CoinjoinState {
    Type: string; // TODO enum?
    Events: CoinjoinStateEvent[];
    IsFullySigned?: boolean;
    Witnesses?: Record<number, string>;
}

export interface FeeRateMedians {
    TimeFrame: string; // 1 day, 1 week, 1 month
    MedianFeeRate: number;
}

export interface Round {
    Id: string;
    BlameOf: string;
    Phase: RoundPhase;
    EndRoundState: EndRoundState;
    AmountCredentialIssuerParameters: IssuerParameter;
    VsizeCredentialIssuerParameters: IssuerParameter;
    CoinjoinState: CoinjoinState;
    InputRegistrationStart: string;
    InputRegistrationTimeout: string;
    InputRegistrationEnd: string;
    AffiliateRequest?: string; // conditionally added by ./client/Status
}

export interface CoinjoinAffiliateRequest {
    fee_rate: number;
    no_fee_threshold: number;
    min_registrable_amount: number;
    mask_public_key: string;
    coinjoin_flags_array: number[];
    signature: string;
}
