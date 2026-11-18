import { AssetName, AssetSymbol } from '@suite/assets';
import { useFormatters } from '@suite-common/formatters';
import { selectIsNativeTokenNetworkNameRedundant } from '@suite-common/networks';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Badge, Column, Row, Text } from '@trezor/components';

import { useSelector } from '#src/hooks/suite';

type AssetDetailsProps = {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    isDisabled?: boolean;
};

export function AssetDetails({
    networkSymbol,
    contractAddress,
    isDisabled = false,
}: AssetDetailsProps) {
    const { NetworkNameFormatter } = useFormatters();
    const isNetworkNameRedundant = useSelector(state =>
        selectIsNativeTokenNetworkNameRedundant(state, networkSymbol),
    );
    const shouldShowNetworkBadge = !!contractAddress || !isNetworkNameRedundant;

    return (
        <Column overflow="hidden" alignItems="flex-start" justifyContent="flex-start">
            <Text
                typographyStyle="body-md"
                ellipsisLineCount={1}
                maxWidth="100%"
                isDisabled={isDisabled}
            >
                <AssetName networkSymbol={networkSymbol} contractAddress={contractAddress} />
            </Text>
            <Row gap={8} alignItems="center">
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    isDisabled={isDisabled}
                >
                    <AssetSymbol networkSymbol={networkSymbol} contractAddress={contractAddress} />
                </Text>
                {shouldShowNetworkBadge && (
                    <Badge size="small">
                        <NetworkNameFormatter value={networkSymbol} />
                    </Badge>
                )}
            </Row>
        </Column>
    );
}
