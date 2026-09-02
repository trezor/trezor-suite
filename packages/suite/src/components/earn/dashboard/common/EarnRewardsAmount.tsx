import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { Text, type TextProps } from '@trezor/components';

type EarnRewardsAmountProps = {
    symbol: NetworkSymbol | TokenSymbol;
    rewards: string;
    apy: number | null;
    intent?: TextProps['intent'];
    priority?: TextProps['priority'];
    isDisabled?: TextProps['isDisabled'];
    'data-testid'?: string;
};

export const EarnRewardsAmount = ({
    symbol,
    rewards,
    apy,
    intent,
    priority,
    isDisabled,
    'data-testid': dataTestId,
}: EarnRewardsAmountProps) => {
    const { CryptoAmountFormatter } = useFormatters();

    if (!apy)
        return (
            <Text
                typographyStyle="body-sm-strong"
                intent={intent}
                priority={priority}
                isDisabled={isDisabled}
            >
                <Translation id="TR_EARN_APY_REQUIRED" />
            </Text>
        );

    return (
        <Text
            typographyStyle="body-sm-strong"
            data-testid={dataTestId}
            intent={intent}
            priority={priority}
            isDisabled={isDisabled}
        >
            <HiddenPlaceholder>
                <CryptoAmountFormatter
                    value={rewards}
                    symbol={symbol}
                    isBalance
                    withSymbol
                    isEllipsisAppended={false}
                    maxDisplayedDecimals={8}
                />
            </HiddenPlaceholder>
        </Text>
    );
};
