import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type NetworkSymbol, getRepresentativeAssets } from '@suite-common/wallet-config';
import { Row, Text, Tooltip } from '@trezor/components';
import { TokenIconSet } from '@trezor/product-components';

const ICON_SIZE = 24;

const MoreBadge = styled.div`
    height: ${ICON_SIZE}px;
    min-width: ${ICON_SIZE}px;
    width: fit-content;
    /* stylelint-disable-next-line trezor/dimension-token-values -- Badge width scales with its text. */
    padding: 0 0.5em;
    margin-left: -8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${ICON_SIZE / 2}px;
    background: ${({ theme }) => theme.elementFillNeutralSofter};
`;

type RepresentativeAssetIconSetProps = {
    symbol: NetworkSymbol;
};

export const RepresentativeAssetIconSet = ({ symbol }: RepresentativeAssetIconSetProps) => {
    const representativeAssets = getRepresentativeAssets(symbol);

    if (representativeAssets.length === 0) {
        return null;
    }

    return (
        <Tooltip content={<Translation id="TR_REPRESENTATIVE_ASSETS_ON_NETWORK" />}>
            <Row alignItems="center">
                <TokenIconSet
                    size={ICON_SIZE}
                    gap={20}
                    maxVisibleIcons={5}
                    isReversed={false}
                    isCountVisible={false}
                    symbol={symbol}
                    tokens={representativeAssets}
                />
                {representativeAssets.length > 1 && (
                    <MoreBadge>
                        <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                            +<Translation id="TR_MORE" />
                        </Text>
                    </MoreBadge>
                )}
            </Row>
        </Tooltip>
    );
};
