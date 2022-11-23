export enum SessionPhase {
    // RoundPhase.InputRegistration
    RoundSearch = 11,
    CoinSelection = 12,
    RoundPairing = 13,
    CoinRegistration = 14,

    // RoundPhase.ConnectionConfirmation
    ConfirmingAvailability = 21,
    AwaitingParticipants = 22,

    // RoundPhase.OutputRegistration
    RegisteringOutputs = 31,
    AwaitingVerification = 32,

    // RoundPhase.TransactionSigning
    AwaitingCoinjoinTransaction = 41,
    TransactionSigning = 42,
    SendingToCoordinator = 43,
    AwaitingOtherSignatures = 44,
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
