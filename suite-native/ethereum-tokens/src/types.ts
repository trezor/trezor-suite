import { TokenInfo, TokenTransfer } from '@trezor/blockchain-link';
import {
    TokenSymbol,
    WalletAccountTransaction as CommonWalletAccountTransaction,
} from '@suite-common/wallet-types';

// TODO: merge this type with @suite-common/wallet-types and use only one of them
export type EthereumTokenSymbol = TokenSymbol;

export type EthereumTokenAccountWithBalance = Omit<TokenInfo, 'balance'> & {
    balance: string;
    symbol: EthereumTokenSymbol;
};

export type EthereumTokenTransfer = Omit<TokenTransfer, 'symbol'> & {
    symbol: EthereumTokenSymbol;
};

export type WalletAccountTransaction = Omit<CommonWalletAccountTransaction, 'tokens'> & {
    tokens: EthereumTokenTransfer[];
};
