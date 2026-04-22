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
    suppliedAmount: string;
    additionalSupplyAmount: string;
    suppliedSymbol: TokenSymbol;
    suppliedContractAddress: string | null;
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
    | 'suppliedAmount'
    | 'additionalSupplyAmount'
    | 'suppliedSymbol'
    | 'suppliedContractAddress'
>;
