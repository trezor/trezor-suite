import {
    Credential,
    CredentialPresentation,
    IssuanceRequest,
    IssuanceValidationData,
} from './credential';
import { CredentialIssuerParameters } from './credentialIssuerParameters';
import { type CredentialsRequest, type CredentialsResponse } from './credentialRequesting';
import { GroupElement } from './groupElement';
import { fromHex, toHex } from './hex';
import { Proof } from './linearRelation';
import { Mac } from './mac';
import { type Scalar, scalarFromBytes, scalarToBytes } from './scalar';

/**
 * The WabiSabi wire format.
 *
 * Serialization parity is a separate requirement from computation parity: the
 * coordinator sees these objects verbatim, with PascalCase keys, compressed SEC1
 * points as UPPERCASE hex and scalars as 32-byte UPPERCASE hex (upstream
 * `ByteHelpers.ToHex`, i.e. `Convert.ToHexString`). A correct proof serialized
 * differently is a rejected input registration.
 */

export interface SerializedMac {
    T: string;
    V: string;
}

export interface SerializedProof {
    PublicNonces: string[];
    Responses: string[];
}

export interface SerializedCredentialPresentation {
    Ca: string;
    Cx0: string;
    Cx1: string;
    CV: string;
    S: string;
}

export interface SerializedIssuanceRequest {
    Ma: string;
    BitCommitments: string[];
}

export interface SerializedCredentialsRequest {
    Delta: number;
    Presented: SerializedCredentialPresentation[];
    Requested: SerializedIssuanceRequest[];
    Proofs: SerializedProof[];
}

export interface SerializedCredentialsResponse {
    IssuedCredentials: SerializedMac[];
    Proofs: SerializedProof[];
}

export interface SerializedCredential {
    Value: number;
    Randomness: string;
    Mac: SerializedMac;
}

export interface SerializedIssuanceValidationData {
    Value: number;
    Randomness: string;
    Ma: string;
}

export interface SerializedIssuerParameters {
    Cw: string;
    I: string;
}

export const serializeGroupElement = (element: GroupElement) => element.toHex();

export const deserializeGroupElement = (hex: string) => GroupElement.fromBytes(fromHex(hex));

export const serializeScalar = (scalar: Scalar) => toHex(scalarToBytes(scalar));

export const deserializeScalar = (hex: string): Scalar => {
    const { scalar, overflow } = scalarFromBytes(fromHex(hex));
    if (overflow) {
        throw new Error(`Scalar out of range: ${hex}.`);
    }

    return scalar;
};

export const serializeMac = (mac: Mac): SerializedMac => ({
    T: serializeScalar(mac.t),
    V: serializeGroupElement(mac.v),
});

export const deserializeMac = (serialized: SerializedMac) =>
    new Mac(deserializeScalar(serialized.T), deserializeGroupElement(serialized.V));

export const serializeProof = (proof: Proof): SerializedProof => ({
    PublicNonces: proof.publicNonces.map(serializeGroupElement),
    Responses: proof.responses.map(serializeScalar),
});

export const deserializeProof = (serialized: SerializedProof) =>
    new Proof(
        serialized.PublicNonces.map(deserializeGroupElement),
        serialized.Responses.map(deserializeScalar),
    );

export const serializeCredentialPresentation = (
    presentation: CredentialPresentation,
): SerializedCredentialPresentation => ({
    Ca: serializeGroupElement(presentation.ca),
    Cx0: serializeGroupElement(presentation.cx0),
    Cx1: serializeGroupElement(presentation.cx1),
    CV: serializeGroupElement(presentation.cV),
    S: serializeGroupElement(presentation.s),
});

export const deserializeCredentialPresentation = (serialized: SerializedCredentialPresentation) =>
    new CredentialPresentation(
        deserializeGroupElement(serialized.Ca),
        deserializeGroupElement(serialized.Cx0),
        deserializeGroupElement(serialized.Cx1),
        deserializeGroupElement(serialized.CV),
        deserializeGroupElement(serialized.S),
    );

export const serializeIssuanceRequest = (request: IssuanceRequest): SerializedIssuanceRequest => ({
    Ma: serializeGroupElement(request.ma),
    BitCommitments: request.bitCommitments.map(serializeGroupElement),
});

export const deserializeIssuanceRequest = (serialized: SerializedIssuanceRequest) =>
    new IssuanceRequest(
        deserializeGroupElement(serialized.Ma),
        serialized.BitCommitments.map(deserializeGroupElement),
    );

/** What is POSTed to the coordinator. The key order matches upstream's model classes. */
export const serializeCredentialsRequest = (
    request: CredentialsRequest,
): SerializedCredentialsRequest => ({
    Delta: request.delta,
    Presented: request.presented.map(serializeCredentialPresentation),
    Requested: request.requested.map(serializeIssuanceRequest),
    Proofs: request.proofs.map(serializeProof),
});

export const serializeCredentialsResponse = (
    response: CredentialsResponse,
): SerializedCredentialsResponse => ({
    IssuedCredentials: response.issuedCredentials.map(serializeMac),
    Proofs: response.proofs.map(serializeProof),
});

export const deserializeCredentialsResponse = (
    serialized: SerializedCredentialsResponse,
): CredentialsResponse => ({
    issuedCredentials: serialized.IssuedCredentials.map(deserializeMac),
    proofs: serialized.Proofs.map(deserializeProof),
});

export const serializeCredential = (credential: Credential): SerializedCredential => ({
    Value: credential.value,
    Randomness: serializeScalar(credential.randomness),
    Mac: serializeMac(credential.mac),
});

export const deserializeCredential = (serialized: SerializedCredential) =>
    new Credential(
        serialized.Value,
        deserializeScalar(serialized.Randomness),
        deserializeMac(serialized.Mac),
    );

export const serializeIssuanceValidationData = (
    data: IssuanceValidationData,
): SerializedIssuanceValidationData => ({
    Value: data.value,
    Randomness: serializeScalar(data.randomness),
    Ma: serializeGroupElement(data.ma),
});

export const deserializeIssuanceValidationData = (serialized: SerializedIssuanceValidationData) =>
    new IssuanceValidationData(
        serialized.Value,
        deserializeScalar(serialized.Randomness),
        deserializeGroupElement(serialized.Ma),
    );

export const serializeIssuerParameters = (
    iparams: CredentialIssuerParameters,
): SerializedIssuerParameters => ({
    Cw: serializeGroupElement(iparams.Cw),
    I: serializeGroupElement(iparams.I),
});

export const deserializeIssuerParameters = (serialized: SerializedIssuerParameters) =>
    new CredentialIssuerParameters(
        deserializeGroupElement(serialized.Cw),
        deserializeGroupElement(serialized.I),
    );
