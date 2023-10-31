import { useState } from 'react';
import styled from 'styled-components';
import { variables, Icon, useTheme } from '@trezor/components';
import { HELP_CENTER_ZERO_VALUE_ATTACKS } from '@trezor/urls';
import { getIsZeroValuePhishing } from '@suite-common/suite-utils';
import {
    FormattedCryptoAmount,
    TooltipSymbol,
    Translation,
    TrezorLink,
} from 'src/components/suite';
import {
    formatAmount,
    formatNetworkAmount,
    getTargetAmount,
    getTxHeaderSymbol,
    getTxOperation,
} from '@suite-common/wallet-utils';
import { TransactionHeader } from './TransactionHeader';
import { WalletAccountTransaction } from 'src/types/wallet';
import BigNumber from 'bignumber.js';

const Wrapper = styled.span`
    display: flex;
    flex: 1 1 auto;
    text-overflow: ellipsis;
    overflow: hidden;
    align-items: center;
    cursor: pointer;
`;

const HeadingWrapper = styled.div`
    display: flex;
    align-items: center;
    text-overflow: ellipsis;
    overflow: hidden;
`;

const ChevronIconWrapper = styled.div<{ show: boolean; animate: boolean }>`
    display: flex;
    margin-left: ${({ animate }) => (animate ? '5px' : '3px')};
    padding-bottom: 2px;
    opacity: ${({ show }) => (show ? 1 : 0)};
    transition: visibility 0s, opacity 0.15s linear, margin-left 0.15s ease-in-out;

    /* select non-direct SVG children (the icon) and set animation property */
    > * svg {
        transition: all 0.2ms ease-in-out;
    }
`;

const StyledCryptoAmount = styled(FormattedCryptoAmount)<{ isZeroValuePhishing: boolean }>`
    color: ${({ theme, isZeroValuePhishing }) =>
        isZeroValuePhishing ? theme.TYPE_LIGHT_GREY : theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    white-space: nowrap;
    flex: 0;
`;

const HelpLink = styled(TrezorLink)`
    color: ${({ theme }) => theme.TYPE_ORANGE};

    path {
        fill: ${({ theme }) => theme.TYPE_ORANGE};
    }
`;

interface TransactionHeadingProps {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    useSingleRowLayout: boolean;
    txItemIsHovered: boolean;
    nestedItemIsHovered: boolean;
    onClick: () => void;
    dataTestBase: string;
}

export const TransactionHeading = ({
    transaction,
    isPending,
    useSingleRowLayout,
    txItemIsHovered,
    nestedItemIsHovered,
    onClick,
    dataTestBase,
}: TransactionHeadingProps) => {
    const [headingIsHovered, setHeadingIsHovered] = useState(false);

    const theme = useTheme();

    const symbol = getTxHeaderSymbol(transaction);
    const nTokens = transaction.tokens.length;
    const isTokenTransaction = transaction.tokens.length;
    const isSingleTokenTransaction = nTokens === 1;
    const target = transaction.targets[0];
    const transfer = transaction.tokens[0];
    const targetSymbol = transaction.type === 'self' ? transaction.symbol : symbol;
    let amount = null;

    const isZeroValuePhishing = getIsZeroValuePhishing(transaction);

    if (useSingleRowLayout) {
        // For single token transaction instead of showing coin amount we rather show the token amount
        // In case of sent-to-self transaction we rely on getTargetAmount returning transaction.amount which will be equal to a fee
        const targetAmount =
            !isSingleTokenTransaction || transaction.type === 'self'
                ? getTargetAmount(target, transaction)
                : formatAmount(transfer.amount, transfer.decimals);
        const operation = !isTokenTransaction
            ? getTxOperation(transaction.type)
            : getTxOperation(transfer.type);

        amount = targetAmount && (
            <StyledCryptoAmount
                value={targetAmount}
                symbol={targetSymbol}
                signValue={operation}
                isZeroValuePhishing={isZeroValuePhishing}
            />
        );
    }

    if (transaction.type === 'joint') {
        const transactionAmount = new BigNumber(transaction.amount);
        const abs = transactionAmount.abs().toString();

        amount = (
            <StyledCryptoAmount
                value={formatNetworkAmount(abs, transaction.symbol)}
                symbol={transaction.symbol}
                signValue={transactionAmount}
                isZeroValuePhishing={isZeroValuePhishing}
            />
        );
    }

    return (
        <>
            <Wrapper
                onMouseEnter={() => setHeadingIsHovered(true)}
                onMouseLeave={() => setHeadingIsHovered(false)}
                onClick={onClick}
            >
                <HeadingWrapper data-test={`${dataTestBase}/heading`}>
                    {isZeroValuePhishing && (
                        <TooltipSymbol
                            content={
                                <Translation
                                    id="TR_ZERO_PHISHING_TOOLTIP"
                                    values={{
                                        a: chunks => (
                                            <HelpLink
                                                href={HELP_CENTER_ZERO_VALUE_ATTACKS}
                                                icon="EXTERNAL_LINK"
                                                size="small"
                                            >
                                                {chunks}
                                            </HelpLink>
                                        ),
                                    }}
                                />
                            }
                            icon="WARNING"
                        />
                    )}
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

            {transaction.type !== 'failed' && amount}
        </>
    );
};
