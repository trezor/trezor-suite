import { FormattedMessage } from 'react-intl';

import styled from 'styled-components';

import { AssetLogo, Row, Tooltip, useElevation } from '@trezor/components';
import { Elevation, mapElevationToBorder, spacings, spacingsPx } from '@trezor/theme';
import { Network } from '@suite-common/wallet-config';

import { CheckableTag } from './CheckableTag';

const NetworkTabsWrapper = styled.div<{ $elevation: Elevation }>`
    margin-left: -${spacingsPx.md};
    width: calc(100% + ${spacings.md * 2}px);
    padding: ${spacings.zero} ${spacingsPx.md} ${spacingsPx.lg};
    border-bottom: 1px solid
        ${({ theme, $elevation }) => mapElevationToBorder({ $elevation, theme })};
`;

export type NetworkFilterCategory = {
    name: Network['name'];
    symbol: Network['symbol'];
    coingeckoId: Network['coingeckoId'];
    coingeckoNativeId?: Network['coingeckoNativeId'];
};

export type SelectAssetSearchCategory = {
    coingeckoId: string;
    coingeckoNativeId?: string;
} | null;

interface NetworkTabsProps {
    tabs: NetworkFilterCategory[];
    activeTab: SelectAssetSearchCategory;
    setActiveTab: (value: SelectAssetSearchCategory) => void;
    networkCount: number;
}

export const NetworkTabs = ({ tabs, activeTab, setActiveTab, networkCount }: NetworkTabsProps) => {
    const { elevation } = useElevation();

    // TODO: FormattedMessage - resolve messages sharing https://github.com/trezor/trezor-suite/issues/5325}
    return (
        <NetworkTabsWrapper $elevation={elevation}>
            <Row gap={spacings.xs} flexWrap="wrap">
                <CheckableTag
                    $elevation={elevation}
                    $variant={activeTab === null ? 'primary' : 'tertiary'}
                    onClick={() => {
                        setActiveTab(null);
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
                {tabs.map(network => (
                    <CheckableTag
                        $elevation={elevation}
                        $variant={
                            activeTab?.coingeckoId === network.coingeckoId ? 'primary' : 'tertiary'
                        }
                        onClick={() => {
                            if (
                                activeTab?.coingeckoId === network.coingeckoId &&
                                activeTab?.coingeckoNativeId === network.coingeckoNativeId
                            ) {
                                setActiveTab(null);

                                return;
                            }

                            if (network.coingeckoId) {
                                setActiveTab({
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
