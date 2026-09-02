import type { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import type { WalletAccountTransaction } from '@suite-common/wallet-types';

import { AccountTransactionBaseAnchor, type AnchorType, EarnAnchor } from './anchors';

type EarnYieldRowAnchorParams = {
    symbol: NetworkSymbol;
    accountIndex: number;
    accountType: NonNullable<AccountType>;
    vaultId: string;
};

const getTxIdFromAnchor = (anchor?: string): string => anchor?.split('/').pop() || '';

export const getTxAnchor = (txId?: string): AnchorType | undefined =>
    txId ? `${AccountTransactionBaseAnchor}/${txId}` : undefined;

/**
 * Anchor of a single (account, vault) row of the Earn yield dashboard. The account is
 * identified the way routes identify it, never by its account key — that one embeds the
 * account descriptor and the device session id, and anchors are reported to analytics.
 */
export const getEarnYieldRowAnchor = ({
    symbol,
    accountIndex,
    accountType,
    vaultId,
}: EarnYieldRowAnchorParams): AnchorType =>
    `${EarnAnchor.Yield}/${symbol}-${accountType}-${accountIndex}/${vaultId}`;

export const isEarnYieldRowAnchor = (anchor?: string): boolean =>
    anchor?.startsWith(`${EarnAnchor.Yield}/`) ?? false;

export const findAnchorTransactionPage = (
    transactions: WalletAccountTransaction[],
    transactionsPerPage: number,
    anchor?: string,
) => {
    // 1 because pagination is indexed from 1
    if (!anchor) return 1;

    const txIdFromAnchor = getTxIdFromAnchor(anchor);
    const orderOfTx = transactions.findIndex(tx => tx?.txid === txIdFromAnchor);

    if (orderOfTx === -1) return 1;

    return Math.floor(orderOfTx / transactionsPerPage) + 1;
};
