import { NetworkSymbol, getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';
import { Badge, Column, Row, Text } from '@trezor/components';
import { hasOwn } from '@trezor/utils';

type AssetDetailsProps = {
    name: string;
    symbol: string;
} & (
    | {
          networkSymbol: NetworkSymbol;
      }
    | {
          networkName: string;
      }
);

export function AssetDetails({ name, symbol, ...props }: AssetDetailsProps) {
    const badge = hasOwn(props, 'networkSymbol')
        ? getNetwork(props.networkSymbol).name
        : props.networkName;

    return (
        <Column overflow="hidden" alignItems="flex-start" justifyContent="flex-start">
            <Text typographyStyle="body" ellipsisLineCount={1} maxWidth="100%">
                {name}
            </Text>
            <Row gap={8} alignItems="center">
                <Text typographyStyle="hint" variant="tertiary">
                    {getDisplaySymbol(symbol)}
                </Text>
                {badge !== name && <Badge size="small">{badge}</Badge>}
            </Row>
        </Column>
    );
}
