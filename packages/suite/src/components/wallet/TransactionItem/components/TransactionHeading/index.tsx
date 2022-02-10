import React, { useState } from 'react';
import styled from 'styled-components';
import { variables, Icon, useTheme } from '@trezor/components';
import { HiddenPlaceholder, Sign } from '@suite-components';
import { getTargetAmount, getTxHeaderSymbol, getTxOperation } from '@wallet-utils/transactionUtils';
import TransactionHeader from '../TransactionHeader';
import { WalletAccountTransaction } from '@wallet-types';

const Wrapper = styled.span`
    display: flex;
    flex: 1 1 auto;
    text-overflow: ellipsis;
    overflow: hidden;
    align-items: center;
    cursor: pointer;
`;

const HeadingWrapper = styled.div`
    text-overflow: ellipsis;
    overflow: hidden;
`;

const ChevronIconWrapper = styled.div<{ show: boolean; animate: boolean }>`
    display: flex;
    visibility: ${props => (props.show ? 'visible' : 'hidden')};
    margin-left: ${props => (props.animate ? '5px' : '2px')};
    opacity: ${props => (props.show ? 1 : 0)};
    transition: visibility 0s, opacity 0.15s linear, margin-left 0.2s ease-in-out;

    /* select non-direct SVG children (the icon) and set animation property */
    & > * svg {
        transition: all 0.2ms ease-in-out;
    }
`;

const CryptoAmount = styled.span`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    /* line-height: 1.5; */
    text-transform: uppercase;
    white-space: nowrap;
    flex: 0;
`;

const StyledHiddenPlaceholder = styled(props => <HiddenPlaceholder {...props} />)`
    /* padding: 8px 0px; row padding */
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

interface Props {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    useSingleRowLayout: boolean;
    txItemIsHovered: boolean;
    nestedItemIsHovered: boolean;
    onClick: () => void;
}

const TransactionHeading = ({
    transaction,
    isPending,
    useSingleRowLayout,
    txItemIsHovered,
    nestedItemIsHovered,
    onClick,
}: Props) => {
    const theme = useTheme();
    const symbol = getTxHeaderSymbol(transaction);
    const nTokens = transaction.tokens.length;
    const isTokenTransaction = transaction.tokens.length;
    const isSingleTokenTransaction = nTokens === 1;
    const target = transaction.targets[0];
    const transfer = transaction.tokens[0];
    const targetSymbol = transaction.type === 'self' ? transaction.symbol.toUpperCase() : symbol;
    let amount = null;

    const [headingIsHovered, setHeadingIsHovered] = useState(false);

    if (useSingleRowLayout) {
        // For single token transaction instead of showing coin amount we rather show the token amount
        // In case of sent-to-self transaction we rely on getTargetAmount returning transaction.amount which will be equal to a fee
        const targetAmount =
            !isSingleTokenTransaction || transaction.type === 'self'
                ? getTargetAmount(target, transaction)
                : transfer.amount;
        const operation = !isTokenTransaction
            ? getTxOperation(transaction)
            : getTxOperation(transfer);
        amount = (
            <CryptoAmount>
                {targetAmount && (
                    <StyledHiddenPlaceholder>
                        {operation && <Sign value={operation} />}
                        {targetAmount} {targetSymbol}
                    </StyledHiddenPlaceholder>
                )}
            </CryptoAmount>
        );
    }

    if (transaction.type === 'failed') {
        amount = (
            <CryptoAmount>
                <StyledHiddenPlaceholder>
                    <Sign value="neg" />
                    {transaction.fee} {transaction.symbol.toUpperCase()}
                </StyledHiddenPlaceholder>
            </CryptoAmount>
        );
    }

    return (
        <>
            <Wrapper
                onMouseEnter={() => setHeadingIsHovered(true)}
                onMouseLeave={() => setHeadingIsHovered(false)}
                onClick={onClick}
            >
                <HeadingWrapper>
                    <TransactionHeader transaction={transaction} isPending={isPending} />
                </HeadingWrapper>
                <ChevronIconWrapper
                    show={txItemIsHovered}
                    animate={nestedItemIsHovered || headingIsHovered}
                >
                    <Icon
                        size={nestedItemIsHovered || headingIsHovered ? 18 : 16}
                        color={theme.TYPE_DARK_GREY}
                        icon="ARROW_RIGHT"
                    />
                </ChevronIconWrapper>
            </Wrapper>
            {amount}
        </>
    );
};

export default TransactionHeading;
