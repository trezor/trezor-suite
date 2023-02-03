import { SessionPhase } from '../enums';
import { AllowedRange, CoordinationFeeRate, Round } from './coordinator';
import { CoinjoinRequestEvent, CoinjoinRoundEvent } from './round';

export interface CoinjoinStatusEvent {
    rounds: Round[];
    changed: Round[];
    maxMiningFee: number;
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
