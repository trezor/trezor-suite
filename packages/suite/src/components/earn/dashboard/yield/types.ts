import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type TokenInfoBranded } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

export type YieldAccountOpportunity = {
    key: string;
    account?: Account;
    networkSymbol: NetworkSymbol;
    vault: YieldDtoV2;
    matchedInputToken: TokenInfoBranded | undefined;
    hasVaultPosition: boolean;
    hasRewardsData: boolean;
    depositedAmount: string;
    additionalDepositAmount: string;
    /** The asset amounts are denominated in; a wrapped-native vault's is the native coin. */
    depositedToken: YieldFlowDisplayToken;
    apyPercentage: number | null;
};

export type YieldInactiveVaultOpportunity = Pick<
    YieldAccountOpportunity,
    'key' | 'networkSymbol' | 'vault' | 'apyPercentage'
>;

export type YieldOpportunityData = Pick<
    YieldAccountOpportunity,
    | 'matchedInputToken'
    | 'hasVaultPosition'
    | 'hasRewardsData'
    | 'depositedAmount'
    | 'additionalDepositAmount'
    | 'depositedToken'
>;
