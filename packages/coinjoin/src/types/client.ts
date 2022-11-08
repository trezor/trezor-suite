import { AllowedRange, CoordinationFeeRate, FeeRateMedians, Round } from './coordinator';

export interface CoinjoinStatusEvent {
    rounds: Round[];
    changed: Round[];
    feeRatesMedians: FeeRateMedians[];
    coordinationFeeRate: CoordinationFeeRate;
    allowedInputAmounts: AllowedRange;
}
