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
    outline: solid 3px transparent;
    border-radius: ${borders.radii.xs};
    ${props =>
        props.shouldHighlight &&
        css`
            outline: solid 3px ${({ theme }) => theme.TYPE_ORANGE};
            background: ${({ theme }) => theme.TYPE_LIGHT_ORANGE};
            padding: 10px;
        `};
`;
