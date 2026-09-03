import { useEffect, useMemo, useRef } from 'react';

import { selectSelectedAccount } from '@suite/account';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { getStakingDataForNetwork } from '@suite-common/staking';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectAccountClaimTransactions } from '@suite-common/wallet-core';
import { isPending } from '@suite-common/wallet-utils';
import { Button, Card, Column, InfoItem, Paragraph, Tooltip } from '@trezor/components';
import { ChecksIcon, InfoIcon, LightningIcon, SpinnerGapIcon } from '@trezor/icons';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

export const ClaimCard = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const selectedAccount = useSelector(selectSelectedAccount);
    const claimTxs = useSelector(state =>
        selectAccountClaimTransactions(state, selectedAccount?.key || null),
    );
    const { isClaimingDisabled, claimingMessageContent } = useMessageSystemStaking(
        selectedAccount?.symbol,
    );

    const isClaimPending = useMemo(() => claimTxs.some(tx => isPending(tx)), [claimTxs]);

    const { canClaim = false, claimableAmount = '0' } =
        getStakingDataForNetwork(selectedAccount) ?? {};
    const isClaimButtonDisabled = isClaimingDisabled || !selectedAccount;

    // Show success message when claim tx confirmation is complete.
    const prevIsClaimPending = useRef(false);
    const dispatch = useDispatch();

    useEffect(() => {
        // Reset prevIsClaimPending when account changes
        prevIsClaimPending.current = false;
    }, [selectedAccount?.key]);

    useEffect(() => {
        if (prevIsClaimPending.current && !isClaimPending && selectedAccount?.symbol) {
            dispatch(
                notificationsActions.addToast({
                    type: 'successful-claim',
                    symbol: selectedAccount.symbol,
                }),
            );
            prevIsClaimPending.current = false;
        }

        prevIsClaimPending.current = isClaimPending;
    }, [dispatch, isClaimPending, selectedAccount?.symbol, selectedAccount?.key]);

    const openClaimModal = () => {
        if (!isClaimButtonDisabled) {
            dispatch(
                openModal({
                    type: 'claim',
                    account: selectedAccount,
                }),
            );

            analytics.report({
                type: events.stakingClaimEvent.name,
                payload: {
                    action: 'continue',
                    step: 'staking-dashboard',
                    networkSymbol: selectedAccount?.symbol,
                },
            });
        }
    };

    if (!canClaim || !selectedAccount?.symbol) return null;

    const content = (
        <>
            <Paragraph typographyStyle="headline-sm" intent="brand">
                <FormattedCryptoAmount
                    data-testid="@staking/can-claim"
                    value={claimableAmount}
                    symbol={selectedAccount?.symbol}
                />
            </Paragraph>
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <BaseCurrencyValue
                    showApproximationIndicator
                    amount={claimableAmount}
                    symbol={selectedAccount?.symbol}
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
                        <Translation id="TR_STAKE_INSTANT" />
                    </Paragraph>
                </InfoItem>

                <Tooltip content={claimingMessageContent}>
                    <Button
                        onClick={openClaimModal}
                        isDisabled={isClaimButtonDisabled}
                        iconLeft={isClaimButtonDisabled ? InfoIcon : undefined}
                        data-testid="@account/staking/claim-button"
                    >
                        <Translation id="TR_STAKE_CLAIM" />
                    </Button>
                </Tooltip>
            </Column>
        </Card>
    );
};
