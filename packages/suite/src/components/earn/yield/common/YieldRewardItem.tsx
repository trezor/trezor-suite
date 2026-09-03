import { HiddenPlaceholder } from '@suite/discreet-mode';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

type YieldRewardItemProps = {
    formattedAmount: string;
    formattedFiatAmount: string | null;
    tokenSymbol: string;
    tokenAddress?: string | null;
    networkSymbol: NetworkSymbol;
};

export const YieldRewardItem = ({
    formattedAmount,
    formattedFiatAmount,
    tokenSymbol,
    tokenAddress,
    networkSymbol,
}: YieldRewardItemProps) => (
    <Row justifyContent="space-between" alignItems="center" gap={16}>
        <Row gap={12} alignItems="center" flex="1" overflow="hidden">
            <TokenIcon
                symbol={networkSymbol}
                contractAddress={tokenAddress}
                placeholder={tokenSymbol}
                size={24}
                isBordered={false}
            />
            <HiddenPlaceholder>
                <Text
                    typographyStyle="body-md-strong"
                    data-testid="@yield/rewards/reward-amount-with-symbol"
                >
                    {formattedAmount} {tokenSymbol}
                </Text>
            </HiddenPlaceholder>
        </Row>

        <HiddenPlaceholder>
            <Text
                typographyStyle="body-md"
                intent="neutral"
                priority="secondary"
                data-testid="@yield/rewards/reward-fiat-amount"
            >
                {formattedFiatAmount ? `≈ ${formattedFiatAmount}` : '—'}
            </Text>
        </HiddenPlaceholder>
    </Row>
);
