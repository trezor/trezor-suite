import styled, { useTheme } from 'styled-components';
import BigNumber from 'bignumber.js';
import { getFeeUnits, formatNetworkAmount, formatAmount } from '@suite-common/wallet-utils';
import { Icon, CoinLogo, variables, useTheme } from '@trezor/components';
import { formatDuration, isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { TranslationKey } from '@suite-common/intl-types';
import { Translation, FormattedCryptoAmount, AccountLabel } from 'src/components/suite';
import { Account, Network } from 'src/types/wallet';
import { PrecomposedTransactionFinal, TxFinalCardano } from 'src/types/wallet/sendForm';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';

const Wrapper = styled.div`
    padding: 20px 15px 12px;
    display: flex;
    flex-direction: column;
    border-radius: ${borders.radii.xs};
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    min-width: 190px;
    width: 225px;
    justify-content: flex-start;
    align-items: center;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 100%;
    }
`;

const SummaryHead = styled.div`
    margin: 0 0 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const IconWrapper = styled.div`
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation1};
    padding: 4px;
    border-radius: 100px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    & > svg {
        margin: 0 auto;
        display: block;
    }
`;

const NestedIconWrapper = styled(IconWrapper)`
    width: 16px;
    height: 16px;
    position: absolute;
    top: 0;
    right: 0;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 20%);
`;

const HeadlineAmount = styled.div`
    display: block;
`;

const Headline = styled.div`
    font-size: 16px;
    font-weight: 600;
    margin-top: 20px;
    word-break: break-all;
`;

const AccountWrapper = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.textSubdued};
    display: flex;
    margin-top: 5px;
    word-break: normal;
    overflow-wrap: anywhere;
    align-items: center;

    & > div {
        margin: 1px 5px 0 0;
        display: block;
    }
`;

const Separator = styled.div`
    border-top: 1px solid ${({ theme }) => theme.borderOnElevation1};
    margin: 10px 0 0;
    padding: 0 0 10px;
    width: 100%;
`;

const LeftDetails = styled.div`
    width: 100%;
    flex-direction: column;
    margin-top: 6px;
    flex: 1;
    display: flex;
    font-weight: 500;
    text-align: start;
`;

const RateInfo = styled.div`
    position: relative;
    padding: 6px 12px;
    text-align: start;
    background: ${({ theme }) => theme.backgroundAlertBlueSubtleOnElevation1};
    border-radius: 6px;
    color: ${({ theme }) => theme.textAlertBlue};

    ::before {
        content: '';
        position: absolute;
        top: -6px;
        left: 20px;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-bottom: 6px solid ${({ theme }) => theme.textAlertBlue};
    }
`;

