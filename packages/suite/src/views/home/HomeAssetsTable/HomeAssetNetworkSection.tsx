import { memo } from 'react';

import {
    selectNetworkFiatValue,
    selectNetworkName,
    selectShownWalletAssetKeysOfNetwork,
} from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Table, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

import { HomeAssetRow } from './HomeAssetRow';
import { HOME_ASSET_CELL_PADDING } from './homeAssetTableLayout';

type HomeAssetNetworkSectionProps = {
    symbol: NetworkSymbol;
    isCapped: boolean;
};

export const HomeAssetNetworkSection = memo(
    ({ symbol, isCapped }: HomeAssetNetworkSectionProps) => {
        const { BaseCurrencyAmountFormatter } = useFormatters();
        const name = useSelector(state => selectNetworkName(state, symbol));
        const fiatValue = useSelector(state => selectNetworkFiatValue(state, symbol));
        const assetKeys = useSelector(state =>
            selectShownWalletAssetKeysOfNetwork(state, symbol, isCapped),
        );

        return (
            <>
                <Table.Row
                    isHighlightedOnHover={false}
                    data-testid={`@dashboard/home-asset-group/${symbol}`}
                >
                    <Table.Cell colSpan={2} padding={HOME_ASSET_CELL_PADDING.first}>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            {name ?? symbol.toUpperCase()}
                        </Text>
                    </Table.Cell>
                    <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                        {fiatValue !== undefined && (
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <HiddenPlaceholder>
                                    {BaseCurrencyAmountFormatter.format(
                                        asBaseCurrencyAmount(new BigNumber(fiatValue)),
                                    )}
                                </HiddenPlaceholder>
                            </Text>
                        )}
                    </Table.Cell>
                </Table.Row>
                {assetKeys.map(assetKey => (
                    <HomeAssetRow key={assetKey} assetKey={assetKey} hasBorderTop={false} />
                ))}
            </>
        );
    },
);
