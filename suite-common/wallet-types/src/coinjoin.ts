export interface CoinjoinSessionParameters {
    anonymityLevel: number;
    maxRounds: number;
    maxFeePerKvbyte: number;
    maxCoordinatorFeeRate: number;
}

export interface CoinjoinSession extends CoinjoinSessionParameters {
    timeCreated: number; // timestamp when was created
    timeEnded?: number; // timestamp when was finished
    phase?: number; // current phase enum
    deadline: string | number; // estimated time for phase change
    signedRounds: string[]; // already signed rounds
}

export interface CoinjoinAccount {
    key: string; // reference to wallet Account.key
    session?: CoinjoinSession; // current/active authorized session
    previousSessions: CoinjoinSession[]; // history
}
