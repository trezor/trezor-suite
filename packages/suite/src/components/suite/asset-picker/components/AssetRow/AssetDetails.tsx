import styled from 'styled-components';

import { NetworkSymbol, getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';
import { Badge, Column, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { hasOwn } from '@trezor/utils';

const TextWrapper = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
`;

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
        <Column alignItems="flex-start" justifyContent="flex-start">
            <TextWrapper>
                <Text typographyStyle="body" textWrap="nowrap">
                    {name}
                </Text>
            </TextWrapper>
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
