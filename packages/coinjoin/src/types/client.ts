export type CoinjoinRound = {
    id: string;
};

export type CoinjoinStatus = {
    rounds: CoinjoinRound[];
};

export interface CoinjoinStatusEvent {
    rounds: CoinjoinRound[];
    changed: CoinjoinRound[];
    feeRatesMedians: any[];
}

export type RegisterAccountParams = {
    descriptor: string;
};
