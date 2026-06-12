import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type TokenInfoBranded, type TokenSymbol } from '@suite-common/wallet-types';

export type YieldAccountOpportunity = {
    key: string;
    account?: Account;
    networkSymbol: NetworkSymbol;
    vault: YieldDto;
    matchedInputToken: TokenInfoBranded | undefined;
    hasVaultPosition: boolean;
    hasRewardsData: boolean;
    depositedAmount: string;
    additionalDepositAmount: string;
    depositedSymbol: TokenSymbol;
    depositedContractAddress: string | null;
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
    | 'depositedSymbol'
    | 'depositedContractAddress'
>;
