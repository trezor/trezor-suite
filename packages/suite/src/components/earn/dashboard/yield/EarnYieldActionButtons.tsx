import { type MouseEvent, type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Button, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

import { EarnBuyButton } from '../common/EarnBuyButton';

type EarnYieldActionButtonsProps = {
    hasDepositedBalance: boolean;
    hasAdditionalDepositAmount: boolean;
    isDepositMoreDisabled: boolean;
    isDepositDisabled: boolean;
    isDepositNowDisabled: boolean;
    isWithdrawDisabled: boolean;
    depositMessageContent: ReactNode;
    withdrawMessageContent: ReactNode;
    onDepositMore: (event: MouseEvent<HTMLButtonElement>) => void;
    onWithdraw: (event: MouseEvent<HTMLButtonElement>) => void;
    onDepositNow: (event: MouseEvent<HTMLButtonElement>) => void;
    onBuy: (event: MouseEvent<HTMLButtonElement>) => void;
};

export const EarnYieldActionButtons = ({
    hasDepositedBalance,
    hasAdditionalDepositAmount,
    isDepositMoreDisabled,
    isDepositDisabled,
    isDepositNowDisabled,
    isWithdrawDisabled,
    depositMessageContent,
    withdrawMessageContent,
    onDepositMore,
    onWithdraw,
    onDepositNow,
    onBuy,
}: EarnYieldActionButtonsProps) => (
    <>
        {hasDepositedBalance && (
            <>
                <Tooltip content={depositMessageContent}>
                    <Button
                        data-testid="@earn/dashboard/deposit-more-button"
                        size="small"
                        isDisabled={isDepositMoreDisabled}
                        iconLeft={isDepositDisabled ? InfoIcon : undefined}
                        onClick={onDepositMore}
                    >
                        <Translation id="TR_EARN_YIELD_DASHBOARD_DEPOSIT_MORE" />
                    </Button>
                </Tooltip>
                <Tooltip content={withdrawMessageContent}>
                    <Button
                        data-testid="@earn/dashboard/withdraw-button"
                        size="small"
                        intent="brand"
                        priority="secondary"
                        isDisabled={isWithdrawDisabled}
                        iconLeft={isWithdrawDisabled ? InfoIcon : undefined}
                        onClick={onWithdraw}
                    >
                        <Translation id="TR_EARN_YIELD_DASHBOARD_WITHDRAW" />
                    </Button>
                </Tooltip>
            </>
        )}

        {!hasDepositedBalance && hasAdditionalDepositAmount && (
            <Tooltip content={depositMessageContent}>
                <Button
                    data-testid="@earn/dashboard/deposit-now-button"
                    size="small"
                    isDisabled={isDepositNowDisabled}
                    iconLeft={isDepositDisabled ? InfoIcon : undefined}
                    onClick={onDepositNow}
                >
                    <Translation id="TR_EARN_YIELD_DASHBOARD_DEPOSIT_NOW" />
                </Button>
            </Tooltip>
        )}

        {!hasDepositedBalance && !hasAdditionalDepositAmount && (
            <EarnBuyButton onClick={onBuy} data-testid="@earn/dashboard/buy-button" />
        )}
    </>
);
