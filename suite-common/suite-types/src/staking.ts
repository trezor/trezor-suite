export enum EarnFlow {
    Stake = 'stake',
    Yield = 'yield',
    UpdateProvider = 'update-provider',
}

export type StakeModalFlow = EarnFlow.Stake | EarnFlow.UpdateProvider;

export enum EarnProvider {
    Everstake = 'everstake',
    YieldXyz = 'yield-xyz',
}

export type EarnAnalyticsStep =
    | 'staking-dashboard'
    | 'stake-in-a-nutshell-modal'
    | 'funds-maintained-modal'
    | 'stake-form-modal'
    | 'entry-period-stake-modal'
    | 'earn-dashboard';
