import { type MouseEvent, type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Button, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

import { type StakingAccountStatus } from './hooks/useStakingAccountStatus';

type EarnStakingActionButtonsProps = {
    stakingStatus: StakingAccountStatus;
    isStakingDisabled: boolean | undefined;
    stakingMessageContent: ReactNode;
    isVotingDisabled: boolean | undefined;
    votingMessageContent: ReactNode;
    canClaim: boolean;
    isClaimButtonDisabled: boolean | undefined;
    claimingMessageContent: ReactNode;
    onBuy: (event: MouseEvent<HTMLButtonElement>) => void;
    onStake: (event: MouseEvent<HTMLButtonElement>) => void;
    onStakeNow: (event: MouseEvent<HTMLButtonElement>) => void;
    onUpdateProvider: (event: MouseEvent<HTMLButtonElement>) => void;
    onVote: (event: MouseEvent<HTMLButtonElement>) => void;
    onClaim: (event: MouseEvent<HTMLButtonElement>) => void;
};

export const EarnStakingActionButtons = ({
    stakingStatus,
    isStakingDisabled,
    stakingMessageContent,
    isVotingDisabled,
    votingMessageContent,
    canClaim,
    isClaimButtonDisabled,
    claimingMessageContent,
    onBuy,
    onStake,
    onStakeNow,
    onUpdateProvider,
    onVote,
    onClaim,
}: EarnStakingActionButtonsProps) => (
    <>
        {(stakingStatus === 'insufficient-funds' ||
            stakingStatus === 'staking-max' ||
            stakingStatus === 'staked-but-insufficient-funds') &&
            (canClaim ? (
                <Tooltip content={claimingMessageContent}>
                    <Button
                        intent="brand"
                        size="small"
                        isDisabled={isClaimButtonDisabled}
                        iconLeft={isClaimButtonDisabled ? InfoIcon : undefined}
                        onClick={onClaim}
                        data-testid="@account/staking/claim-button"
                    >
                        <Translation id="TR_STAKE_CLAIM" />
                    </Button>
                </Tooltip>
            ) : (
                <Button intent="neutral" priority="secondary" size="small" onClick={onBuy}>
                    <Translation id="TR_BUY" />
                </Button>
            ))}

        {stakingStatus === 'staking-active' && (
            <Tooltip content={stakingMessageContent}>
                <Button
                    intent="brand"
                    size="small"
                    isDisabled={isStakingDisabled}
                    iconLeft={isStakingDisabled ? InfoIcon : undefined}
                    onClick={onStake}
                >
                    <Translation id="TR_EARN_STAKING_DASHBOARD_STAKE_MORE" />
                </Button>
            </Tooltip>
        )}

        {stakingStatus === 'staking-inactive' && (
            <Tooltip content={stakingMessageContent}>
                <Button
                    intent="brand"
                    size="small"
                    isDisabled={isStakingDisabled}
                    iconLeft={isStakingDisabled ? InfoIcon : undefined}
                    onClick={onStakeNow}
                >
                    <Translation id="TR_EARN_STAKING_DASHBOARD_STAKE_NOW" />
                </Button>
            </Tooltip>
        )}

        {stakingStatus === 'staking-outdated-provider' && (
            <Tooltip content={stakingMessageContent}>
                <Button
                    intent="brand"
                    size="small"
                    isDisabled={isStakingDisabled}
                    iconLeft={isStakingDisabled ? InfoIcon : undefined}
                    onClick={onUpdateProvider}
                >
                    <Translation id="TR_EARN_UPDATE_PROVIDER" />
                </Button>
            </Tooltip>
        )}

        {stakingStatus === 'staking-remaining-votes' && (
            <Tooltip content={votingMessageContent}>
                <Button
                    intent="brand"
                    size="small"
                    isDisabled={isVotingDisabled}
                    iconLeft={isVotingDisabled ? InfoIcon : undefined}
                    onClick={onVote}
                >
                    <Translation id="TR_EARN_TRON_VOTE" />
                </Button>
            </Tooltip>
        )}
    </>
);
