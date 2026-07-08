import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Button, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

type EarnYieldActionButtonsProps = {
    hasDepositedBalance: boolean;
    hasAdditionalDepositAmount: boolean;
    isDepositMoreDisabled: boolean;
    isDepositDisabled: boolean;
    isDepositNowDisabled: boolean;
    isWithdrawDisabled: boolean;
    depositMessageContent: ReactNode;
    withdrawMessageContent: ReactNode;
    onDepositMore: () => void;
    onWithdraw: () => void;
    onDepositNow: () => void;
    onBuy: () => void;
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
            <Button
                data-testid="@earn/dashboard/buy-button"
                size="small"
                intent="neutral"
                priority="secondary"
                onClick={onBuy}
            >
                <Translation id="TR_BUY" />
            </Button>
        )}
    </>
);
