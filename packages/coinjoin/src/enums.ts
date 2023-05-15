export enum SessionPhase {
    // RoundPhase.InputRegistration
    RoundSearch = 101,
    CoinSelection = 102,
    RoundPairing = 103,
    CoinRegistration = 104,
    // error phases
    AccountMissingUtxos = 151,
    SkippingRound = 152,
    RetryingRoundPairing = 153,
    AffiliateServerOffline = 154,
    CriticalError = 155,
    BlockedUtxos = 156,

    // RoundPhase.ConnectionConfirmation
    AwaitingConfirmation = 201,
    AwaitingOthersConfirmation = 202,

    // RoundPhase.OutputRegistration
    RegisteringOutputs = 301,
    AwaitingOthersOutputs = 302,
    // error phase
    OutputRegistrationFailed = 351,

    // RoundPhase.TransactionSigning
    AwaitingCoinjoinTransaction = 401,
    TransactionSigning = 402,
    SendingSignature = 403,
    AwaitingOtherSignatures = 404,
    // error phases
    SignatureFailed = 451,
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
