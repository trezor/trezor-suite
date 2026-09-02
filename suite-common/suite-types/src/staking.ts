export enum EarnFlow {
    Stake = 'stake',
    Yield = 'yield',
    UpdateProvider = 'update-provider',
}

export type StakeModalFlow = EarnFlow.Stake | EarnFlow.UpdateProvider;

export enum EarnProvider {
    Everstake = 'everstake',
    Morpho = 'morpho',
}

export type EarnYieldContext = {
    id: string;
    /** vault (share token) contract address — how vault-scoped Earn routes address the vault */
    vaultAddress?: string;
    tokenContractAddress?: string;
};

export type EarnModalAction = 'continue' | 'cancel' | 'close';

export type EarnAnalyticsStep =
    | 'change-delegate-form-modal'
    | 'claim-form-modal'
    | 'earn-dashboard'
    | 'entry-period-stake-modal'
    | 'funds-maintained-modal'
    | 'stake-form-modal'
    | 'stake-in-a-nutshell-modal'
    | 'staking-dashboard'
    | 'yield-deposit'
    | 'yield-withdraw'
    | 'unstake-form-modal'
    | 'withdraw-form-modal';
