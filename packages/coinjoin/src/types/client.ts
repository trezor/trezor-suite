import { SessionPhase } from '../enums';
import { AllowedRange, CoordinationFeeRate, FeeRateMedians, Round } from './coordinator';
import { CoinjoinRequestEvent, CoinjoinRoundEvent } from './round';

export interface CoinjoinStatusEvent {
    rounds: Round[];
    changed: Round[];
    feeRatesMedians: FeeRateMedians[];
    coordinationFeeRate: CoordinationFeeRate;
    allowedInputAmounts: AllowedRange;
}

export interface CoinjoinClientEvents {
    status: CoinjoinStatusEvent;
    round: CoinjoinRoundEvent;
    request: CoinjoinRequestEvent[];
    exception: string;
    log: string;
    'session-phase': {
        phase: SessionPhase;
        accountKeys: string[];
    };
}
