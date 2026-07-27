import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useFormatters } from '@suite-common/formatters';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Banner, Row, Skeleton, Tooltip } from '@trezor/components';
import { HandCoinsIcon, InfoIcon } from '@trezor/icons';

type EarnYieldClaimRewardsBannerProps = {
    value: BaseCurrencyAmount;
    currency: string;
    isValueLoading?: boolean;
    isClaimDisabled?: boolean;
    claimDisabledTooltip?: React.ReactNode;
    onClaim?: () => void;
};

export const EarnYieldClaimRewardsBanner = ({
    value,
    currency,
    isValueLoading,
    isClaimDisabled,
    claimDisabledTooltip,
    onClaim,
}: EarnYieldClaimRewardsBannerProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const handleOnClaim = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'earn-dashboard',
                to: 'claim-select-account-modal',
            },
        });

        onClaim?.();
    };

    return (
        <Banner
            intent="neutral"
            icon={HandCoinsIcon}
            description={
                <Row gap={4} alignItems="center">
                    <span>
                        <Translation id="TR_EARN_CLAIM_REWARDS_LABEL" />:
                    </span>
                    {isValueLoading ? (
                        <Skeleton width={50} height={16} animate />
                    ) : (
                        <>
                            {!isClaimDisabled && '≈ '}
                            <BaseCurrencyAmountFormatter value={value} currency={currency} />
                        </>
                    )}
                </Row>
            }
            rightContent={
                <Tooltip content={claimDisabledTooltip}>
                    <Banner.Button
                        isDisabled={isClaimDisabled}
                        iconLeft={claimDisabledTooltip ? InfoIcon : undefined}
                        onClick={handleOnClaim}
                    >
                        <Translation id="TR_EARN_CLAIM_REWARDS_BUTTON" />
                    </Banner.Button>
                </Tooltip>
            }
        />
    );
};
