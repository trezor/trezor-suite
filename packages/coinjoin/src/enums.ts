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
