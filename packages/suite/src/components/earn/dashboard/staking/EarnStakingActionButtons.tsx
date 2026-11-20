import { type MouseEvent, type ReactNode } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import { Button, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

import { type StakingAccountStatus } from './hooks/useStakingAccountStatus';
import { EarnBuyButton } from '../common/EarnBuyButton';

const CLAIM_LABEL_BY_NETWORK_TYPE: Partial<Record<NetworkType, TranslationKey>> = {
    cardano: 'TR_EARN_CLAIM_REWARDS',
    tron: 'TR_EARN_TRON_WITHDRAW_TITLE',
};

type EarnStakingActionButtonsProps = {
    stakingStatus: StakingAccountStatus;
    isStakingDisabled: boolean | undefined;
    stakingMessageContent: ReactNode;
    isVotingDisabled: boolean | undefined;
    votingMessageContent: ReactNode;
    canClaim: boolean;
    networkType: NetworkType;
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
    networkType,
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
                        intent={isClaimButtonDisabled ? 'neutral' : 'brand'}
                        priority={isClaimButtonDisabled ? 'secondary' : 'primary'}
                        size="small"
                        isDisabled={isClaimButtonDisabled}
                        iconLeft={isClaimButtonDisabled ? InfoIcon : undefined}
                        onClick={onClaim}
                        data-testid={
                            networkType === 'tron'
                                ? '@earn/dashboard/withdraw-button'
                                : '@account/staking/claim-button'
                        }
                    >
                        <Translation
                            id={
                                CLAIM_LABEL_BY_NETWORK_TYPE[networkType] ??
                                'TR_EARN_STAKING_DASHBOARD_CLAIM_FUNDS'
                            }
                        />
                    </Button>
                </Tooltip>
            ) : (
                <EarnBuyButton onClick={onBuy} data-testid="@earn/dashboard/buy-button" />
            ))}

        {stakingStatus === 'staking-active' && (
            <Tooltip content={stakingMessageContent}>
                <Button
                    intent="brand"
                    size="small"
                    isDisabled={isStakingDisabled}
                    iconLeft={isStakingDisabled ? InfoIcon : undefined}
                    onClick={onStake}
                    data-testid="@earn/dashboard/stake-more-button"
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
                    data-testid="@earn/dashboard/stake-now-button"
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
                    data-testid="@earn/dashboard/update-provider-button"
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
                    data-testid="@earn/dashboard/vote-button"
                >
                    <Translation id="TR_EARN_TRON_VOTE" />
                </Button>
            </Tooltip>
        )}
    </>
);
