import { TokenTransfer as BlockchainLinkTokenTransfer } from '@trezor/blockchain-link';
import {
    TokenAddress,
    TokenSymbol,
    WalletAccountTransaction as CommonWalletAccountTransaction,
} from '@suite-common/wallet-types';

export type TypedTokenTransfer = Omit<BlockchainLinkTokenTransfer, 'symbol' | 'contract'> & {
    symbol: TokenSymbol;
    contract: TokenAddress;
};

export type WalletAccountTransaction = Omit<CommonWalletAccountTransaction, 'tokens'> & {
    tokens: TypedTokenTransfer[];
};
