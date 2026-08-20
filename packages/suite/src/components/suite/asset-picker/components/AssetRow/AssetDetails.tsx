import {
    type NetworkSymbol,
    getNetwork,
    shouldShowNetworkBadge,
} from '@suite-common/wallet-config';
import { Badge, Column, Row, Text } from '@trezor/components';

type AssetDetailsProps = {
    name: string;
    displaySymbol: string;
    networkSymbol: NetworkSymbol;
};

export function AssetDetails({ name, displaySymbol, networkSymbol }: AssetDetailsProps) {
    return (
        <Column overflow="hidden" alignItems="flex-start" justifyContent="flex-start">
            <Text typographyStyle="body-md" ellipsisLineCount={1} maxWidth="100%">
                {name}
            </Text>
            <Row gap={8} alignItems="center">
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {displaySymbol}
                </Text>
                {shouldShowNetworkBadge(networkSymbol) && (
                    <Badge size="small">{getNetwork(networkSymbol).name}</Badge>
                )}
            </Row>
        </Column>
    );
}
