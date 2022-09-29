import { Round, FeeRateMedians } from './coordinator';
import { Credentials } from './middleware';

export interface CoinjoinStatusEvent {
    rounds: Round[];
    changed: Round[];
    feeRatesMedians: FeeRateMedians[];
    coordinatorFeeRate: number;
}

export interface DecomposedOutputs {
    accountKey: string;
    outputSize: number;
    amounts: number[];
    amountCredentials: Credentials[];
    vsizeCredentials: Credentials[];
}
