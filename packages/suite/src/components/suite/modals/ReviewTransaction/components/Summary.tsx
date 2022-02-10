import React from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { getFeeUnits } from '@wallet-utils/sendFormUtils';
import { Icon, useTheme, CoinLogo, variables } from '@trezor/components';
import { Translation, FormattedCryptoAmount } from '@suite-components';
import { getTitleForNetwork, formatNetworkAmount, formatAmount } from '@wallet-utils/accountUtils';
import { Account, Network } from '@wallet-types';
import { formatDuration } from '@suite-utils/date';
import { PrecomposedTransactionFinal, TxFinalCardano } from '@wallet-types/sendForm';
import { isEnabled } from '@suite-utils/features';

const Wrapper = styled.div`
    padding: 20px 15px 12px;
    display: flex;
    flex-direction: column;
    border-radius: 7px;
    background: ${props => props.theme.BG_GREY};
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
    background-color: ${props => props.theme.BG_WHITE};
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
    top: 0px;
    right: 0px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    display: flex;
    margin-top: 5px;
    word-break: normal;
    overflow-wrap: anywhere;
    & > div {
        margin: 1px 5px 0 0;
        display: block;
    }
`;

const Separator = styled.div`
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
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
`;

const TxDetailsButton = styled.button`
    width: 100%;
    padding: 0;
    border: 0;
    background: 0;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    cursor: pointer;
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
    margin: 0 5% 0 0;
    width: 50%;
    color: ${props => props.theme.TYPE_LIGHT_GREY};

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

interface Props {
    estimateTime?: number;
    tx: PrecomposedTransactionFinal | TxFinalCardano;
    account: Account;
    network: Network;
    broadcast?: boolean;
    detailsOpen: boolean;
    isRbfAction?: boolean;
    onDetailsClick: () => void;
}

const Summary = ({
    estimateTime,
    tx,
    account,
    network,
    broadcast,
    detailsOpen,
    isRbfAction,
    onDetailsClick,
}: Props) => {
    const theme = useTheme();
    const { symbol } = account;

    const feePerByte = new BigNumber(tx.feePerByte).decimalPlaces(3).toString();
    const spentWithoutFee = !tx.token ? new BigNumber(tx.totalSpent).minus(tx.fee).toString() : '';
    const amount = !tx.token
        ? formatNetworkAmount(spentWithoutFee, symbol)
        : formatAmount(tx.totalSpent, tx.token.decimals);

    const accountLabel = account.metadata.accountLabel ? (
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {account.metadata.accountLabel}
        </span>
    ) : (
        <>
            <Translation id={getTitleForNetwork(account.symbol)} />
            <span>&nbsp;#{account.index + 1}</span>
        </>
    );

    return (
        <Wrapper>
            <SummaryHead>
                <IconWrapper>
                    <CoinLogo size={48} symbol={account.symbol} />
                    <NestedIconWrapper>
                        <Icon size={12} color={theme.TYPE_DARK_GREY} icon="SEND" />
                    </NestedIconWrapper>
                </IconWrapper>
                <Headline>
                    <Translation id={isRbfAction ? 'TR_REPLACE_TX' : 'SEND_TRANSACTION'} />
                    <HeadlineAmount>
                        <FormattedCryptoAmount
                            disableHiddenPlaceholder
                            value={amount}
                            symbol={tx.token?.symbol ?? symbol}
                        />
                    </HeadlineAmount>
                </Headline>
                <AccountWrapper>
                    <Icon size={12} color={theme.TYPE_DARK_GREY} icon="WALLET" />
                    {accountLabel}
                </AccountWrapper>
            </SummaryHead>
            <Separator />
            <LeftDetails>
                {estimateTime !== undefined && (
                    <LeftDetailsRow>
                        <ReviewRbfLeftDetailsLineLeft>
                            <Icon size={12} color={theme.TYPE_LIGHT_GREY} icon="CALENDAR" />
                            <Translation id="TR_DELIVERY" />
                        </ReviewRbfLeftDetailsLineLeft>
                        <ReviewRbfLeftDetailsLineRight color={theme.TYPE_DARK_GREY}>
                            {formatDuration(estimateTime)}
                        </ReviewRbfLeftDetailsLineRight>
                    </LeftDetailsRow>
                )}
                {!!tx.feeLimit && (
                    <LeftDetailsRow>
                        <ReviewRbfLeftDetailsLineLeft>
                            <Icon size={12} color={theme.TYPE_LIGHT_GREY} icon="GAS" />
                            <Translation id="TR_GAS_LIMIT" />
                        </ReviewRbfLeftDetailsLineLeft>
                        <ReviewRbfLeftDetailsLineRight color={theme.TYPE_DARK_GREY}>
                            {tx.feeLimit}
                        </ReviewRbfLeftDetailsLineRight>
                    </LeftDetailsRow>
                )}
                <LeftDetailsRow>
                    <ReviewRbfLeftDetailsLineLeft>
                        <Icon size={12} color={theme.TYPE_LIGHT_GREY} icon="GAS" />
                        {network.networkType === 'bitcoin' && <Translation id="TR_FEE_RATE" />}
                        {network.networkType === 'ethereum' && <Translation id="TR_GAS_PRICE" />}
                        {network.networkType === 'ripple' && <Translation id="TR_TX_FEE" />}
                    </ReviewRbfLeftDetailsLineLeft>
                    <ReviewRbfLeftDetailsLineRight color={theme.TYPE_DARK_GREY}>
                        {feePerByte} {getFeeUnits(network.networkType)}
                    </ReviewRbfLeftDetailsLineRight>
                </LeftDetailsRow>
                <LeftDetailsRow>
                    <ReviewRbfLeftDetailsLineLeft>
                        <Icon size={12} color={theme.TYPE_LIGHT_GREY} icon="BROADCAST" />
                        <Translation id="BROADCAST" />
                    </ReviewRbfLeftDetailsLineLeft>
                    <ReviewRbfLeftDetailsLineRight
                        color={broadcast ? theme.TYPE_GREEN : theme.TYPE_ORANGE}
                        uppercase
                    >
                        <Translation id={broadcast ? 'TR_ON' : 'TR_OFF'} />
                    </ReviewRbfLeftDetailsLineRight>
                </LeftDetailsRow>
                {isEnabled('RBF') && network.features?.includes('rbf') && (
                    <LeftDetailsRow>
                        <ReviewRbfLeftDetailsLineLeft>
                            <Icon size={12} color={theme.TYPE_LIGHT_GREY} icon="RBF" />
                            <Translation id="RBF" />
                        </ReviewRbfLeftDetailsLineLeft>
                        <ReviewRbfLeftDetailsLineRight
                            color={tx.rbf ? theme.TYPE_GREEN : theme.TYPE_ORANGE}
                            uppercase
                        >
                            <Translation id={tx.rbf ? 'TR_ON' : 'TR_OFF'} />
                        </ReviewRbfLeftDetailsLineRight>
                    </LeftDetailsRow>
                )}
                {tx.transaction.inputs.length !== 0 && (
                    <LeftDetailsBottom>
                        <Separator />
                        <LeftDetailsRow>
                            <TxDetailsButton onClick={() => onDetailsClick()}>
                                <Translation id="TR_TRANSACTION_DETAILS" />
                                <Icon
                                    size={16}
                                    color={theme.TYPE_LIGHT_GREY}
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

export default Summary;
