import { useMemo } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import {
    getStakingDataForNetwork,
    selectAccountClaimTransactions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';
import { Button, Card, Column, InfoItem, Paragraph, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ChecksIcon, InfoIcon, LightningIcon, SpinnerGapIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

type ClaimCardProps = {
    account: Account;
};

export const ClaimCard = ({ account }: ClaimCardProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const claimTxs = useSelector(state => selectAccountClaimTransactions(state, account.key));
    const { isClaimingDisabled, claimingMessageContent } = useMessageSystemStaking(account.symbol);

    const isClaimPending = useMemo(() => claimTxs.some(tx => isPending(tx)), [claimTxs]);

    const { canClaim = false, claimableAmount = '0' } = getStakingDataForNetwork(account) ?? {};

    const openClaimModal = () => {
        if (!isClaimingDisabled) {
            dispatch(
                openModal({
                    type: 'claim',
                    account,
                }),
            );

            analytics.report({
                type: events.stakingClaimEvent.name,
                payload: {
                    action: 'continue',
                    step: 'staking-dashboard',
                    networkSymbol: account.symbol,
                },
            });
        }
    };

    if (!canClaim) return null;

    const content = (
        <>
            <Paragraph typographyStyle="headline-sm" intent="brand">
                <FormattedCryptoAmount
                    data-testid="@staking/can-claim"
                    value={claimableAmount}
                    symbol={account.symbol}
                />
            </Paragraph>
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <BaseCurrencyValue
                    showApproximationIndicator
                    amount={claimableAmount}
                    symbol={account.symbol}
                />
            </Paragraph>
        </>
    );

    return isClaimPending ? (
        <Card data-testid="@staking/can-claim-card">
            <InfoItem label={<Translation id="TR_STAKE_CLAIM_PENDING" />} icon={SpinnerGapIcon}>
                {content}
            </InfoItem>
        </Card>
    ) : (
        <Card data-testid="@staking/can-claim-card">
            <Column flex="1" gap={24}>
                <InfoItem
                    label={<Translation id="TR_STAKE_UNSTAKED_AND_READY_TO_CLAIM" />}
                    icon={ChecksIcon}
                >
                    {content}
                </InfoItem>
                <InfoItem label={<Translation id="TR_STAKE_TIME_TO_CLAIM" />} icon={LightningIcon}>
                    <Paragraph typographyStyle="headline-sm">
                        <Translation id="TR_EARN_INSTANTLY" />
                    </Paragraph>
                </InfoItem>

                <Tooltip content={claimingMessageContent}>
                    <Button
                        onClick={openClaimModal}
                        isDisabled={isClaimingDisabled}
                        iconLeft={isClaimingDisabled ? InfoIcon : undefined}
                        data-testid="@account/staking/claim-button"
                    >
                        <Translation id="TR_STAKE_CLAIM" />
                    </Button>
                </Tooltip>
            </Column>
        </Card>
    );
};
