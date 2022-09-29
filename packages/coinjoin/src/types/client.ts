export type CoinjoinRound = {
    id: string;
};

export interface CoinjoinStatusEvent {
    rounds: CoinjoinRound[];
    changed: CoinjoinRound[];
    feeRatesMedians: any[];
}

export type RegisterAccountParams = {
    descriptor: string;
};
