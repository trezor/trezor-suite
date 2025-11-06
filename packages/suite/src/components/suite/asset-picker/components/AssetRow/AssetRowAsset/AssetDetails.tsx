import styled from 'styled-components';

import { getNetwork } from '@suite-common/wallet-config';
import { Badge, Column, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AssetRowAssetDataProps } from '../../../constants';

const TextWrapper = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
`;

const BadgeWrapper = styled.div`
    flex: none;
`;

type AssetDetailsProps = Pick<AssetRowAssetDataProps, 'name' | 'symbol' | 'networkSymbol'>;

export function AssetDetails({ name, symbol, networkSymbol }: AssetDetailsProps) {
    return (
        <Column flex="1">
            <TextWrapper>
                <Text typographyStyle="body" textWrap="nowrap">
                    {name}
                </Text>
            </TextWrapper>
            <Row gap={spacings.xs} alignItems="center">
                <Text typographyStyle="hint" variant="tertiary">
                    {symbol}
                </Text>
                <BadgeWrapper>
                    <Badge size="medium">{getNetwork(networkSymbol).name}</Badge>
                </BadgeWrapper>
            </Row>
        </Column>
    );
}
