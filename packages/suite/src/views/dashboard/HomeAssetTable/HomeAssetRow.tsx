import { memo } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { Column, Row, Table, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/device-utils';
import { TokenIcon } from '@trezor/product-components';

import { PriceTicker, TrendTicker } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

import { HomeAssetBalance } from './HomeAssetBalance';
import { type AssetAccounts, selectAssetBalance } from './homeAssetTableSelectors';
import {
    HOME_ASSET_CELL_PADDING,
    getAssetDisplaySymbol,
    getAssetName,
} from './homeAssetTableUtils';

type HomeAssetRowProps = {
    assetAccounts: AssetAccounts;
    deviceState: StaticSessionId;
    hasBorderTop?: boolean;
};

export const HomeAssetRow = memo(
    ({ assetAccounts, deviceState, hasBorderTop }: HomeAssetRowProps) => {
        const { NetworkNameFormatter } = useFormatters();
        const [{ symbol, contractAddress }] = assetAccounts;
        const tokenInfo = useSelector(
            state => selectAssetBalance(state, deviceState, assetAccounts)?.tokenInfo,
        );

        return (
            <Table.Row
                hasBorderTop={hasBorderTop}
                data-testid={`@dashboard/home-asset-item/${symbol}/${contractAddress ?? 'coin'}`}
            >
                <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                    <Row gap={12}>
                        <TokenIcon
                            symbol={symbol}
                            contractAddress={contractAddress}
                            size={32}
                            showNetworkIcon
                            placeholder={getAssetDisplaySymbol({ symbol, tokenInfo })}
                        />
                        <Column alignItems="flex-start" gap={2}>
                            <Text
                                typographyStyle="body-md"
                                data-testid="@dashboard/home-asset/name"
                            >
                                {getAssetName({ symbol, tokenInfo })}
                            </Text>
                            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                                <NetworkNameFormatter value={symbol} />
                            </Text>
                        </Column>
                    </Row>
                </Table.Cell>

                <Table.Cell align="end">
                    <Column alignItems="flex-end" gap={2}>
                        <PriceTicker symbol={symbol} contractAddress={contractAddress} />
                        <TrendTicker symbol={symbol} contractAddress={contractAddress} />
                    </Column>
                </Table.Cell>

                <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                    <HomeAssetBalance assetAccounts={assetAccounts} deviceState={deviceState} />
                </Table.Cell>
            </Table.Row>
        );
    },
);
