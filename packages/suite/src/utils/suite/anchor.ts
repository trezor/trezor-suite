import { css } from 'styled-components';

import { AccountTransactionBaseAnchor, AnchorType } from 'src/constants/suite/anchors';

import type { WalletAccountTransaction } from 'src/types/wallet';
import { borders } from '@trezor/theme';

export const getTxIdFromAnchor = (anchor?: string): string => anchor?.split('/').pop() || '';

export const getTxAnchor = (txId?: string): AnchorType | undefined =>
    txId ? `${AccountTransactionBaseAnchor}/${txId}` : undefined;

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

export const anchorOutlineStyles = css<{ shouldHighlight?: boolean }>`
    transition: all 0.3s;
    transition-delay: 0.3s;
    outline: solid ${borders.widths.large} transparent;

    ${({ shouldHighlight }) =>
        shouldHighlight &&
        css`
            outline: solid ${borders.widths.large} ${({ theme }) => theme.backgroundAlertYellowBold};
            background: ${({ theme }) => theme.backgroundAlertYellowSubtleOnElevation1};
        `};
`;
