import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { FirmwareUpgradeNeededModal } from '@suite/firmware-upgrade';
import { Translation, useTranslation } from '@suite/intl';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { type Account } from '@suite-common/wallet-types';
import {
    getTronRewardClaimCooldownEndsAt,
    getTronStakingRewards,
    isTronClaimSupported,
    isTronRewardClaimOnCooldown,
} from '@suite-common/wallet-utils';
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
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue, CountdownTimer, FormattedCryptoAmount } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { useFirmwareUpgradeModal } from 'src/hooks/suite/useFirmwareUpgradeModal';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

interface TronVotingRewardsCardProps {
    account: Account;
}

export const TronVotingRewardsCard = ({ account }: TronVotingRewardsCardProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { device } = useDevice();
    const { translationString } = useTranslation();
    const { isFirmwareModalOpen, openFirmwareModal, closeFirmwareModal, updateFirmware } =
        useFirmwareUpgradeModal();

    const rewards = getTronStakingRewards(account);
    const isClaimOnCooldown = isTronRewardClaimOnCooldown(account);
    const claimCooldownEndsAt = getTronRewardClaimCooldownEndsAt(account);
    const isClaimFirmwareOutdated = !isTronClaimSupported(device);

    const { isClaimingDisabled, claimingMessageContent } = useMessageSystemStaking(account.symbol);

    if (new BigNumber(rewards).lte(0)) {
        return null;
    }

    const goToClaim = () => {
        if (isClaimingDisabled) {
            return;
        }

        if (isClaimFirmwareOutdated) {
            openFirmwareModal();

            return;
        }

        dispatch(
            goto({
                routeName: 'earn-tron-claim',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
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

    const claimButtonTooltipProps = isClaimingDisabled
        ? ({ content: claimingMessageContent } as const)
        : ({
              isActive: isClaimOnCooldown,
              tooltipMaxWidth: 220,
              content: claimCooldownEndsAt !== null && (
                  <CountdownTimer
                      deadline={claimCooldownEndsAt * 1000}
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
            {isFirmwareModalOpen && (
                <FirmwareUpgradeNeededModal
                    onClose={closeFirmwareModal}
                    onUpdate={updateFirmware}
                    featureName={translationString('TR_EARN_TRON_CLAIM_TITLE')}
                />
            )}
            <Card paddingType="none">
                <Box padding={{ vertical: 12, horizontal: 20 }}>
                    <Row justifyContent="space-between" alignItems="center">
                        <Text typographyStyle="body-sm-strong">
                            <Translation id="TR_EARN_TRON_VOTING_REWARDS" />
                        </Text>
                        <Row gap={16} alignItems="center">
                            <Column gap={2} alignItems="flex-end">
                                <Text typographyStyle="body-md-strong">
                                    <FormattedCryptoAmount
                                        value={rewards}
                                        symbol={account.symbol}
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
                                    isDisabled={isClaimOnCooldown || isClaimingDisabled}
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
