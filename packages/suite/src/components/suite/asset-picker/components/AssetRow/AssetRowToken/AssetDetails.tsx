import styled from 'styled-components';

import { NetworkSymbol, getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';
import { Badge, Column, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

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
    networkSymbol: NetworkSymbol;
};

export function AssetDetails({ name, symbol, networkSymbol }: AssetDetailsProps) {
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
                <BadgeWrapper>
                    <Badge size="small">{getNetwork(networkSymbol).name}</Badge>
                </BadgeWrapper>
            </Row>
        </Column>
    );
}
