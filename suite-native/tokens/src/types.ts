import {
    type WalletAccountTransaction as CommonWalletAccountTransaction,
    type TokenAddress,
    type TokenSymbol,
} from '@suite-common/wallet-types';
import { type TokenTransfer as BlockchainLinkTokenTransfer } from '@trezor/blockchain-link';

// `symbol` stays optional as blockchain-link declares it: a contract need not implement
// `symbol()`, and a transfer that arrives without one must not be read as if it had.
export type TypedTokenTransfer = Omit<BlockchainLinkTokenTransfer, 'symbol' | 'contract'> & {
    symbol?: TokenSymbol;
    contract: TokenAddress;
};

export type WalletAccountTransaction = Omit<CommonWalletAccountTransaction, 'tokens'> & {
    tokens: TypedTokenTransfer[];
};
