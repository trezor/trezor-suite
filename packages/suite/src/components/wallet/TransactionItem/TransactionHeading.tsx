import { useState } from 'react';

import styled, { useTheme } from 'styled-components';

import {
    formatNetworkAmount,
    getTargetAmount,
    getTxHeaderSymbol,
    getTxOperation,
    isSupportedEthStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { Icon, Link, Row, Tooltip } from '@trezor/components';
import { spacings, typography } from '@trezor/theme';
import { HELP_CENTER_ZERO_VALUE_ATTACKS } from '@trezor/urls';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { FormattedCryptoAmount } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { WalletAccountTransaction } from 'src/types/wallet';

import { InstantStakeBadge } from './InstantStakeBadge';
import { TransactionHeader } from './TransactionHeader';
import { BlurWrapper } from './TransactionItemBlurWrapper';

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

const ChevronIconWrapper = styled.div<{ $show: boolean; $animate: boolean }>`
    display: flex;
    margin-left: ${({ $animate }) => ($animate ? '5px' : '3px')};
    opacity: ${({ $show }) => ($show ? 1 : 0)};
    transition:
        visibility 0s,
        opacity 0.15s linear,
        margin-left 0.15s ease-in-out;

    /* select non-direct SVG children (the icon) and set animation property */
    > * svg {
        transition: all 0.2ms ease-in-out;
    }
`;

const StyledCryptoAmount = styled(FormattedCryptoAmount)<{ $isPhishingTransaction: boolean }>`
    color: ${({ theme, $isPhishingTransaction }) =>
        $isPhishingTransaction ? theme.textSubdued : theme.textDefault};
    ${typography.body}
    white-space: nowrap;
    flex: 0;
`;

interface TransactionHeadingProps {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    useSingleRowLayout: boolean;
    txItemIsHovered: boolean;
    nestedItemIsHovered: boolean;
    onClick: () => void;
    isPhishingTransaction: boolean;
    dataTestBase: string;
}

export const TransactionHeading = ({
    transaction,
    isPending,
    useSingleRowLayout,
    txItemIsHovered,
    nestedItemIsHovered,
    onClick,
    isPhishingTransaction,
    dataTestBase,
}: TransactionHeadingProps) => {
    const [headingIsHovered, setHeadingIsHovered] = useState(false);

    const theme = useTheme();

    const symbol = getTxHeaderSymbol(transaction);
    const target = transaction.targets[0];
    const targetSymbol = transaction.type === 'self' ? transaction.symbol : symbol;
    let amount = null;

    if (useSingleRowLayout) {
        // In case of sent-to-self transaction we rely on getTargetAmount returning transaction.amount which will be equal to a fee
        const targetAmount = getTargetAmount(target, transaction);
        const operation = getTxOperation(transaction.type);

        amount = targetAmount && (
            <StyledCryptoAmount
                value={targetAmount}
                symbol={targetSymbol}
                signValue={operation}
                $isPhishingTransaction={isPhishingTransaction}
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
                $isPhishingTransaction={isPhishingTransaction}
            />
        );
    }
    // hide amount for solana unstake transactions
    if (transaction?.solanaSpecific?.stakeOperation?.type === 'unstake') {
        amount = null;
    }

    return (
        <>
            <Wrapper
                onMouseEnter={() => setHeadingIsHovered(true)}
                onMouseLeave={() => setHeadingIsHovered(false)}
                onClick={onClick}
            >
                <HeadingWrapper data-testid={`${dataTestBase}/heading`}>
                    {isPhishingTransaction && (
                        <Tooltip
                            content={
                                <Translation
                                    id="TR_ZERO_PHISHING_TOOLTIP"
                                    values={{
                                        a: chunks => (
                                            <Link href={HELP_CENTER_ZERO_VALUE_ATTACKS}>
                                                {chunks}
                                            </Link>
                                        ),
                                    }}
                                />
                            }
                            maxWidth={250}
                            hasIcon
                        >
                            <span />
                        </Tooltip>
                    )}
                    <BlurWrapper $isBlurred={isPhishingTransaction}>
                        <Row gap={spacings.xxs} flexWrap="wrap">
                            <TransactionHeader transaction={transaction} isPending={isPending} />
                            {isSupportedEthStakingNetworkSymbol(transaction.symbol) && (
                                <InstantStakeBadge transaction={transaction} symbol={symbol} />
                            )}
                        </Row>
                    </BlurWrapper>
                </HeadingWrapper>

                <ChevronIconWrapper
                    $show={txItemIsHovered}
                    $animate={nestedItemIsHovered || headingIsHovered}
                >
                    <Icon
                        size={nestedItemIsHovered || headingIsHovered ? 18 : 16}
                        color={theme.textDefault}
                        name="caretRight"
                    />
                </ChevronIconWrapper>
            </Wrapper>

            {transaction.type !== 'failed' && transaction.type !== 'self' && amount}
        </>
    );
};
