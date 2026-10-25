import {
    type Credential,
    type CredentialPresentation,
    type IssuanceRequest,
    type IssuanceValidationData,
} from './credential';
import { type GroupElement } from './groupElement';
import { type Proof } from './linearRelation';
import { type Mac } from './mac';
import { type Transcript } from './transcript';

/**
 * Port of `NWabiSabi/WabiSabi/CredentialRequesting/*`.
 *
 * `ICredentialsRequest` is the unified protocol message used in both input and output
 * registration. A positive `delta` means input registration, a negative one output
 * registration, and zero a reissuance or a request for zero-value credentials.
 */
export interface CredentialsRequest {
    delta: number;
    presented: readonly CredentialPresentation[];
    requested: readonly IssuanceRequest[];
    proofs: readonly Proof[];
}

export class ZeroCredentialsRequest implements CredentialsRequest {
    readonly delta = 0;
    readonly presented: readonly CredentialPresentation[] = [];

    constructor(
        readonly requested: readonly IssuanceRequest[],
        readonly proofs: readonly Proof[],
    ) {}
}

export class RealCredentialsRequest implements CredentialsRequest {
    constructor(
        readonly delta: number,
        readonly presented: readonly CredentialPresentation[],
        readonly requested: readonly IssuanceRequest[],
        readonly proofs: readonly Proof[],
    ) {}
}

/**
 * Port of `CredentialsResponseValidation.cs`.
 *
 * The state needed to validate the credentials once the coordinator issues them. The
 * transcript is a live object held in round state; it is neither serialized nor sent
 * anywhere.
 */
export class CredentialsResponseValidation {
    constructor(
        readonly transcript: Transcript,
        readonly presented: readonly Credential[],
        readonly requested: readonly IssuanceValidationData[],
    ) {}
}

/** Port of `CredentialsResponse.cs` — what the coordinator sends back. */
export interface CredentialsResponse {
    issuedCredentials: readonly Mac[];
    proofs: readonly Proof[];
}

export interface ZeroCredentialsRequestData {
    credentialsRequest: ZeroCredentialsRequest;
    credentialsResponseValidation: CredentialsResponseValidation;
}

export interface RealCredentialsRequestData {
    credentialsRequest: RealCredentialsRequest;
    credentialsResponseValidation: CredentialsResponseValidation;
}

/** `CredentialsRequestExtensions.IsNullRequest`. */
export const isNullRequest = (request: CredentialsRequest) =>
    request.delta === 0 && request.presented.length === 0;

/** `CredentialsRequestExtensions.IsPresentationOnlyRequest`. */
export const isPresentationOnlyRequest = (request: CredentialsRequest) =>
    request.delta < 0 && request.requested.length === 0;

/** `CredentialsRequestExtensions.SerialNumbers`. */
export const serialNumbers = (request: CredentialsRequest): GroupElement[] =>
    request.presented.map(presentation => presentation.s);

/** `CredentialsRequestExtensions.AreThereDuplicatedSerialNumbers`. */
export const areThereDuplicatedSerialNumbers = (request: CredentialsRequest) => {
    const serials = serialNumbers(request).map(serial => serial.toHex());

    return new Set(serials).size < serials.length;
};
