import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { Icon, Button, useTheme, variables } from '@trezor/components';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { FormattedCryptoAmount, Sign, Translation, FormattedDate } from 'src/components/suite';
import { useRbfContext } from 'src/hooks/wallet/useRbfForm';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { truncateMiddle } from '@trezor/utils';
import { GreyCard } from './GreyCard';
import { WarnHeader } from './WarnHeader';

const ChainedTxs = styled.div`
    display: flex;
    flex-direction: column;
    padding-top: 24px;
    margin-top: 24px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

const TxRow = styled.div`
    display: flex;
    align-items: center;
    padding: 4px 0;
`;

const IconWrapper = styled.div`
    margin-right: 16px;
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
    margin-left: 8px;
`;

const Amount = styled(Text)`
    display: flex;
    margin-left: auto;
`;

const Bullet = styled.div`
    margin-left: 8px;
    margin-right: 8px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

export const AffectedTransactions = ({ showChained }: { showChained: () => void }) => {
    const theme = useTheme();
    const { isMobileLayout } = useLayoutSize();
    const { network, chainedTxs } = useRbfContext();
    if (chainedTxs.length === 0) return null;
    const shownTxidChars = isMobileLayout ? 4 : 8;

    return (
        <GreyCard>
            <WarnHeader
                action={
                    <Button
                        variant="tertiary"
                        onClick={showChained}
                        icon="ARROW_RIGHT"
                        alignIcon="right"
                    >
                        <Translation id="TR_SEE_DETAILS" />
                    </Button>
                }
            >
                <Translation id="TR_AFFECTED_TXS" />
            </WarnHeader>
            <ChainedTxs>
                {chainedTxs.map(tx => {
                    const amount = formatNetworkAmount(tx.amount, tx.symbol);
                    return (
                        <TxRow key={tx.txid}>
                            {!isMobileLayout && (
                                <IconWrapper>
                                    <Icon
                                        size={16}
                                        color={theme.TYPE_LIGHT_GREY}
                                        icon={tx.type === 'recv' ? 'RECEIVE' : 'SEND'}
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

                            <Txid>
                                {truncateMiddle(tx.txid, shownTxidChars, shownTxidChars + 2)}
                            </Txid>
                            <Amount>
                                <Sign
                                    value={new BigNumber(amount)}
                                    grayscale
                                    grayscaleColor={theme.TYPE_LIGHT_GREY}
                                />
                                <FormattedCryptoAmount value={amount} symbol={network.symbol} />
                            </Amount>
                        </TxRow>
                    );
                })}
            </ChainedTxs>
        </GreyCard>
    );
};
