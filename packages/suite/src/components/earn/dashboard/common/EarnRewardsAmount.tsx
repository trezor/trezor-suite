import { AssetValue } from '@suite/assets';
import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asAmountUnit } from '@suite-common/wallet-utils';
import { Text, type TextProps } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

type EarnRewardsAmountProps = {
    symbol: NetworkSymbol;
    /** The token the reward is denominated in; without one, it is the native coin. */
    contractAddress?: TokenAddress;
    rewards: string;
    apy: number | null;
    intent?: TextProps['intent'];
    priority?: TextProps['priority'];
    isDisabled?: TextProps['isDisabled'];
    'data-testid'?: string;
};

export const EarnRewardsAmount = ({
    symbol,
    contractAddress,
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
                typographyStyle="body-sm"
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
            {contractAddress ? (
                <AssetValue
                    amount={asAmountUnit(new BigNumber(rewards))}
                    networkSymbol={symbol}
                    contractAddress={contractAddress}
                    isCompact
                />
            ) : (
                <HiddenPlaceholder>
                    <CryptoAmountFormatter
                        value={rewards}
                        symbol={symbol}
                        isBalance
                        withSymbol
                        formatStyle="compact-balance"
                    />
                </HiddenPlaceholder>
            )}
        </Text>
    );
};
