import { NetworkSymbol } from '@suite-common/wallet-config';

export type CoinjoinServerEnvironment = 'localhost' | 'public';

export interface CoinjoinSessionParameters {
    targetAnonymity: number;
    maxRounds: number;
    skipRounds?: [number, number];
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
    registeredUtxos: string[]; // list of utxos (outpoints) registered in session
    timeCreated: number; // timestamp when was created
    timeEnded?: number; // timestamp when was finished
    paused?: boolean; // current state
    interrupted?: boolean; // it was paused by force
    phase?: RoundPhase; // current phase enum
    phaseDeadline: string | number; // estimated time for phase change
    sessionDeadline?: string | number; // estimated time for a session's end
    signedRounds: string[]; // already signed rounds
}

export interface CoinjoinDiscoveryCheckpoint {
    blockHash: string;
    blockHeight: number;
    receiveCount: number;
    changeCount: number;
}

export interface CoinjoinAccount {
    key: string; // reference to wallet Account.key
    symbol: NetworkSymbol;
    targetAnonymity: number; // anonymity set by the user
    session?: CoinjoinSession; // current/active authorized session
    previousSessions: CoinjoinSession[]; // history
    checkpoints?: CoinjoinDiscoveryCheckpoint[];
}
