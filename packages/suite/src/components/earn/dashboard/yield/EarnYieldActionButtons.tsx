import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Button, Tooltip } from '@trezor/components';

type EarnYieldActionButtonsProps = {
    hasSuppliedBalance: boolean;
    hasAdditionalDepositAmount: boolean;
    isDepositMoreDisabled: boolean;
    isDepositDisabled: boolean;
    isSupplyNowDisabled: boolean;
    isWithdrawDisabled: boolean;
    depositMessageContent: ReactNode;
    withdrawMessageContent: ReactNode;
    onSupplyMore: () => void;
    onWithdraw: () => void;
    onSupplyNow: () => void;
    onBuy: () => void;
};

export const EarnYieldActionButtons = ({
    hasSuppliedBalance,
    hasAdditionalDepositAmount,
    isDepositMoreDisabled,
    isDepositDisabled,
    isSupplyNowDisabled,
    isWithdrawDisabled,
    depositMessageContent,
    withdrawMessageContent,
    onSupplyMore,
    onWithdraw,
    onSupplyNow,
    onBuy,
}: EarnYieldActionButtonsProps) => (
    <>
        {hasSuppliedBalance && (
            <>
                <Tooltip content={depositMessageContent}>
                    <Button
                        size="small"
                        isDisabled={isDepositMoreDisabled}
                        iconLeft={isDepositDisabled ? 'info' : undefined}
                        onClick={onSupplyMore}
                    >
                        <Translation id="TR_EARN_YIELD_DASHBOARD_SUPPLY_MORE" />
                    </Button>
                </Tooltip>
                <Tooltip content={withdrawMessageContent}>
                    <Button
                        size="small"
                        intent="brand"
                        priority="secondary"
                        isDisabled={isWithdrawDisabled}
                        iconLeft={isWithdrawDisabled ? 'info' : undefined}
                        onClick={onWithdraw}
                    >
                        <Translation id="TR_EARN_YIELD_DASHBOARD_WITHDRAW" />
                    </Button>
                </Tooltip>
            </>
        )}

        {!hasSuppliedBalance && hasAdditionalDepositAmount && (
            <Tooltip content={depositMessageContent}>
                <Button
                    size="small"
                    isDisabled={isSupplyNowDisabled}
                    iconLeft={isDepositDisabled ? 'info' : undefined}
                    onClick={onSupplyNow}
                >
                    <Translation id="TR_EARN_YIELD_DASHBOARD_SUPPLY_NOW" />
                </Button>
            </Tooltip>
        )}

        {!hasSuppliedBalance && !hasAdditionalDepositAmount && (
            <Button size="small" intent="neutral" priority="secondary" onClick={onBuy}>
                <Translation id="TR_BUY" />
            </Button>
        )}
    </>
);
