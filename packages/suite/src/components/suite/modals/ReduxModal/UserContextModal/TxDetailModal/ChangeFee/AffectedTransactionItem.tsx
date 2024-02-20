import styled, { useTheme } from 'styled-components';
import { Icon, variables } from '@trezor/components';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { FormattedDate } from 'src/components/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { truncateMiddle } from '@trezor/utils';

const TxRow = styled.div`
    display: flex;
    align-items: center;
    padding: 4px 0;
`;

const IconWrapper = styled.div`
    padding-right: 24px;
`;

const Text = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-variant-numeric: tabular-nums;
`;

const Txid = styled(Text)`
    text-overflow: ellipsis;
    overflow: hidden;
    flex: 1;
    font-variant-numeric: slashed-zero tabular-nums;
`;

const Timestamp = styled(Text)`
    white-space: nowrap;
    margin-left: 4px;
`;

const Bullet = styled.div`
    margin-left: 8px;
    margin-right: 8px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

export const AffectedTransactionItem = ({
    tx,
    isAccountOwned,
    className,
}: {
    tx: WalletAccountTransaction;
    isAccountOwned?: boolean;
    className?: string;
}) => {
    const theme = useTheme();
    const { isMobileLayout } = useLayoutSize();
    const shownTxidChars = isMobileLayout ? 4 : 8;
    const iconType = tx.type === 'recv' ? 'RECEIVE' : 'SEND';

    return (
        <TxRow className={className}>
            {!isMobileLayout && (
                <IconWrapper>
                    <Icon
                        size={16}
                        color={theme.TYPE_LIGHT_GREY}
                        icon={isAccountOwned ? iconType : 'CLOCK'}
                    />
                </IconWrapper>
            )}

            {tx.blockTime && (
                <>
                    <Timestamp>
                        <FormattedDate value={new Date(tx.blockTime * 1000)} time />
                    </Timestamp>
                    <Bullet>&bull;</Bullet>
                </>
            )}

            <Txid>{truncateMiddle(tx.txid, shownTxidChars, shownTxidChars + 2)}</Txid>
        </TxRow>
    );
};
