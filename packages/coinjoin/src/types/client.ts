import { SessionPhase, WabiSabiProtocolErrorCode } from '../enums';
import { AllowedRange, CoordinationFeeRate, Round } from './coordinator';
import { CoinjoinRequestEvent, CoinjoinRoundEvent } from './round';
import { LogEvent } from './logger';

export interface CoinjoinStatusEvent {
    rounds: Round[];
    changed: Round[];
    feeRateMedian: number;
    coordinationFeeRate: CoordinationFeeRate;
    allowedInputAmounts: AllowedRange;
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
    id: string; // AccountUtxo/Alice.outpoint or AccountAddress scriptPubKey
    sentenceStart: number;
    sentenceEnd: number;
    errorCode?: WabiSabiProtocolErrorCode | 'blameOf';
    reason?: string;
    roundId?: string;
}
