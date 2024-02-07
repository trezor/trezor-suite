import styled, { useTheme } from 'styled-components';
import { Icon, variables, CoinLogo, H3, useElevation } from '@trezor/components';
import { Translation, FormattedDateWithBullet } from 'src/components/suite';
import { WalletAccountTransaction, Network } from 'src/types/wallet';
import {
    isTxFinal,
    getTxIcon,
    isPending,
    getFeeUnits,
    getFeeRate,
} from '@suite-common/wallet-utils';
import { TransactionHeader } from 'src/components/wallet/TransactionItem/TransactionHeader';
import { fromWei } from 'web3-utils';
import { IOAddress } from './IOAddress';
import {
    Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
    typography,
} from '@trezor/theme';

const Wrapper = styled.div<{ elevation: Elevation }>`
    background: ${mapElevationToBackground};
    padding: ${spacingsPx.lg};
    border-radius: ${borders.radii.xs};
`;

const Confirmations = styled.div`
    display: flex;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
`;

const StatusWrapper = styled.div`
    display: flex;
    height: ${spacingsPx.lg};
    align-items: center;
`;

const HeaderFirstRow = styled.div<{ elevation: Elevation }>`
    display: grid;
    grid-gap: ${spacingsPx.sm};
    grid-template-columns: minmax(55px, 70px) auto auto;
    align-items: center;
    padding-bottom: ${spacingsPx.xl};
    padding-right: ${spacingsPx.xs};
    border-bottom: 1px solid ${mapElevationToBorder};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};

    ${variables.SCREEN_QUERY.MOBILE} {
        grid-template-columns: 55px 1fr fit-content(15px);
    }
`;

const Grid = styled.div<{ showRbfCols?: boolean }>`
    display: grid;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    grid-gap: ${spacingsPx.sm};
    grid-template-columns: 105px minmax(0, 2.5fr) 90px minmax(0, 2.5fr); /* title value title value */
    ${typography.hint}
    padding: ${spacingsPx.xxl} ${spacingsPx.xs} ${spacingsPx.sm};
    text-align: left;
    align-items: center;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        grid-template-columns: 110px minmax(0, 1fr);
    }
`;

const Title = styled.div`
    display: inline-flex;
    text-align: left;
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
    align-items: center;
`;

const Value = styled.div`
    display: inline-flex;
    color: ${({ theme }) => theme.textDefault};
    ${typography.label}
    overflow: hidden;
    text-overflow: ellipsis;
    font-variant-numeric: tabular-nums;
`;

const TxidValue = styled.div`
    color: ${({ theme }) => theme.textDefault};
    ${typography.label}
`;

const IconWrapper = styled.div<{ elevation: Elevation }>`
    background-color: ${mapElevationToBorder};
    border-radius: ${borders.radii.full};
    display: flex;
    align-items: center;
    justify-content: center;

    > svg {
        margin: 0 auto;
        display: block;
    }
`;

const MainIconWrapper = styled(IconWrapper)`
    width: 54px;
    height: 54px;
    position: relative;
`;

const NestedIconWrapper = styled(IconWrapper)`
    width: 18px;
    height: 18px;
    position: absolute;
    top: 0;
    right: 0;
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
`;

const TxStatus = styled.div`
    text-align: left;
    overflow: hidden;
`;

const ConfirmationStatusWrapper = styled.div`
    align-items: center;
    display: inline-grid;
    justify-content: flex-end;
`;

const TxSentStatus = styled(H3)`
    overflow: hidden;
    text-overflow: ellipsis;
    color: ${({ theme }) => theme.textDefault};
`;

const ConfirmationStatus = styled.div<{ confirmed: boolean; tiny?: boolean }>`
    color: ${({ confirmed, theme }) =>
        confirmed ? theme.textPrimaryDefault : theme.textAlertYellow};
    ${({ tiny }) => (tiny ? typography.label : typography.callout)}
`;

const Circle = styled.div`
    margin-left: ${spacingsPx.xxs};
    margin-right: ${spacingsPx.xxs};
    color: ${({ theme }) => theme.textSubdued};
`;

const Timestamp = styled.span`
    white-space: nowrap;
`;

const StyledIcon = styled(Icon)`
    margin-right: ${spacingsPx.xs};
`;

const IconPlaceholder = styled.span`
    min-width: 10px;
    margin-right: ${spacingsPx.xs};
`;

interface BasicTxDetailsProps {
    tx: WalletAccountTransaction;
    network: Network;
    confirmations: number;
    explorerUrl: string;
    explorerUrlQueryString: string;
}

