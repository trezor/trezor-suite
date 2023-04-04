import { TokenInfo, TokenTransfer } from '@trezor/blockchain-link';
import { WalletAccountTransaction as CommonWalletAccountTransaction } from '@suite-common/wallet-types';

export type EthereumTokenSymbol = string & { __type: 'EthereumTokenSymbol' };

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
