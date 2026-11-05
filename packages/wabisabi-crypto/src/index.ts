export { UPSTREAM } from './upstream';
export { WabiSabiCryptoError, WabiSabiCryptoErrorCode } from './errors';
export {
    CREDENTIAL_NUMBER,
    DOMAIN_STROBE_SEPARATOR,
    WABISABI_PROTOCOL_IDENTIFIER,
} from './protocolConstants';

export { Strobe128, StrobeFlags, StrobeHasher } from './strobe';
export { fromHex, toHex } from './hex';
export {
    type Scalar,
    SCALAR_BYTES,
    SCALAR_ONE,
    SCALAR_ORDER,
    SCALAR_ZERO,
    scalarAdd,
    scalarFromBytes,
    scalarFromNumber,
    scalarIsZero,
    scalarMultiply,
    scalarNegate,
    scalarSum,
    scalarToBytes,
} from './scalar';
export {
    GroupElement,
    groupElementFromBuffer,
    groupElementFromText,
    groupElementSum,
    multiScalarMultiply,
} from './groupElement';
export * as Generators from './generators';

export { SyntheticSecretNonceProvider, Transcript } from './transcript';
export { Equation, Knowledge, Proof, Statement } from './linearRelation';
export * as ProofSystem from './proofSystem';

export { Mac, generateU } from './mac';
export { CredentialIssuerParameters } from './credentialIssuerParameters';
export { pedersenCommitment } from './commitment';
export {
    Credential,
    CredentialPresentation,
    IssuanceRequest,
    IssuanceValidationData,
} from './credential';
export {
    type CredentialsRequest,
    type CredentialsResponse,
    CredentialsResponseValidation,
    type RealCredentialsRequestData,
    RealCredentialsRequest,
    ZeroCredentialsRequest,
    type ZeroCredentialsRequestData,
    areThereDuplicatedSerialNumbers,
    isNullRequest,
    isPresentationOnlyRequest,
    serialNumbers,
} from './credentialRequesting';
export { WabiSabiClient, buildTranscript } from './wabiSabiClient';
export { type Random, getScalarFrom, secureRandom } from './random';
export * from './serialization';
