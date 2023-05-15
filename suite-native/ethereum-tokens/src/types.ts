import { TokenTransfer } from '@trezor/blockchain-link';
import {
    TokenAddress,
    TokenSymbol,
    WalletAccountTransaction as CommonWalletAccountTransaction,
} from '@suite-common/wallet-types';

export type EthereumTokenTransfer = Omit<TokenTransfer, 'symbol' | 'contract'> & {
    symbol: TokenSymbol;
    contract: TokenAddress;
};

export type WalletAccountTransaction = Omit<CommonWalletAccountTransaction, 'tokens'> & {
    tokens: EthereumTokenTransfer[];
};
