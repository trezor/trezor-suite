import { NetworkSymbol } from '@suite-common/wallet-config';
import { PartialRecord } from '@trezor/type-utils';

// @trezor/coinjoin package is meant to be imported dynamically
// importing types is safe, but importing an enum thru index will bundle whole lib
import { RegisterAccountParams } from '@trezor/coinjoin';
import { RoundPhase, SessionPhase, EndRoundState } from '@trezor/coinjoin/src/enums';

export { RoundPhase, SessionPhase, EndRoundState };

export interface CoinjoinSetup {
    targetAnonymity: number;
    maxFeePerVbyte: number;
    skipRounds: boolean;
}

export interface CoinjoinSessionParameters {
    targetAnonymity: number;
    maxRounds: number;
    skipRounds?: [number, number];
    maxFeePerKvbyte: number;
    maxCoordinatorFeeRate: number;
}

export interface CoinjoinSession extends CoinjoinSessionParameters {
    timeCreated: number; // timestamp when was created
    timeEnded?: number; // timestamp when was finished
    paused?: boolean; // current state
    isAutoPauseEnabled?: boolean; // auto pause after current round
    interrupted?: boolean; // it was paused by force
    starting?: boolean; // is coinjoin session (re)starting, i.e. initiated but not yet running
    sessionPhaseQueue: Array<SessionPhase>;
    roundPhase?: RoundPhase; // current phase enum
    roundPhaseDeadline?: number; // estimated time for phase change
    sessionDeadline?: number; // estimated time for a session's end - not real deadline
    signedRounds: string[]; // already signed rounds
}

export interface CoinjoinDiscoveryCheckpoint {
    blockHash: string;
    blockHeight: number;
    receiveCount: number;
    changeCount: number;
}

export interface AnonymityGainPerRound {
    level: number;
    timestamp: number;
}

export interface AnonymityGains {
    history: AnonymityGainPerRound[];
    lastReportTimestamp?: number;
}

export interface CoinjoinAccount {
    key: string; // reference to wallet Account.key
    symbol: NetworkSymbol;
    setup?: CoinjoinSetup; // unless enabled, account uses default (recommended) values
    rawLiquidityClue: RegisterAccountParams['rawLiquidityClue'];
    session?: CoinjoinSession; // current/active authorized session
    previousSessions: CoinjoinSession[]; // history
    checkpoints?: CoinjoinDiscoveryCheckpoint[];
    anonymityGains?: AnonymityGains;
}

export type CoinjoinServerEnvironment = 'public' | 'staging' | 'localhost';

export interface CoinjoinDebugSettings {
    coinjoinAllowNoTor?: boolean;
    coinjoinServerEnvironment?: PartialRecord<NetworkSymbol, CoinjoinServerEnvironment>;
}

export interface CoinjoinConfig {
    averageAnonymityGainPerRound: number;
    roundsFailRateBuffer: number;
    roundsDurationInHours: number;
    maxMiningFeeModifier: number;
    maxFeePerVbyte?: number;
}
