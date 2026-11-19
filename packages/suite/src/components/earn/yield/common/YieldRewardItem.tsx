import { AssetIcon, AssetValue } from '@suite/assets';
import { HiddenPlaceholder } from '@suite/discreet-mode';
import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AmountUnit } from '@suite-common/wallet-utils';
import { Row, Text } from '@trezor/components';

type YieldRewardItemProps = {
    amount: AmountUnit;
    formattedFiatAmount: string | null;
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
};

export const YieldRewardItem = ({
    amount,
    formattedFiatAmount,
    networkSymbol,
    contractAddress,
}: YieldRewardItemProps) => {
    const token = useTokenMetadata(networkSymbol, contractAddress);

    return (
        <Row
            justifyContent="space-between"
            alignItems="center"
            gap={16}
            data-testid={`@yield/rewards/item/${token?.symbol?.toLowerCase() ?? contractAddress}`}
        >
            <Row gap={12} alignItems="center" flex="1" overflow="hidden">
                <AssetIcon
                    networkSymbol={networkSymbol}
                    contractAddress={contractAddress}
                    size={24}
                    isBordered={false}
                />
                <Text
                    typographyStyle="body-md-strong"
                    data-testid="@yield/rewards/reward-amount-with-symbol"
                >
                    <AssetValue
                        amount={amount}
                        networkSymbol={networkSymbol}
                        contractAddress={contractAddress}
                    />
                </Text>
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
};