const TxDetailsButton = styled.button<{ detailsOpen: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: ${borders.radii.xs};
    padding: ${spacingsPx.xxs} ${spacingsPx.xxs} ${spacingsPx.xxs} ${spacingsPx.xs};
    margin: 0 -${spacingsPx.xxs};
    width: calc(100% + ${spacingsPx.xs});
    border: 0;
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
    transition: background 0.15s opacity 0.15s;
    background: ${({ theme, detailsOpen }) => detailsOpen && theme.backgroundSurfaceElevation3};
    cursor: pointer;

    :hover {
        opacity: 0.8;
    }

    & > * {
        display: block;
    }
`;

const LeftDetailsRow = styled.div`
    display: flex;
    font-size: 12px;

    & + & {
        margin-top: 10px;
    }
`;

const LeftDetailsBottom = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    flex: 1;
`;

const ReviewRbfLeftDetailsLineLeft = styled.div`
    display: flex;
    align-items: center;
    margin: 0 5% 0 0;
    width: 50%;
    color: ${({ theme }) => theme.textSubdued};

    & > div:first-child {
        margin: 1px 5px 0 0;
        display: block;
    }
`;

const ReviewRbfLeftDetailsLineRight = styled.div<{ color: string; uppercase?: boolean }>`
    width: 45%;
    text-align: left;
    color: ${props => props.color};
    font-weight: 500;

    ${({ uppercase }) =>
        uppercase &&
        `
        text-transform: uppercase;
  `};
`;

interface TransactionReviewSummaryProps {
    estimateTime?: number;
    tx: PrecomposedTransactionFinal | TxFinalCardano;
    account: Account;
    network: Network;
    broadcast?: boolean;
    detailsOpen: boolean;
    onDetailsClick: () => void;
    actionText: TranslationKey;
}

export const TransactionReviewSummary = ({
    estimateTime,
    tx,
    account,
    network,
    broadcast,
    detailsOpen,
    onDetailsClick,
    actionText,
}: TransactionReviewSummaryProps) => {
    const drafts = useSelector(state => state.wallet.send.drafts);
    const { accountLabel } = useSelector(selectLabelingDataForSelectedAccount);
    const currentAccountKey = useSelector(
        state => state.wallet.selectedAccount.account?.key,
    ) as string;

    const theme = useTheme();

    const { symbol, accountType, index } = account;
    const { feePerByte } = tx;

    const spentWithoutFee = !tx.token ? new BigNumber(tx.totalSpent).minus(tx.fee).toString() : '';
    const amount = !tx.token
        ? formatNetworkAmount(spentWithoutFee, symbol)
        : formatAmount(tx.totalSpent, tx.token.decimals);

    const formFeeRate = drafts[currentAccountKey]?.feePerUnit;
    const isFeeCustom = drafts[currentAccountKey]?.selectedFee === 'custom';
    const isComposedFeeRateDifferent = isFeeCustom && formFeeRate !== feePerByte;

    return (
        <Wrapper>
            <SummaryHead>
                <IconWrapper>
                    <CoinLogo size={48} symbol={symbol} />
                    <NestedIconWrapper>
                        <Icon size={12} color={theme.iconSubdued} icon="SEND" />
                    </NestedIconWrapper>
                </IconWrapper>

                <Headline>
                    <Translation id={actionText} />
                    <HeadlineAmount>
                        <FormattedCryptoAmount
                            disableHiddenPlaceholder
                            value={amount}
                            symbol={tx.token?.symbol ?? symbol}
                        />
                    </HeadlineAmount>
                </Headline>

                <AccountWrapper>
                    <Icon size={12} color={theme.iconSubdued} icon="WALLET" />
                    <AccountLabel
                        accountLabel={accountLabel}
                        accountType={accountType}
                        symbol={symbol}
                        index={index}
                    />
                </AccountWrapper>
            </SummaryHead>

            <Separator />

            <LeftDetails>
                {estimateTime !== undefined && (
                    <LeftDetailsRow>
                        <ReviewRbfLeftDetailsLineLeft>
                            <Icon size={12} color={theme.iconSubdued} icon="CALENDAR" />
                            <Translation id="TR_DELIVERY" />
                        </ReviewRbfLeftDetailsLineLeft>

                        <ReviewRbfLeftDetailsLineRight color={theme.textSubdued}>
                            {formatDuration(estimateTime)}
                        </ReviewRbfLeftDetailsLineRight>
                    </LeftDetailsRow>
                )}
                {!!tx.feeLimit && (
                    <LeftDetailsRow>
                        <ReviewRbfLeftDetailsLineLeft>
                            <Icon size={12} color={theme.iconSubdued} icon="GAS" />
                            <Translation id="TR_GAS_LIMIT" />
                        </ReviewRbfLeftDetailsLineLeft>

                        <ReviewRbfLeftDetailsLineRight color={theme.textSubdued}>
                            {tx.feeLimit}
                        </ReviewRbfLeftDetailsLineRight>
                    </LeftDetailsRow>
                )}
                <LeftDetailsRow>
                    <ReviewRbfLeftDetailsLineLeft>
                        <Icon size={12} color={theme.iconSubdued} icon="GAS" />
                        {network.networkType === 'bitcoin' && <Translation id="TR_FEE_RATE" />}
                        {network.networkType === 'ethereum' && <Translation id="TR_GAS_PRICE" />}
                        {network.networkType === 'ripple' && <Translation id="TR_TX_FEE" />}
                        {network.networkType === 'solana' && <Translation id="TR_TX_FEE" />}
                    </ReviewRbfLeftDetailsLineLeft>

                    <ReviewRbfLeftDetailsLineRight color={theme.textSubdued}>
                        {feePerByte} {getFeeUnits(network.networkType)}
                    </ReviewRbfLeftDetailsLineRight>
                </LeftDetailsRow>

                {isComposedFeeRateDifferent && network.networkType === 'bitcoin' && (
                    <LeftDetailsRow>
                        <RateInfo>
                            <Translation id="TR_FEE_RATE_CHANGED" />
                        </RateInfo>
                    </LeftDetailsRow>
                )}

                <LeftDetailsRow>
                    <ReviewRbfLeftDetailsLineLeft>
                        <Icon size={12} color={theme.iconSubdued} icon="BROADCAST" />
                        <Translation id="BROADCAST" />
                    </ReviewRbfLeftDetailsLineLeft>

                    <ReviewRbfLeftDetailsLineRight
                        color={broadcast ? theme.textPrimaryDefault : theme.textAlertYellow}
                        uppercase
                    >
                        <Translation id={broadcast ? 'TR_ON' : 'TR_OFF'} />
                    </ReviewRbfLeftDetailsLineRight>
                </LeftDetailsRow>
                {isFeatureFlagEnabled('RBF') && network.features?.includes('rbf') && (
                    <LeftDetailsRow>
                        <ReviewRbfLeftDetailsLineLeft>
                            <Icon size={12} color={theme.textSubdued} icon="RBF" />
                            <Translation id="RBF" />
                        </ReviewRbfLeftDetailsLineLeft>

                        <ReviewRbfLeftDetailsLineRight
                            color={tx.rbf ? theme.textPrimaryDefault : theme.textAlertYellow}
                            uppercase
                        >
                            <Translation id={tx.rbf ? 'TR_ON' : 'TR_OFF'} />
                        </ReviewRbfLeftDetailsLineRight>
                    </LeftDetailsRow>
                )}
                {tx.inputs.length !== 0 && (
                    <LeftDetailsBottom>
                        <Separator />

                        <LeftDetailsRow>
                            <TxDetailsButton
                                detailsOpen={detailsOpen}
                                onClick={() => onDetailsClick()}
                            >
                                <Translation id="TR_TRANSACTION_DETAILS" />
                                <Icon
                                    size={12}
                                    color={theme.iconSubdued}
                                    icon={detailsOpen ? 'CROSS' : 'ARROW_RIGHT'}
                                />
                            </TxDetailsButton>
                        </LeftDetailsRow>
                    </LeftDetailsBottom>
                )}
            </LeftDetails>
        </Wrapper>
    );
};
