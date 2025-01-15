import { FormattedMessage } from 'react-intl';

import styled from 'styled-components';

import { Row, Tooltip, useElevation } from '@trezor/components';
import { Elevation, mapElevationToBorder, spacings, spacingsPx } from '@trezor/theme';
import {
    getNetwork,
    NetworkSymbol,
    networkSymbolCollection,
    type Network,
} from '@suite-common/wallet-config';

import { CheckableTag } from './CheckableTag';
import { CoinLogo } from '../CoinLogo/CoinLogo';

const NetworkTabsWrapper = styled.div<{ $elevation: Elevation }>`
    margin-left: -${spacingsPx.md};
    width: calc(100% + ${spacings.md * 2}px);
    padding: ${spacings.zero} ${spacingsPx.md} ${spacingsPx.lg};
    border-bottom: 1px solid
        ${({ theme, $elevation }) => mapElevationToBorder({ $elevation, theme })};
`;

export type SelectAssetSearchCategory = Network | null;

interface NetworkTabsProps {
    tabs: NetworkSymbol[];
    activeTab: SelectAssetSearchCategory;
    setActiveTab: (value: SelectAssetSearchCategory) => void;
    networkCount: number;
    'data-testid'?: string;
}

export const NetworkTabs = ({
    tabs,
    activeTab,
    setActiveTab,
    networkCount,
    'data-testid': dataTestId,
}: NetworkTabsProps) => {
    const { elevation } = useElevation();
    // sort according to networks
    const networkKeys = networkSymbolCollection.filter(item => tabs.includes(item));
    const networkTabs = networkKeys.map(key => getNetwork(key));

    // TODO: FormattedMessage - resolve messages sharing https://github.com/trezor/trezor-suite/issues/5325}
    return (
        <NetworkTabsWrapper $elevation={elevation}>
            <Row gap={spacings.xs} flexWrap="wrap">
                <CheckableTag
                    data-testid={`${dataTestId}/all-networks`}
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
                {networkTabs.map(network => (
                    <CheckableTag
                        data-testid={`${dataTestId}/${network.symbol}`}
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
                                setActiveTab(network);
                            }
                        }}
                        key={network.coingeckoId}
                    >
                        <Row gap={spacings.xxs}>
                            {network.coingeckoNativeId && (
                                <CoinLogo size={20} symbol={network.symbol} />
                            )}
                            {network.name}
                        </Row>
                    </CheckableTag>
                ))}
            </Row>
        </NetworkTabsWrapper>
    );
};
