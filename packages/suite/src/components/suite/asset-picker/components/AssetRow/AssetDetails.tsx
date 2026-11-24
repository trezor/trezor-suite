import { AssetName, AssetSymbol } from '@suite/assets';
import { type AssetId, parseAssetId } from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { selectIsNativeTokenNetworkNameRedundant } from '@suite-common/networks';
import { Badge, Column, Row, Text } from '@trezor/components';

import { useSelector } from '#src/hooks/suite/useSelector';

type AssetDetailsProps = {
    assetId: AssetId;
    isDisabled?: boolean;
};

export function AssetDetails({ assetId, isDisabled = false }: AssetDetailsProps) {
    const { networkSymbol, contractAddress } = parseAssetId(assetId);
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
                <AssetName assetId={assetId} />
            </Text>
            <Row gap={8} alignItems="center">
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    isDisabled={isDisabled}
                >
                    <AssetSymbol assetId={assetId} />
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
