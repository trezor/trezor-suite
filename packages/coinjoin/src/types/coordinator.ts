import {
    type CredentialsResponseValidation,
    type SerializedCredentialsRequest,
    type SerializedMac,
    type SerializedProof,
} from '@trezor/wabisabi-crypto';

import { type EndRoundState, type RoundPhase } from '../enums';

export interface CoinjoinStatus {
    RoundStates: Round[];
    CoinJoinFeeRateMedians: FeeRateMedians[];
}

export interface SoftwareVersion {
    ClientVersion: string;
    BackenMajordVersion: string; // NOTE: typo is intentional https://github.com/zkSNACKs/WalletWasabi/blob/18edb38d4fb0a3ce75ff161e47d4b50fa9f71575/WalletWasabi/Backend/Models/Responses/VersionsResponse.cs#L9
    LegalDocumentsVersion: string;
    Ww2LegalDocumentsVersion: string;
    CommitHash: string;
}

/**
 * What is POSTed to the coordinator: the already-serialized credential request.
 *
 * `@trezor/wabisabi-crypto` produces exactly the shape the coordinator expects —
 * PascalCase keys, compressed SEC1 points and scalars as uppercase hex — so this is a
 * re-export rather than a parallel definition.
 */
export type CredentialsRequestData = SerializedCredentialsRequest;

/** What the coordinator sends back: the issued MACs and the issuer-parameters proofs. */
export interface CredentialsResponseData {
    IssuedCredentials: SerializedMac[];
    Proofs: SerializedProof[];
}

/**
 * A credential request together with the state needed to validate the response to it.
 *
 * `CredentialsResponseValidation` is a live object from `@trezor/wabisabi-crypto`: it
 * holds the Fiat-Shamir transcript the request was built against, plus the presented
 * credentials and the blinding factors of the requested ones. It stays in round state for
 * the duration of a request/response pair and is neither serialized nor sent anywhere.
 */
export interface CredentialsBundle {
    CredentialsRequest: CredentialsRequestData;
    CredentialsResponseValidation: CredentialsResponseValidation;
}

/** A request for zero-value credentials (a null request). */
export type ZeroCredentials = CredentialsBundle;

/** A request that presents credentials and asks for new ones. */
export type RealCredentials = CredentialsBundle;

export interface IssuerParameter {
    Cw: string;
    I: string;
}

export interface IssuanceData {
    RealAmountCredentials: CredentialsResponseData;
    RealVsizeCredentials: CredentialsResponseData;
    ZeroAmountCredentials: CredentialsResponseData;
    ZeroVsizeCredentials: CredentialsResponseData;
}

export interface ConfirmationData {
    RealAmountCredentials?: CredentialsResponseData; // real Credentials are not present in phase: 0
    RealVsizeCredentials?: CredentialsResponseData;
    ZeroAmountCredentials: CredentialsResponseData;
    ZeroVsizeCredentials: CredentialsResponseData;
}

export interface RegistrationData {
    AliceId: string;
    AmountCredentials: CredentialsResponseData;
    VsizeCredentials: CredentialsResponseData;
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
    // Also the max vsize credential value. Coordinators running WalletWasabi 2.8.0 or newer no
    // longer send MaxVsizeCredentialValue.
    MaxVsizeAllocationPerAlice: number;
    MaxTransactionSize: number;
    MinRelayTxFee: number;
    DelayTransactionSigning: boolean;
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
    CoinjoinRoundCreatedEvent | CoinjoinInputAddedEvent | CoinjoinOutputAddedEvent;

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
}

export interface CoinjoinRequest {
    fee_rate: number;
    no_fee_threshold: number;
    min_registrable_amount: number;
}
