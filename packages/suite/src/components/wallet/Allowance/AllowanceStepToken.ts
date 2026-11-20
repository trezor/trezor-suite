import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';

export type AllowanceStepToken = {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
};
