import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Badge, Column, Row, Text } from '@trezor/components';
import { hasOwn } from '@trezor/utils';

type AssetDetailsProps = {
    name: string;
    displaySymbol: string;
    isDisabled?: boolean;
} & (
    | {
          networkSymbol: NetworkSymbol;
      }
    | {
          networkName: string;
      }
);

export function AssetDetails({
    name,
    displaySymbol,
    isDisabled = false,
    ...props
}: AssetDetailsProps) {
    const badge = hasOwn(props, 'networkSymbol')
        ? getNetwork(props.networkSymbol).name
        : props.networkName;

    return (
        <Column overflow="hidden" alignItems="flex-start" justifyContent="flex-start">
            <Text
                typographyStyle="body-md"
                ellipsisLineCount={1}
                maxWidth="100%"
                isDisabled={isDisabled}
            >
                {name}
            </Text>
            <Row gap={8} alignItems="center">
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    isDisabled={isDisabled}
                >
                    {displaySymbol}
                </Text>
                {badge !== name && <Badge size="small">{badge}</Badge>}
            </Row>
        </Column>
    );
}
