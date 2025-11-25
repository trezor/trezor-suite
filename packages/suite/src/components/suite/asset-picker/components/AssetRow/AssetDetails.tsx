import styled from 'styled-components';

import { NetworkSymbol, getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';
import { Badge, Column, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { hasOwn } from '@trezor/utils';

const BadgeWrapper = styled.div`
    flex: none;
`;

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
            <Text typographyStyle="body" ellipsisLineCount={1}>
                {name}
            </Text>
            <Row gap={spacings.xs} alignItems="center">
                <Text typographyStyle="hint" variant="tertiary">
                    {getDisplaySymbol(symbol)}
                </Text>
                {badge !== name && (
                    <BadgeWrapper>
                        <Badge size="small">{badge}</Badge>
                    </BadgeWrapper>
                )}
            </Row>
        </Column>
    );
}
