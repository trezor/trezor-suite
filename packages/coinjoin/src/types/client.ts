import { AllowedRange, Round, FeeRateMedians } from './coordinator';

export interface CoinjoinStatusEvent {
    rounds: Round[];
    changed: Round[];
    feeRatesMedians: FeeRateMedians[];
    coordinatorFeeRate: number;
    allowedInputAmounts: AllowedRange;
}
