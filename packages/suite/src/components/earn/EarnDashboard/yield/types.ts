import { type YieldDto } from '@suite-common/earn-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type TokenInfoBranded, type TokenSymbol } from '@suite-common/wallet-types';

export type YieldAccountOpportunity = {
    key: string;
    account?: Account;
    networkSymbol: NetworkSymbol;
    vault: YieldDto;
    matchedToken: TokenInfoBranded | undefined;
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
