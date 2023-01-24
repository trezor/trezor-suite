import { NetworkSymbol } from '@suite-common/wallet-config';

// @trezor/coinjoin package is meant to be imported dynamically
// importing types is safe, but importing an enum thru index will bundle whole lib
import { RegisterAccountParams } from '@trezor/coinjoin';
import { RoundPhase, SessionPhase } from '@trezor/coinjoin/src/enums';

export { RoundPhase, SessionPhase };

export type CoinjoinServerEnvironment = 'localhost' | 'public';

export interface CoinjoinSessionParameters {
    targetAnonymity: number;
    maxRounds: number;
    skipRounds?: [number, number];
    maxFeePerKvbyte: number;
    maxCoordinatorFeeRate: number;
}

export interface CoinjoinSession extends CoinjoinSessionParameters {
    registeredUtxos: string[]; // list of utxos (outpoints) registered in session
    timeCreated: number; // timestamp when was created
    timeEnded?: number; // timestamp when was finished
    paused?: boolean; // current state
    interrupted?: boolean; // it was paused by force
    sessionPhaseQueue: Array<SessionPhase>;
    roundPhase?: RoundPhase; // current phase enum
    roundPhaseDeadline?: string | number; // estimated time for phase change
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
    rawLiquidityClue: RegisterAccountParams['rawLiquidityClue'];
    session?: CoinjoinSession; // current/active authorized session
    previousSessions: CoinjoinSession[]; // history
    checkpoints?: CoinjoinDiscoveryCheckpoint[];
}

export interface CoinjoinDebugSettings {
    coinjoinAllowNoTor?: boolean;
    coinjoinRegtestServerEnvironment?: CoinjoinServerEnvironment;
}
