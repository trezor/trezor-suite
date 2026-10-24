import { type NetworkSymbol } from '@suite-common/wallet-config';
// @trezor/coinjoin package is meant to be imported dynamically
// importing types is safe, but importing an enum thru index will bundle whole lib
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import {
    type CoinjoinClientVersion,
    type CoinjoinPrisonInmate,
    type CoinjoinStatusEvent,
    type RegisterAccountParams,
} from '@trezor/coinjoin';
import {
    EndRoundState,
    type RoundPhase,
    type SessionPhase,
    WabiSabiProtocolErrorCode,
} from '@trezor/coinjoin/src/enums';
import { type PartialRecord } from '@trezor/type-utils';

import type { CoinjoinNetworksConfig, CoinjoinServerEnvironment } from './config';

export { EndRoundState, WabiSabiProtocolErrorCode };
export type { RoundPhase, SessionPhase };

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

export interface CoinjoinClientInstance extends Pick<
    CoinjoinStatusEvent,
    'coordinationFeeRate' | 'allowedInputAmounts' | 'feeRateMedian'
> {
    rounds: { id: string; phase: RoundPhase }[]; // store only slice of Round in reducer. may be extended in the future
    version?: CoinjoinClientVersion;
    status: 'loading' | 'loaded' | 'unavailable';
}

export interface CoinjoinSession extends CoinjoinSessionParameters {
    timeCreated: number; // timestamp when was created
    timeEnded?: number; // timestamp when was finished
    paused?: boolean; // current state
    isAutoStopEnabled?: boolean; // auto pause after current round
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

export interface CoinjoinTxCandidate {
    roundId: string;
}

export interface CoinjoinLegalDocuments {
    zkSNACKs: string;
    trezor: string;
}

export interface CoinjoinAccount {
    key: AccountKey; // reference to wallet Account.key
    symbol: NetworkSymbol;
    setup?: CoinjoinSetup; // unless enabled, account uses default (recommended) values
    rawLiquidityClue: RegisterAccountParams['rawLiquidityClue'];
    session?: CoinjoinSession; // current/active authorized session
    checkpoints?: CoinjoinDiscoveryCheckpoint[];
    anonymityGains?: AnonymityGains;
    transactionCandidates?: CoinjoinTxCandidate[];
    prison?: Record<string, Omit<CoinjoinPrisonInmate, 'id' | 'accountKey'>>;
    agreedToLegalDocumentVersions?: CoinjoinLegalDocuments;
    // User override of the derived spending restriction, see selectCoinjoinSpendingRestrictionByAccountKey.
    // Undefined means the restriction is derived from on-chain data.
    areSpendingRestrictionsEnabled?: boolean;
}

/**
 * Spending restriction of a privacy account:
 * - `unrestricted` behaves like a target anonymity of 1: every utxo is available to automatic coin
 *   selection and no anonymity confirmation is needed,
 * - `restricted` keeps the low-anonymity utxos out of automatic coin selection, spendable through
 *   coin control,
 * - `restricted-incomplete-data` is `restricted` without trustworthy anonymity scores, which blocks
 *   sending until the user turns the restrictions off.
 */
export type CoinjoinSpendingRestriction =
    'unrestricted' | 'restricted' | 'restricted-incomplete-data';

export interface CoinjoinDebugSettings {
    coinjoinServerEnvironment?: PartialRecord<NetworkSymbol, CoinjoinServerEnvironment>;
    coinjoinConfigOverride?: PartialRecord<NetworkSymbol, Partial<CoinjoinNetworksConfig>>;
}

export type CoinjoinConfig = {
    averageAnonymityGainPerRound: number;
    roundsFailRateBuffer: number;
    roundsDurationInHours: number;
    maxMiningFeeModifier: number;
    maxFeePerVbyte?: number;
    legalDocumentsVersion: string;
};

export interface CoinjoinState {
    accounts: CoinjoinAccount[];
    clients: PartialRecord<Account['symbol'], CoinjoinClientInstance>;
    isPreloading?: boolean;
    debug?: CoinjoinDebugSettings;
    config: CoinjoinConfig;
}
