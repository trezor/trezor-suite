import { AssetLogo, Row, Tooltip, useElevation } from '@trezor/components';
import { Elevation, mapElevationToBorder, spacings, spacingsPx } from '@trezor/theme';
import { SelectAssetNetworkProps, SelectAssetSearchCategoryType } from './SelectAssetModal';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { CheckableTag } from './CheckableTag';

interface NetworkTabsWrapperProps {
    $elevation: Elevation;
}

const NetworkTabsWrapper = styled.div<NetworkTabsWrapperProps>`
    margin-left: -${spacingsPx.md};
    width: calc(100% + ${spacings.md * 2}px);
    padding: ${spacings.zero} ${spacingsPx.md} ${spacingsPx.lg};
    border-bottom: 1px solid
        ${({ theme, $elevation }) => mapElevationToBorder({ $elevation, theme })};
`;

interface NetworkTabsProps {
    networkCategories: SelectAssetNetworkProps[];
    networkCount: number;
    searchCategory: SelectAssetSearchCategoryType;
    setSearchCategory: (value: SelectAssetSearchCategoryType) => void;
}

export const NetworkTabs = ({
    networkCategories,
    networkCount,
    searchCategory,
    setSearchCategory,
}: NetworkTabsProps) => {
    const { elevation } = useElevation();

    // TODO: FormattedMessage - resolve messages sharing https://github.com/trezor/trezor-suite/issues/5325}
    return (
        <NetworkTabsWrapper $elevation={elevation}>
            <Row gap={spacings.xs} flexWrap="wrap">
                <CheckableTag
                    $elevation={elevation}
                    $variant={searchCategory === null ? 'primary' : 'tertiary'}
                    onClick={() => {
                        setSearchCategory(null);
                    }}
                >
                    <Tooltip
                        content={
                            <FormattedMessage
                                id="TR_ALL_NETWORKS_TOOLTIP"
                                defaultMessage="View tokens from all {networkCount} networks. Use the buttons on the right to filter by top networks."
                                values={{ networkCount }}
                            />
                        }
                    >
                        <FormattedMessage
                            id="TR_ALL_NETWORKS"
                            defaultMessage="All networks ({networkCount})"
                            values={{ networkCount }}
                        />
                    </Tooltip>
                </CheckableTag>
                {networkCategories.map(network => (
                    <CheckableTag
                        $elevation={elevation}
                        $variant={
                            searchCategory?.coingeckoId === network.coingeckoId
                                ? 'primary'
                                : 'tertiary'
                        }
                        onClick={() => {
                            if (
                                searchCategory?.coingeckoId === network.coingeckoId &&
                                searchCategory?.coingeckoNativeId === network.coingeckoNativeId
                            ) {
                                setSearchCategory(null);

                                return;
                            }

                            if (network.coingeckoId) {
                                setSearchCategory({
                                    coingeckoId: network.coingeckoId,
                                    coingeckoNativeId: network.coingeckoNativeId,
                                });
                            }
                        }}
                        key={network.coingeckoId}
                    >
                        <Row gap={spacings.xxs}>
                            {network.coingeckoNativeId && (
                                <AssetLogo
                                    size={20}
                                    coingeckoId={network.coingeckoNativeId}
                                    placeholder={network.symbol}
                                />
                            )}
                            {network.name}
                        </Row>
                    </CheckableTag>
                ))}
            </Row>
        </NetworkTabsWrapper>
    );
};
