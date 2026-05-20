import { type MouseEvent, type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Button, Tooltip } from '@trezor/components';

import { type StakingAccountStatus } from './hooks/useStakingAccountStatus';

type EarnStakingActionButtonsProps = {
    stakingStatus: StakingAccountStatus;
    isStakingDisabled: boolean | undefined;
    stakingMessageContent: ReactNode;
    onBuy: (event: MouseEvent<HTMLButtonElement>) => void;
    onStake: (event: MouseEvent<HTMLButtonElement>) => void;
};

export const EarnStakingActionButtons = ({
    stakingStatus,
    isStakingDisabled,
    stakingMessageContent,
    onBuy,
    onStake,
}: EarnStakingActionButtonsProps) => (
    <>
        {(stakingStatus === 'insufficient-funds' ||
            stakingStatus === 'staking-max' ||
            stakingStatus === 'staked-but-insufficient-funds') && (
            <Button intent="neutral" priority="secondary" size="small" onClick={onBuy}>
                <Translation id="TR_BUY" />
            </Button>
        )}

        {(stakingStatus === 'staking-active' || stakingStatus === 'staking-inactive') && (
            <Tooltip content={stakingMessageContent}>
                <Button
                    intent="brand"
                    size="small"
                    isDisabled={isStakingDisabled}
                    iconLeft={isStakingDisabled ? 'info' : undefined}
                    onClick={onStake}
                >
                    <Translation
                        id={
                            stakingStatus === 'staking-active'
                                ? 'TR_EARN_STAKING_DASHBOARD_STAKE_MORE'
                                : 'TR_EARN_STAKING_DASHBOARD_STAKE_NOW'
                        }
                    />
                </Button>
            </Tooltip>
        )}

        {stakingStatus === 'staking-outdated-provider' && (
            <Tooltip content={stakingMessageContent}>
                <Button
                    intent="brand"
                    size="small"
                    isDisabled={isStakingDisabled}
                    iconLeft={isStakingDisabled ? 'info' : undefined}
                    onClick={onStake}
                >
                    <Translation id="TR_EARN_UPDATE_PROVIDER" />
                </Button>
            </Tooltip>
        )}
    </>
);
