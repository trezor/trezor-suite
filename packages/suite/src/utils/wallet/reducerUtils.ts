import BigNumber from 'bignumber.js';
import { Transaction, Account, Token } from '@wallet-types/index';

export const getPendingAmount = (
    pending: Transaction[],
    currency: string,
    token: boolean = false,
): BigNumber =>
    pending.reduce((value: BigNumber, tx: Transaction): BigNumber => {
        if (tx.type !== 'send') return value;
        if (!token) {
            // regular transactions
            // add fees from token txs and amount from regular txs
            return new BigNumber(value).plus(tx.tokens ? tx.fee : tx.total);
        }
        if (tx.tokens) {
            // token transactions
            const allTokens = tx.tokens.filter(t => t.shortcut === currency);
            const tokensValue: BigNumber = allTokens.reduce(
                (_, t) => new BigNumber(value).plus(t.value),
                new BigNumber('0'),
            );
            return new BigNumber(value).plus(tokensValue);
        }
        // default
        return value;
    }, new BigNumber('0'));

export const getAccountTokens = (tokens: Token[], account?: Account) => {
    const a = account;
    if (!a) return [];
    return tokens.filter(
        t =>
            t.ethAddress === a.descriptor &&
            t.network === a.network &&
            t.deviceState === a.deviceState,
    );
};
