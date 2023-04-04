export enum SessionPhase {
    // RoundPhase.InputRegistration
    RoundSearch = 11,
    CoinSelection = 12,
    RoundPairing = 13,
    CoinRegistration = 14,
    // error phases
    AccountMissingUtxos = 15,
    SkippingRound = 16,
    RetryingRoundPairing = 17,
    AffiliateServerOffline = 18,
    CriticalError = 19,

    // RoundPhase.ConnectionConfirmation
    AwaitingConfirmation = 21,
    AwaitingOthersConfirmation = 22,

    // RoundPhase.OutputRegistration
    RegisteringOutputs = 31,
    AwaitingOthersOutputs = 32,
    // error phase
    OutputRegistrationFailed = 33,

    // RoundPhase.TransactionSigning
    AwaitingCoinjoinTransaction = 41,
    TransactionSigning = 42,
    SendingSignature = 43,
    AwaitingOtherSignatures = 44,
    // error phases
    SignatureFailed = 45,
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
    AbortedNotAllAlicesConfirmed = 7,
    AbortedLoadBalancing = 8,
}

// https://github.com/zkSNACKs/WalletWasabi/blob/457d6ec6502a23f6267a4fadad9642f583973f7c/WalletWasabi/WabiSabi/Backend/Models/WabiSabiProtocolErrorCode.cs

export enum WabiSabiProtocolErrorCode {
    RoundNotFound = 0,
    WrongPhase = 1,
    InputSpent = 2,
    InputUnconfirmed = 3,
    InputImmature = 4,
    WrongOwnershipProof = 5,
    TooManyInputs = 6,
    NotEnoughFunds = 7,
    TooMuchFunds = 8,
    NonUniqueInputs = 9,
    InputBanned = 10,
    InputLongBanned = 11,
    InputNotWhitelisted = 12,
    AliceNotFound = 13,
    IncorrectRequestedVsizeCredentials = 14,
    TooMuchVsize = 15,
    ScriptNotAllowed = 16,
    IncorrectRequestedAmountCredentials = 17,
    WrongCoinjoinSignature = 18,
    AliceAlreadyRegistered = 19,
    NonStandardInput = 20,
    NonStandardOutput = 21,
    WitnessAlreadyProvided = 22,
    InsufficientFees = 23,
    SizeLimitExceeded = 24,
    DustOutput = 25,
    UneconomicalInput = 26,
    VsizeQuotaExceeded = 27,
    DeltaNotZero = 28,
    WrongNumberOfCreds = 29,
    CryptoException = 30,
    AliceAlreadySignalled = 31,
    AliceAlreadyConfirmedConnection = 32,
    AlreadyRegisteredScript = 33,
    SignatureTooLong = 34,
}
