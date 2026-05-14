import type { Round } from './coordinator';
import type { LogEvent } from './logger';
import type { CoinjoinPrisonEvents } from './prison';
import type { CoinjoinRequestEvent, CoinjoinRoundEvent, SessionPhaseEvent } from './round';

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
    'session-phase': SessionPhaseEvent;
}