export const BasicTxDetails = ({
    tx,
    confirmations,
    network,
    explorerUrl,
    explorerUrlQueryString,
}: BasicTxDetailsProps) => {
    const theme = useTheme();
    // all solana txs which are fetched are already confirmed
    const isConfirmed = confirmations > 0 || tx.solanaSpecific?.status === 'confirmed';
    const isFinal = isTxFinal(tx, confirmations);

    const { elevation } = useElevation();
    return (
        <Wrapper elevation={elevation}>
            <HeaderFirstRow elevation={elevation}>
                <MainIconWrapper elevation={elevation}>
                    <CoinLogo symbol={tx.symbol} size={48} />

                    <NestedIconWrapper elevation={elevation}>
                        <Icon
                            size={14}
                            color={tx.type === 'failed' ? theme.iconAlertRed : theme.iconDefault}
                            icon={getTxIcon(tx.type)}
                        />
                    </NestedIconWrapper>
                </MainIconWrapper>

                <TxStatus>
                    <TxSentStatus>
                        <TransactionHeader transaction={tx} isPending={isPending(tx)} />
                    </TxSentStatus>
                </TxStatus>

                <ConfirmationStatusWrapper>
                    {isConfirmed ? (
                        <StatusWrapper>
                            <ConfirmationStatus confirmed>
                                <Translation id="TR_CONFIRMED_TX" />
                            </ConfirmationStatus>

                            {confirmations > 0 && (
                                <>
                                    <Circle>&bull;</Circle>
                                    <Confirmations>
                                        <Translation
                                            id="TR_TX_CONFIRMATIONS"
                                            values={{ confirmationsCount: confirmations }}
                                        />
                                    </Confirmations>
                                </>
                            )}
                        </StatusWrapper>
                    ) : (
                        <ConfirmationStatus confirmed={false}>
                            <Translation id="TR_UNCONFIRMED_TX" />
                        </ConfirmationStatus>
                    )}
                </ConfirmationStatusWrapper>
            </HeaderFirstRow>

            <Grid>
                {/* MINED TIME */}
                <Title>
                    <StyledIcon icon="CALENDAR" size={10} />
                    {isConfirmed ? (
                        <Translation id="TR_MINED_TIME" />
                    ) : (
                        <Translation id="TR_FIRST_SEEN" />
                    )}
                </Title>

                <Value>
                    {tx.blockTime ? (
                        <Timestamp>
                            <FormattedDateWithBullet
                                value={new Date(tx.blockTime * 1000)}
                                timeLightColor
                            />
                        </Timestamp>
                    ) : (
                        <Translation id="TR_UNKNOWN_CONFIRMATION_TIME" />
                    )}
                </Value>

                {/* TX ID */}
                <Title>
                    <StyledIcon icon="FINGERPRINT" size={10} />
                    <Translation id="TR_TXID" />
                </Title>

                <TxidValue>
                    <IOAddress
                        txAddress={tx.txid}
                        explorerUrl={explorerUrl}
                        explorerUrlQueryString={explorerUrlQueryString}
                    />
                </TxidValue>

                {network.networkType === 'bitcoin' && (
                    <>
                        {/* Fee level */}
                        <Title>
                            <StyledIcon icon="GAS" size={10} />
                            <Translation id="TR_FEE_RATE" />
                        </Title>

                        <Value>
                            {/* tx.feeRate was added in @trezor/blockchain-link 2.1.5 meaning that users
                            might have locally saved old transactions without this field. since we
                            cant reliably migrate this data, we are keeping old way of displaying feeRate in place */}
                            {`${tx?.feeRate ? tx.feeRate : getFeeRate(tx)} ${getFeeUnits(
                                'bitcoin',
                            )}`}
                        </Value>

                        {/* RBF Status */}
                        <Title>
                            <Translation id="TR_RBF_STATUS" />
                        </Title>

                        <Value>
                            <ConfirmationStatus confirmed={isFinal} tiny>
                                <Translation
                                    id={isFinal ? 'TR_RBF_STATUS_FINAL' : 'TR_RBF_STATUS_NOT_FINAL'}
                                />
                            </ConfirmationStatus>
                        </Value>
                    </>
                )}

                {/* Ethereum */}
                {tx.ethereumSpecific && (
                    <>
                        <Title>
                            <StyledIcon icon="GAS" size={10} />
                            <Translation id="TR_GAS_LIMIT" />
                        </Title>
                        <Value>{tx.ethereumSpecific.gasLimit}</Value>

                        <Title>
                            <StyledIcon icon="GAS" size={10} />
                            <Translation id="TR_GAS_USED" />
                        </Title>
                        <Value>
                            {tx.ethereumSpecific.gasUsed ? (
                                tx.ethereumSpecific.gasUsed
                            ) : (
                                <Translation id="TR_BUY_STATUS_PENDING" />
                            )}
                        </Value>

                        <Title>
                            <StyledIcon icon="GAS" size={10} />
                            <Translation id="TR_GAS_PRICE" />
                        </Title>
                        <Value>{`${fromWei(tx.ethereumSpecific.gasPrice, 'gwei')} ${getFeeUnits(
                            'ethereum',
                        )}`}</Value>

                        <Title>
                            <IconPlaceholder>#</IconPlaceholder>
                            <Translation id="TR_NONCE" />
                        </Title>
                        <Value>{tx.ethereumSpecific.nonce}</Value>
                    </>
                )}
            </Grid>
        </Wrapper>
    );
};
