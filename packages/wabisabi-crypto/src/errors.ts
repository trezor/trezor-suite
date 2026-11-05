/** Port of `NWabiSabi/WabiSabi/WabiSabiCryptoErrorCode.cs`. */
export enum WabiSabiCryptoErrorCode {
    Unspecified = 0,
    SerialNumberAlreadyUsed = 1,
    CoordinatorReceivedInvalidProofs = 2,
    NegativeBalance = 3,
    InvalidBitCommitment = 4,
    ClientReceivedInvalidProofs = 5,
    IssuedCredentialNumberMismatch = 6,
    SerialNumberDuplicated = 7,
    NotEnoughZeroCredentialToFillTheRequest = 8,
    InvalidNumberOfRequestedCredentials = 9,
    InvalidNumberOfPresentedCredentials = 10,
    CredentialToPresentDuplicated = 11,
}

/** Port of `NWabiSabi/WabiSabi/WabiSabiCryptoException.cs`. */
export class WabiSabiCryptoError extends Error {
    readonly code: WabiSabiCryptoErrorCode;

    constructor(code: WabiSabiCryptoErrorCode, message?: string) {
        super(message ?? WabiSabiCryptoErrorCode[code]);
        this.name = 'WabiSabiCryptoError';
        this.code = code;
    }
}
