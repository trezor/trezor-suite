import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { H4, TextVariant } from '@trezor/components';

interface StakingDashboardRewardsAmountProps {
    accountSymbol: NetworkSymbol;
    rewards: string;
    apy: number | null;
    variant?: TextVariant;
}

export const StakingDashboardRewardsAmount = ({
    accountSymbol,
    rewards,
    apy,
    variant,
}: StakingDashboardRewardsAmountProps) => {
    const { CryptoAmountFormatter } = useFormatters();

    if (!apy)
        return (
            <H4 variant={variant}>
                <Translation id="TR_STAKE_APY_REQUIRED" />
            </H4>
        );

    return (
        <H4 variant={variant}>
            {CryptoAmountFormatter.format(rewards, {
                symbol: accountSymbol,
                isBalance: true,
                withSymbol: true,
                isEllipsisAppended: false,
                maxDisplayedDecimals: 8,
            })}
        </H4>
    );
};
