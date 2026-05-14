import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Banner, Row, SkeletonRectangle, Tooltip } from '@trezor/components';

import { useAnalytics } from 'src/support/useAnalytics';

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
    const analytics = useAnalytics();
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
            icon="handCoins"
            description={
                <Row gap={4} alignItems="center">
                    <span>
                        <Translation id="TR_EARN_CLAIM_REWARDS_LABEL" />:
                    </span>
                    {isValueLoading ? (
                        <SkeletonRectangle width={50} height={16} animate />
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
                        iconLeft={claimDisabledTooltip ? 'info' : undefined}
                        onClick={handleOnClaim}
                    >
                        <Translation id="TR_EARN_CLAIM_REWARDS_BUTTON" />
                    </Banner.Button>
                </Tooltip>
            }
        />
    );
};
