import { SessionPhase, WabiSabiProtocolErrorCode } from '../enums';
import { Round } from './coordinator';
import { CoinjoinRequestEvent, CoinjoinRoundEvent } from './round';
import { LogEvent } from './logger';

export interface CoinjoinStatusEvent {
    rounds: Round[];
    changed: Round[];
    feeRateMedian: number;
    coordinationFeeRate: {
        rate: number;
        plebsDontPayThreshold: number;
    };
    allowedInputAmounts: {
        min: number;
        max: number;
    };
}

export interface CoinjoinClientVersion {
    majorVersion: string;
    commitHash: string;
    legalDocumentsVersion: string;
}

export interface CoinjoinClientEvents {
    status: CoinjoinStatusEvent;
    prison: CoinjoinPrisonEvents['change'];
    round: CoinjoinRoundEvent;
    request: CoinjoinRequestEvent[];
    log: LogEvent;
    'session-phase': {
        phase: SessionPhase;
        accountKeys: string[];
    };
}

export interface CoinjoinPrisonEvents {
    change: { prison: CoinjoinPrisonInmate[] };
}

export interface CoinjoinPrisonInmate {
    type: 'input' | 'output' | 'account';
    accountKey: string;
    id: string; // AccountUtxo/Alice.outpoint or AccountAddress scriptPubKey or Account key
    sentenceStart: number;
    sentenceEnd: number;
    errorCode?: WabiSabiProtocolErrorCode | 'blameOf';
    reason?: string;
    roundId?: string;
}
