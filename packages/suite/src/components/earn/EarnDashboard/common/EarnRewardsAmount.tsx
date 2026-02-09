import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { H4, TextVariant } from '@trezor/components';

type EarnRewardsAmountProps = {
    symbol: NetworkSymbol;
    rewards: string;
    apy: number | null;
    variant?: TextVariant;
};

export const EarnRewardsAmount = ({ symbol, rewards, apy, variant }: EarnRewardsAmountProps) => {
    const { CryptoAmountFormatter } = useFormatters();

    if (!apy)
        return (
            <H4 variant={variant}>
                <Translation id="TR_EARN_APY_REQUIRED" />
            </H4>
        );

    return (
        <H4 variant={variant}>
            {CryptoAmountFormatter.format(rewards, {
                symbol,
                isBalance: true,
                withSymbol: true,
                isEllipsisAppended: false,
                maxDisplayedDecimals: 8,
            })}
        </H4>
    );
};
