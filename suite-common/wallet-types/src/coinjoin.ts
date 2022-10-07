export interface CoinjoinSessionParameters {
    anonymityLevel: number;
    maxRounds: number;
    maxFeePerKvbyte: number;
    maxCoordinatorFeeRate: number;
}

// this is a duplicate of @trezor/coinjoin enum.
// @trezor/coinjoin package is meant to be imported dynamically
// importing types is safe, but importing an enum will bundle whole lib
export enum RoundPhase {
    InputRegistration = 0,
    ConnectionConfirmation = 1,
    OutputRegistration = 2,
    TransactionSigning = 3,
    Ended = 4,
}

export interface CoinjoinSession extends CoinjoinSessionParameters {
    timeCreated: number; // timestamp when was created
    timeEnded?: number; // timestamp when was finished
    phase?: RoundPhase; // current phase enum
    deadline: string | number; // estimated time for phase change
    signedRounds: string[]; // already signed rounds
}

export interface CoinjoinAccount {
    key: string; // reference to wallet Account.key
    session?: CoinjoinSession; // current/active authorized session
    previousSessions: CoinjoinSession[]; // history
}
