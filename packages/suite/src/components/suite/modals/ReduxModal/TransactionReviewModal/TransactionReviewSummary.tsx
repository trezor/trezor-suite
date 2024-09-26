import styled, { useTheme } from 'styled-components';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { getFeeUnits, formatNetworkAmount, formatAmount, getFee } from '@suite-common/wallet-utils';
import { Icon, variables } from '@trezor/components';
import { formatDuration } from '@suite-common/suite-utils';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { TranslationKey } from '@suite-common/intl-types';
import { Translation, FormattedCryptoAmount, AccountLabel } from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { Network } from '@suite-common/wallet-config';
import { GeneralPrecomposedTransactionFinal, StakeType } from '@suite-common/wallet-types';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { NetworkType } from '@suite-common/wallet-config';
import { CoinLogo } from '@trezor/product-components';

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
    border-top: 1px solid ${({ theme }) => theme.borderElevation2};
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

    &::before {
        content: '';
        position: absolute;
        top: -6px;
        left: 20px;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-bottom: 6px solid ${({ theme }) => theme.textAlertBlue};
    }
`;

const TxDetailsButton = styled.button<{ $detailsOpen: boolean }>`
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
    transition:
        background 0.15s,
        opacity 0.15s;
    background: ${({ theme, $detailsOpen }) => $detailsOpen && theme.backgroundSurfaceElevation3};
    cursor: pointer;

    &:hover {
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

const ReviewLeftDetailsLineLeft = styled.div`
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

const ReviewLeftDetailsLineRight = styled.div<{ $color: string; $uppercase?: boolean }>`
    width: 45%;
    text-align: left;
    color: ${props => props.$color};
    font-weight: 500;

    ${({ $uppercase }) =>
        $uppercase &&
        `
        text-transform: uppercase;
  `};
`;

const feeLabelTranslationIdByNetworkTypeMap: { [key in NetworkType]: TranslationKey } = {
    bitcoin: 'TR_FEE_RATE',
    ethereum: 'TR_GAS_PRICE',
    ripple: 'TR_TX_FEE',
    solana: 'TR_TX_FEE',
    cardano: 'TR_TX_FEE',
};

interface TransactionReviewSummaryProps {
    estimateTime?: number;
    tx: GeneralPrecomposedTransactionFinal;
    account: Account;
    network: Network;
    broadcast?: boolean;
    detailsOpen: boolean;
    onDetailsClick: () => void;
    ethereumStakeType?: StakeType | null;
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
    ethereumStakeType,
    actionText,
}: TransactionReviewSummaryProps) => {
    const drafts = useSelector(state => state.wallet.send.drafts);
    const { accountLabel } = useSelector(selectLabelingDataForSelectedAccount);
    const currentAccountKey = useSelector(
        state => state.wallet.selectedAccount.account?.key,
    ) as string;

    const theme = useTheme();

    const { symbol, accountType, index } = account;
    const fee = getFee(network.networkType, tx);

    const spentWithoutFee = !tx.token ? new BigNumber(tx.totalSpent).minus(tx.fee).toString() : '';
    const amount = !tx.token
        ? formatNetworkAmount(spentWithoutFee, symbol)
        : formatAmount(tx.totalSpent, tx.token.decimals);

    const formFeeRate = drafts[currentAccountKey]?.feePerUnit;
    const isFeeCustom = drafts[currentAccountKey]?.selectedFee === 'custom';
    const isComposedFeeRateDifferent = isFeeCustom && formFeeRate !== fee;

    return (
        <Wrapper>
            <SummaryHead>
                <IconWrapper>
                    <CoinLogo size={48} symbol={symbol} />
                    <NestedIconWrapper>
                        <Icon size={12} color={theme.iconSubdued} name="send" />
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
                    <Icon size={12} color={theme.iconSubdued} name="standardWallet" />
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
                        <ReviewLeftDetailsLineLeft>
                            <Icon size={12} color={theme.iconSubdued} name="calendar" />
                            <Translation id="TR_DELIVERY" />
                        </ReviewLeftDetailsLineLeft>

                        <ReviewLeftDetailsLineRight $color={theme.textSubdued}>
                            {formatDuration(estimateTime)}
                        </ReviewLeftDetailsLineRight>
                    </LeftDetailsRow>
                )}
                {!!tx.feeLimit && network.networkType !== 'solana' && (
                    <LeftDetailsRow>
                        <ReviewLeftDetailsLineLeft>
                            <Icon size={12} color={theme.iconSubdued} name="gas" />
                            <Translation id="TR_GAS_LIMIT" />
                        </ReviewLeftDetailsLineLeft>

                        <ReviewLeftDetailsLineRight $color={theme.textSubdued}>
                            {tx.feeLimit}
                        </ReviewLeftDetailsLineRight>
                    </LeftDetailsRow>
                )}
                <LeftDetailsRow>
                    <ReviewLeftDetailsLineLeft>
                        <Icon size={12} color={theme.iconSubdued} name="gas" />
                        <Translation
                            id={feeLabelTranslationIdByNetworkTypeMap[network.networkType]}
                        />
                    </ReviewLeftDetailsLineLeft>
                    <ReviewLeftDetailsLineRight $color={theme.textSubdued}>
                        {fee} {getFeeUnits(network.networkType)}
                    </ReviewLeftDetailsLineRight>
                </LeftDetailsRow>

                {isComposedFeeRateDifferent && network.networkType === 'bitcoin' && (
                    <LeftDetailsRow>
                        <RateInfo>
                            <Translation id="TR_FEE_RATE_CHANGED" />
                        </RateInfo>
                    </LeftDetailsRow>
                )}

                {!ethereumStakeType && (
                    <LeftDetailsRow>
                        <ReviewLeftDetailsLineLeft>
                            <Icon size={12} color={theme.iconSubdued} name="broadcast" />
                            <Translation id="BROADCAST" />
                        </ReviewLeftDetailsLineLeft>

                        <ReviewLeftDetailsLineRight
                            $color={broadcast ? theme.textPrimaryDefault : theme.textAlertYellow}
                            $uppercase
                        >
                            <Translation id={broadcast ? 'TR_ON' : 'TR_OFF'} />
                        </ReviewLeftDetailsLineRight>
                    </LeftDetailsRow>
                )}

                {tx.inputs.length !== 0 && (
                    <LeftDetailsBottom>
                        <Separator />

                        <LeftDetailsRow>
                            <TxDetailsButton
                                $detailsOpen={detailsOpen}
                                onClick={() => onDetailsClick()}
                            >
                                <Translation id="TR_TRANSACTION_DETAILS" />
                                <Icon
                                    size={12}
                                    color={theme.iconSubdued}
                                    name={detailsOpen ? 'x' : 'caretRight'}
                                />
                            </TxDetailsButton>
                        </LeftDetailsRow>
                    </LeftDetailsBottom>
                )}
            </LeftDetails>
        </Wrapper>
    );
};
