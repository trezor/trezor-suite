import { useEffect, useMemo, useRef } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectAccountClaimTransactions } from '@suite-common/wallet-core';
import { getStakingDataForNetwork, isPending } from '@suite-common/wallet-utils';
import { Button, Card, Column, InfoItem, Paragraph, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useAnalytics } from 'src/support/useAnalytics';

export const ClaimCard = () => {
    const analytics = useAnalytics();
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
            <InfoItem label={<Translation id="TR_STAKE_CLAIM_PENDING" />} iconName="spinnerGap">
                {content}
            </InfoItem>
        </Card>
    ) : (
        <Card data-testid="@staking/can-claim-card" variant="primary">
            <Column flex="1" gap={spacings.xl}>
                <InfoItem
                    label={<Translation id="TR_STAKE_UNSTAKED_AND_READY_TO_CLAIM" />}
                    iconName="checks"
                >
                    {content}
                </InfoItem>
                <InfoItem label={<Translation id="TR_STAKE_TIME_TO_CLAIM" />} iconName="lightning">
                    <Paragraph typographyStyle="headline-sm">
                        <Translation id="TR_STAKE_INSTANT" />
                    </Paragraph>
                </InfoItem>

                <Tooltip content={claimingMessageContent}>
                    <Button
                        onClick={openClaimModal}
                        isDisabled={isClaimButtonDisabled}
                        iconLeft={isClaimButtonDisabled ? 'info' : undefined}
                        data-testid="@account/staking/claim-button"
                    >
                        <Translation id="TR_STAKE_CLAIM" />
                    </Button>
                </Tooltip>
            </Column>
        </Card>
    );
};
