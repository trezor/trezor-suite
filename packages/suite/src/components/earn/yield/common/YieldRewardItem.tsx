import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Row, Text } from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';

import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';

type YieldRewardItemProps = {
    formattedAmount: string;
    formattedFiatAmount: string | null;
    tokenSymbol: string;
    tokenAddress: string;
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
            <AssetLogo
                symbol={networkSymbol}
                contractAddress={tokenAddress}
                placeholder={tokenSymbol}
                size={24}
            />
            <HiddenPlaceholder>
                <Text typographyStyle="body-md-strong">
                    {formattedAmount} {tokenSymbol}
                </Text>
            </HiddenPlaceholder>
        </Row>

        <HiddenPlaceholder>
            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                {formattedFiatAmount ? `≈ ${formattedFiatAmount}` : '—'}
            </Text>
        </HiddenPlaceholder>
    </Row>
);
