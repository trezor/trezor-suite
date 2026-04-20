import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Banner } from '@trezor/components';

type EarnYieldClaimRewardsBannerProps = {
    value: BaseCurrencyAmount;
    currency: string;
    onClaim?: () => void;
};

export const EarnYieldClaimRewardsBanner = ({
    value,
    currency,
    onClaim,
}: EarnYieldClaimRewardsBannerProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    return (
        <Banner
            intent="neutral"
            icon="handCoins"
            description={
                <>
                    <Translation id="TR_EARN_CLAIM_REWARDS_LABEL" />:{' '}
                    <BaseCurrencyAmountFormatter value={value} currency={currency} />
                </>
            }
            rightContent={
                <Banner.Button onClick={onClaim}>
                    <Translation id="TR_EARN_CLAIM_REWARDS_BUTTON" />
                </Banner.Button>
            }
        />
    );
};
