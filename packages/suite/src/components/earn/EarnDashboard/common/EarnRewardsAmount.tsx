import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { H4, type TextProps } from '@trezor/components';

type EarnRewardsAmountProps = {
    symbol: NetworkSymbol | TokenSymbol;
    rewards: string;
    apy: number | null;
    intent?: TextProps['intent'];
    priority?: TextProps['priority'];
    isDisabled?: TextProps['isDisabled'];
};

export const EarnRewardsAmount = ({
    symbol,
    rewards,
    apy,
    intent,
    priority,
    isDisabled,
}: EarnRewardsAmountProps) => {
    const { CryptoAmountFormatter } = useFormatters();

    if (!apy)
        return (
            <H4 intent={intent} priority={priority} isDisabled={isDisabled}>
                <Translation id="TR_EARN_APY_REQUIRED" />
            </H4>
        );

    return (
        <H4 intent={intent} priority={priority} isDisabled={isDisabled}>
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
