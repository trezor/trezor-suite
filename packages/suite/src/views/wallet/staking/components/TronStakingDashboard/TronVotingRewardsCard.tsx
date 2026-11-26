import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import {
    formatStakingAmount,
    selectStakingAccountPositionDetails,
    useStakingAccountPosition,
} from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import {
    Box,
    Button,
    Card,
    Column,
    Row,
    TOOLTIP_DELAY_NONE,
    Text,
    Tooltip,
} from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { CountdownTimer } from '#src/components/suite/CountdownTimer';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { getStakingAccountRouteParams } from '#src/constants/suite/staking';
import { useTronFirmwareUpgradeModal } from '#src/hooks/earn/useTronFirmwareUpgradeModal';
import { useTronRewardsClaimCoolDown } from '#src/hooks/earn/useTronRewardsClaimCoolDown';
import { useSelector } from '#src/hooks/suite/useSelector';

import { useTronStakingOperation } from './hooks/useTronStakingOperation';

interface TronVotingRewardsCardProps {
    account: Account;
}

export const TronVotingRewardsCard = ({ account }: TronVotingRewardsCardProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    const { productId, totals } = useStakingAccountPosition(account.key);

    const stakingDetails = useSelector(state =>
        selectStakingAccountPositionDetails(state, account.key, 'tron-staking'),
    );

    const claim = useTronStakingOperation(productId, 'claim');
    const { openFirmwareModal, firmwareModal } = useTronFirmwareUpgradeModal();

    const rewards = formatStakingAmount({ amount: totals.rewards, networkSymbol: account.symbol });
    // The countdown re-enables the claim at the deadline, before the position is synced again.
    const { isClaimOnCooldown, claimCooldownEndsAt } = useTronRewardsClaimCoolDown(
        stakingDetails?.rewardClaimAvailableAt ?? null,
    );

    if (!isPositiveBalance(rewards)) {
        return null;
    }

    const goToClaim = () => {
        if (claim.isDisabled) return;

        if (claim.isFirmwareOutdated) {
            openFirmwareModal('TR_EARN_TRON_CLAIM_TITLE');

            return;
        }

        dispatch(
            gotoThunk({
                routeName: 'earn-staking-tron-claim',
                params: getStakingAccountRouteParams(account),
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
    };

    const claimButtonTooltipProps = claim.isDisabled
        ? ({ content: claim.message } as const)
        : ({
              isActive: isClaimOnCooldown,
              tooltipMaxWidth: 220,
              content: claimCooldownEndsAt !== null && (
                  <CountdownTimer
                      deadline={claimCooldownEndsAt}
                      message="TR_EARN_TRON_CLAIM_COOLDOWN"
                      minUnit="minute"
                      unitDisplay="narrow"
                  />
              ),
              placement: 'top',
              cursor: 'not-allowed',
              delayShow: TOOLTIP_DELAY_NONE,
          } as const);

    return (
        <>
            {firmwareModal}

            <Card paddingType="none" data-testid="@staking/tron-rewards-card/container">
                <Box padding={{ vertical: 12, horizontal: 20 }}>
                    <Row justifyContent="space-between" alignItems="center">
                        <Text typographyStyle="body-sm-strong">
                            <Translation id="TR_EARN_TRON_VOTING_REWARDS" />
                        </Text>
                        <Row gap={16} alignItems="center">
                            <Column gap={2} alignItems="flex-end">
                                <Text
                                    typographyStyle="body-md-strong"
                                    data-testid="@staking/tron-rewards-card/amount"
                                >
                                    <FormattedCryptoAmount
                                        value={rewards}
                                        networkSymbol={account.symbol}
                                    />
                                </Text>
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <BaseCurrencyValue
                                        amount={rewards}
                                        symbol={account.symbol}
                                        showApproximationIndicator
                                    />
                                </Text>
                            </Column>

                            <Tooltip {...claimButtonTooltipProps}>
                                <Button
                                    intent="neutral"
                                    priority="secondary"
                                    onClick={goToClaim}
                                    isDisabled={isClaimOnCooldown || claim.isDisabled}
                                    data-testid="@staking/tron-rewards-card/claim-button"
                                >
                                    <Translation id="TR_STAKE_CLAIM" />
                                </Button>
                            </Tooltip>
                        </Row>
                    </Row>
                </Box>
            </Card>
        </>
    );
};
