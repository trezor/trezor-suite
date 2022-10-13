import { Round, FeeRateMedians } from './coordinator';

export interface CoinjoinStatusEvent {
    rounds: Round[];
    changed: Round[];
    feeRatesMedians: FeeRateMedians[];
    coordinatorFeeRate: number;
}

export type RegisterAccountParams = {
    descriptor: string;
};
