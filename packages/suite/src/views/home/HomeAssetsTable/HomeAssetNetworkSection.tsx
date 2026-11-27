import { memo } from 'react';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import {
    selectDisplayedWalletAssetKeysOfNetwork,
    selectNetworkFiatValue,
    selectNetworkName,
} from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Table, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useSelector } from '#src/hooks/suite/useSelector';

import { HomeAssetRowContainer } from './HomeAssetRowContainer';

type HomeAssetNetworkSectionProps = {
    symbol: NetworkSymbol;
    rowLimit: number | undefined;
};

export const HomeAssetNetworkSection = memo(
    ({ symbol, rowLimit }: HomeAssetNetworkSectionProps) => {
        const { BaseCurrencyAmountFormatter } = useFormatters();
        const name = useSelector(state => selectNetworkName(state, symbol));
        const fiatValue = useSelector(state => selectNetworkFiatValue(state, symbol));
        const assetKeys = useSelector(state =>
            selectDisplayedWalletAssetKeysOfNetwork(state, symbol, rowLimit),
        );

        return (
            <>
                <Table.Row
                    isHighlightedOnHover={false}
                    data-testid={`@dashboard/home-asset-group/${symbol}`}
                >
                    <Table.Cell colSpan={2}>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            {name ?? symbol.toUpperCase()}
                        </Text>
                    </Table.Cell>
                    <Table.Cell align="end">
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
                    <HomeAssetRowContainer
                        key={assetKey}
                        assetKey={assetKey}
                        hasBorderTop={false}
                        assetNameTestId={`@dashboard/home-asset-group/${symbol}/asset`}
                    />
                ))}
            </>
        );
    },
);
