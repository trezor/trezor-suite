import type { AccountInfo } from '@trezor/blockchain-link-types';

export type EthereumTokenBalance = {
    contract: string;
    symbol?: string;
    name?: string;
    decimals: number;
    balance: string;
};

/** What the backend says about one address at one moment. Untrusted until acted upon. */
export type EthereumAddressInfo = {
    /** In wei. */
    balance: string;
    /** Next nonce as the backend reports it. Undefined when the backend reports none. */
    nonce?: string;
    transactions: number;
    unconfirmedTransactions: number;
    /** ERC-20 balances the backend lists. They are not moved, only reported. */
    tokens: EthereumTokenBalance[];
    /** No transaction, nothing pending and no balance: the address was never used. */
    isEmpty: boolean;
};

const isNonZeroBalance = (balance: string | undefined) => balance !== undefined && balance !== '0';

export const toEthereumAddressInfo = (info: AccountInfo): EthereumAddressInfo => ({
    balance: info.balance,
    nonce: info.misc?.nonce,
    transactions: info.history.total,
    unconfirmedTransactions: info.history.unconfirmed,
    tokens: (info.tokens ?? []).flatMap(
        ({ standard, contract, symbol, name, decimals, balance }) =>
            standard === 'ERC20' && isNonZeroBalance(balance)
                ? [{ contract, symbol, name, decimals, balance: balance ?? '0' }]
                : [],
    ),
    isEmpty:
        info.empty &&
        info.history.total === 0 &&
        info.history.unconfirmed === 0 &&
        !isNonZeroBalance(info.balance),
});
