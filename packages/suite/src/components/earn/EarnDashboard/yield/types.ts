import { YieldDto } from '@suite-common/earn-api';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account, TokenInfoBranded, TokenSymbol } from '@suite-common/wallet-types';

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
