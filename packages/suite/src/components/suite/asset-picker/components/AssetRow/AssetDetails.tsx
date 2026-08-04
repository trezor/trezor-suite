import { useServices } from '@suite-common/dependency-injection';
import { selectGetNetworkConfigDep } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Badge, Column, Row, Text } from '@trezor/components';
import { hasOwn } from '@trezor/utils';

type AssetDetailsProps = {
    name: string;
    displaySymbol: string;
} & (
    | {
          networkSymbol: NetworkSymbol;
      }
    | {
          networkName: string;
      }
);

export function AssetDetails({ name, displaySymbol, ...props }: AssetDetailsProps) {
    const { getNetworkConfig } = useServices(selectGetNetworkConfigDep);
    const badge = hasOwn(props, 'networkSymbol')
        ? getNetworkConfig(props.networkSymbol).name
        : props.networkName;

    return (
        <Column overflow="hidden" alignItems="flex-start" justifyContent="flex-start">
            <Text typographyStyle="body-md" ellipsisLineCount={1} maxWidth="100%">
                {name}
            </Text>
            <Row gap={8} alignItems="center">
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {displaySymbol}
                </Text>
                {badge !== name && <Badge size="small">{badge}</Badge>}
            </Row>
        </Column>
    );
}
