import { SessionPhase } from '../enums';
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
    round: CoinjoinRoundEvent;
    request: CoinjoinRequestEvent[];
    log: LogEvent;
    'session-phase': {
        phase: SessionPhase;
        accountKeys: string[];
    };
}
