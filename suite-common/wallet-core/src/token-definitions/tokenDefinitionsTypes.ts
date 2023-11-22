import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenDefinitions } from '@suite-common/wallet-types';

export type TokenDefinitionsState = {
    [key in NetworkSymbol]?: TokenDefinitions;
};

export type TokenDefinitionsRootState = { wallet: { tokenDefinitions: TokenDefinitionsState } };
