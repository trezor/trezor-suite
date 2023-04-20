import { TokenTransfer } from '@trezor/blockchain-link';
import {
    TokenAddress,
    TokenSymbol,
    WalletAccountTransaction as CommonWalletAccountTransaction,
} from '@suite-common/wallet-types';

// TODO: merge this type with @suite-common/wallet-types and use only one of them
export type EthereumTokenSymbol = TokenSymbol;

export type EthereumTokenTransfer = Omit<TokenTransfer, 'symbol' | 'contract'> & {
    symbol: EthereumTokenSymbol;
    contract: TokenAddress;
};

export type WalletAccountTransaction = Omit<CommonWalletAccountTransaction, 'tokens'> & {
    tokens: EthereumTokenTransfer[];
};
