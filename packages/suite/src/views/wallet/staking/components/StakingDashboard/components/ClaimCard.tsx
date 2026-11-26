import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import {
    formatStakingAmount,
    getStakingOperationAvailability,
    selectIsStakingOperationPending,
    useStakingAccountPosition,
} from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Button, Card, InfoItem, Paragraph, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { InfoIcon, SpinnerGapIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { ReadyToClaimCard } from '#src/components/earn/staking/ReadyToClaimCard';
import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useStakingOperationSwitch } from '#src/hooks/earn/useStakingOperationSwitch';
import { useSelector } from '#src/hooks/suite/useSelector';

type ClaimCardProps = {
    account: Account;
};

export const ClaimCard = ({ account }: ClaimCardProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    const { productId, position, totals, access } = useStakingAccountPosition(account.key);

    const isClaimPending = useSelector(state =>
        selectIsStakingOperationPending(state, account.key, 'withdraw'),
    );
    const { message: claimingMessageContent } = useStakingOperationSwitch(productId, 'withdraw');

    const availability = getStakingOperationAvailability({
        position,
        access,
        operation: 'withdraw',
    });

    const isClaimingDisabled = availability !== 'available';
    const isClaimWithheld = availability === 'withheld';

    const claimableAmount = formatStakingAmount({
        amount: totals.withdrawable,
        networkSymbol: account.symbol,
    });

    const canClaim = isPositiveBalance(totals.withdrawable);

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
                    networkSymbol={account.symbol}
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
        <ReadyToClaimCard
            data-testid="@staking/can-claim-card"
            amount={content}
            action={
                <Tooltip content={claimingMessageContent}>
                    <Button
                        onClick={openClaimModal}
                        isDisabled={isClaimingDisabled}
                        iconLeft={isClaimWithheld ? InfoIcon : undefined}
                        data-testid="@account/staking/claim-button"
                    >
                        <Translation id="TR_STAKE_CLAIM" />
                    </Button>
                </Tooltip>
            }
        />
    );
};
