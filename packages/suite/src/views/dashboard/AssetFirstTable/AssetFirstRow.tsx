import { memo } from 'react';

import { Column, Icon, Row, Table, Text } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import {
    BaseCurrencyValue,
    FormattedCryptoAmount,
    PriceTicker,
    TrendTicker,
} from 'src/components/suite';

import { type AssetRow } from './assetFirstTableSelectors';
import {
    ASSET_FIRST_CELL_PADDING,
    getAssetDisplaySymbol,
    getAssetName,
    getNetworkName,
} from './assetFirstTableUtils';

type AssetFirstRowProps = {
    row: AssetRow;
    hasBorderTop?: boolean;
    onClick?: () => void;
};

export const AssetFirstRow = memo(({ row, hasBorderTop, onClick }: AssetFirstRowProps) => {
    const { symbol, contractAddress, cryptoBalance, tokenInfo } = row;

    return (
        <Table.Row
            hasBorderTop={hasBorderTop}
            onClick={onClick}
            data-testid={`@dashboard/asset-first-item/${symbol}/${contractAddress ?? 'coin'}`}
        >
            <Table.Cell padding={ASSET_FIRST_CELL_PADDING.first}>
                <Row gap={12}>
                    <TokenIcon
                        symbol={symbol}
                        contractAddress={contractAddress}
                        size={32}
                        showNetworkIcon
                        placeholder={getAssetDisplaySymbol({ symbol, tokenInfo })}
                    />
                    <Column alignItems="flex-start" gap={2}>
                        <Text typographyStyle="body-md" data-testid="@dashboard/asset-first/name">
                            {getAssetName({ symbol, tokenInfo })}
                        </Text>
                        <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                            {getNetworkName(symbol)}
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

            <Table.Cell
                align="end"
                padding={onClick === undefined ? ASSET_FIRST_CELL_PADDING.last : undefined}
            >
                <Column alignItems="flex-end" gap={2}>
                    <BaseCurrencyValue
                        amount={cryptoBalance.toFixed()}
                        symbol={symbol}
                        tokenAddress={contractAddress}
                    />
                    <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                        <FormattedCryptoAmount
                            value={cryptoBalance.toFixed()}
                            symbol={tokenInfo?.symbol ?? symbol}
                            contractAddress={contractAddress}
                        />
                    </Text>
                </Column>
            </Table.Cell>

            {onClick !== undefined && (
                <Table.Cell align="end" padding={ASSET_FIRST_CELL_PADDING.last}>
                    <Icon as={CaretRightIcon} size={20} intent="neutral" priority="secondary" />
                </Table.Cell>
            )}
        </Table.Row>
    );
});
