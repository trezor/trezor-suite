import {
    WalletAccountTransaction as CommonWalletAccountTransaction,
    TokenAddress,
    TokenSymbol,
} from '@suite-common/wallet-types';
import { TokenTransfer as BlockchainLinkTokenTransfer } from '@trezor/blockchain-link';

export type TypedTokenTransfer = Omit<BlockchainLinkTokenTransfer, 'symbol' | 'contract'> & {
    symbol: TokenSymbol;
    contract: TokenAddress;
};

export type WalletAccountTransaction = Omit<CommonWalletAccountTransaction, 'tokens'> & {
    tokens: TypedTokenTransfer[];
};
