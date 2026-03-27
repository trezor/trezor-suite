import {
    type WalletAccountTransaction as CommonWalletAccountTransaction,
    type TokenAddress,
    type TokenSymbol,
} from '@suite-common/wallet-types';
import { type TokenTransfer as BlockchainLinkTokenTransfer } from '@trezor/blockchain-link-types';

export type TypedTokenTransfer = Omit<BlockchainLinkTokenTransfer, 'symbol' | 'contract'> & {
    symbol: TokenSymbol;
    contract: TokenAddress;
};

export type WalletAccountTransaction = Omit<CommonWalletAccountTransaction, 'tokens'> & {
    tokens: TypedTokenTransfer[];
};
